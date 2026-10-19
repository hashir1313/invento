import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUsers } from "@/app/user-actions";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const users = await getUsers();

  return <SettingsClient currentUser={session} initialUsers={users} />;
}
