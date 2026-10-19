"use server";

import { prisma } from "@/lib/prisma";
import { getSession, hashPassword, verifyPassword, createSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function checkNeedsSetup(): Promise<boolean> {
  try {
    const userCount = await prisma.user.count();
    return userCount === 0;
  } catch (error) {
    console.error("Failed to check user count:", error);
    return false;
  }
}

export async function setupInitialAdmin(data: {
  username: string;
  name: string;
  password: string;
}) {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return { success: false, error: "Setup has already been completed. Please log in." };
  }

  const cleanUsername = data.username.trim().toLowerCase();
  const cleanName = data.name.trim();

  if (cleanUsername.length < 3) {
    return { success: false, error: "Username must be at least 3 characters long." };
  }
  if (!cleanName) {
    return { success: false, error: "Name is required." };
  }
  if (!data.password || data.password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  const passwordHash = await hashPassword(data.password);

  const adminUser = await prisma.user.create({
    data: {
      username: cleanUsername,
      name: cleanName,
      password_hash: passwordHash,
    },
  });

  await createSession({
    id: adminUser.id,
    username: adminUser.username,
    name: adminUser.name,
  });

  return { success: true };
}

export async function getUsers() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      created_at: true,
      updated_at: true,
    },
    orderBy: { created_at: "asc" },
  });
}

export async function createUser(data: {
  username: string;
  name: string;
  password: string;
}) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const cleanUsername = data.username.trim().toLowerCase();
  const cleanName = data.name.trim();

  if (cleanUsername.length < 3) {
    return { success: false, error: "Username must be at least 3 characters." };
  }
  if (!cleanName) {
    return { success: false, error: "Name is required." };
  }
  if (!data.password || data.password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  const existing = await prisma.user.findUnique({
    where: { username: cleanUsername },
  });

  if (existing) {
    return { success: false, error: "A user with this username already exists." };
  }

  const passwordHash = await hashPassword(data.password);

  const newUser = await prisma.user.create({
    data: {
      username: cleanUsername,
      name: cleanName,
      password_hash: passwordHash,
    },
  });

  revalidatePath("/settings");
  return { success: true, user: { id: newUser.id, username: newUser.username, name: newUser.name } };
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  if (!data.newPassword || data.newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    return { success: false, error: "User not found." };
  }

  const isCurrentValid = await verifyPassword(data.currentPassword, user.password_hash);
  if (!isCurrentValid) {
    return { success: false, error: "Current password is incorrect." };
  }

  const newHash = await hashPassword(data.newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { password_hash: newHash },
  });

  return { success: true };
}

export async function deleteUser(userId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  if (session.userId === userId) {
    return { success: false, error: "You cannot delete your own account." };
  }

  const totalUsers = await prisma.user.count();
  if (totalUsers <= 1) {
    return { success: false, error: "Cannot delete the last remaining user." };
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/settings");
  return { success: true };
}
