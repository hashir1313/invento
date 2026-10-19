import { redirect } from "next/navigation";
import { checkNeedsSetup } from "@/app/user-actions";
import SetupForm from "./SetupForm";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const needsSetup = await checkNeedsSetup();

  // If users already exist, setup is locked
  if (!needsSetup) {
    redirect("/login");
  }

  return <SetupForm />;
}
