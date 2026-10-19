import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { hash, compare } from "bcrypt-ts";
import { prisma } from "./prisma";

const SESSION_COOKIE = "invento-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  username: string;
  name: string;
  loggedIn: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export async function verifyPassword(password: string, hashStr: string): Promise<boolean> {
  // Check if hash is bcrypt (starts with $2)
  if (hashStr.startsWith("$2")) {
    return compare(password, hashStr);
  }

  // Legacy SHA-256 fallback (for existing admin migrations if any)
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const sha256Hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return sha256Hex === hashStr;
}

export async function createSession(user: { id: string; username: string; name: string }) {
  const payload: SessionPayload = {
    userId: user.id,
    username: user.username,
    name: user.name,
    loggedIn: true,
  };

  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function hasAnyUsers(): Promise<boolean> {
  try {
    const count = await prisma.user.count();
    return count > 0;
  } catch {
    return false;
  }
}

export async function verifyCredentials(
  username: string,
  password: string
): Promise<{ id: string; username: string; name: string } | null> {
  const cleanUsername = username.trim().toLowerCase();

  // 1. Look up user in database
  const user = await prisma.user.findUnique({
    where: { username: cleanUsername },
  });

  if (user) {
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) return null;

    // Auto-upgrade legacy sha256 hash to bcrypt if needed
    if (!user.password_hash.startsWith("$2")) {
      const newHash = await hashPassword(password);
      await prisma.user.update({
        where: { id: user.id },
        data: { password_hash: newHash },
      });
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
    };
  }

  // 2. Fallback for un-migrated existing instances:
  // If no users exist in database yet, check AUTH_USERNAME and AUTH_PASSWORD_HASH in .env
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const envUsername = process.env.AUTH_USERNAME;
      const envPasswordHash = process.env.AUTH_PASSWORD_HASH;

      if (envUsername && envPasswordHash && cleanUsername === envUsername.trim().toLowerCase()) {
        const isLegacyValid = await verifyPassword(password, envPasswordHash);
        if (isLegacyValid) {
          // Auto-seed this initial admin into DB!
          const newBcryptHash = await hashPassword(password);
          const createdUser = await prisma.user.create({
            data: {
              username: envUsername.trim().toLowerCase(),
              name: "Admin",
              password_hash: newBcryptHash,
            },
          });

          return {
            id: createdUser.id,
            username: createdUser.username,
            name: createdUser.name,
          };
        }
      }
    }
  } catch (err) {
    console.error("Error during fallback credential verification:", err);
  }

  return null;
}
