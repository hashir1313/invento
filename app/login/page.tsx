import { redirect } from "next/navigation";
import { checkNeedsSetup } from "@/app/user-actions";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const needsSetup = await checkNeedsSetup();

  if (needsSetup) {
    redirect("/setup");
  }

  return <LoginForm />;
}
