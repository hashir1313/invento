"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Store } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mesh -mx-4 sm:-mx-6 lg:-mx-8 -my-8 min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <ThemeToggle className="absolute top-4 right-4 sm:top-6 sm:right-6" />
      <div className="w-full max-w-[400px] py-16">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-sm bg-primary flex items-center justify-center mx-auto mb-5">
            <Store className="w-5 h-5 text-on-primary" aria-hidden="true" />
          </div>
          <p className="eyebrow mb-3">Perfume Inventory System</p>
          <h1 className="text-h2 text-ink">Sign in to Invento</h1>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 sm:p-7">
          {error && (
            <div className="badge badge-error h-auto w-full py-2 px-3 mb-4 justify-start text-left whitespace-normal">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="field-label">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                autoFocus
                className="input"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="input"
                placeholder="Enter password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-pill w-full mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
