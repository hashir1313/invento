"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Sparkles, Store, ShieldCheck } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { setupInitialAdmin } from "@/app/user-actions";

export default function SetupForm() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await setupInitialAdmin({
        username,
        name,
        password,
      });

      if (!res.success) {
        setError(res.error || "Setup failed. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong during setup. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mesh -mx-4 sm:-mx-6 lg:-mx-8 -my-8 min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <ThemeToggle className="absolute top-4 right-4 sm:top-6 sm:right-6" />
      <div className="w-full max-w-[440px] py-16">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-sm bg-primary flex items-center justify-center mx-auto mb-5">
            <Store className="w-5 h-5 text-on-primary" aria-hidden="true" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-hairline-soft border border-hairline text-ink text-xs font-mono mb-3">
            <Sparkles className="w-3.5 h-3.5 text-link" />
            <span>First-Run Setup</span>
          </div>
          <h1 className="text-h2 text-ink">Welcome to Invento</h1>
          <p className="text-sm text-mute mt-1.5 max-w-sm mx-auto">
            Create your primary administrator account to secure your perfume business instance.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 sm:p-7 shadow-sm">
          {error && (
            <div className="badge badge-error h-auto w-full py-2 px-3 mb-4 justify-start text-left whitespace-normal">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="field-label">
                Your Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="input"
                placeholder="e.g. Hashir"
              />
            </div>

            <div>
              <label htmlFor="username" className="field-label">
                Admin Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="input"
                placeholder="e.g. admin or hashir"
              />
              <p className="text-[11px] text-mute mt-1">
                Alphanumeric characters used to sign in to this instance.
              </p>
            </div>

            <div>
              <label htmlFor="password" className="field-label">
                Admin Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="input"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="field-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="input"
                placeholder="Re-enter password"
              />
            </div>
          </div>

          <div className="mt-5 p-3 rounded-lg bg-hairline-soft border border-hairline flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-ink shrink-0 mt-0.5" />
            <p className="text-xs text-mute leading-relaxed">
              Passwords are encrypted with industry-standard salted bcrypt. You will be able to create additional team members inside Settings.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-pill w-full mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up instance...
              </>
            ) : (
              "Complete Setup & Enter"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
