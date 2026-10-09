"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../lib/supabase/client";

export default function Home() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const supabase = createClient();

      if (isSignUp) {
        
const { data, error } = await supabase.auth.signUp({
  email: email.trim(),
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
  },
});

if (error) throw error;

if (data.session) {
  window.location.href = "/dashboard";
  return;
}

setMessage(
  "Compte créé ! Consulte tes emails et clique sur le lien de confirmation pour activer ton compte."
);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        window.location.href = "/dashboard";
        return;
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue. Réessaie."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080b14] px-4 py-12 text-white">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-600/20 blur-[100px]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0d1220]/95 shadow-2xl md:grid-cols-2">
        <section className="hidden flex-col justify-between border-r border-white/10 p-12 md:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-xl font-bold">
                R
              </div>
              <span className="text-lg font-semibold tracking-tight">
                Research<span className="text-blue-400">Digest</span>
              </span>
            </div>

            <p className="mt-20 text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
              Personal Research Intelligence
            </p>

            <h1 className="mt-5 text-4xl font-bold leading-tight">
              Less noise.
              <br />
              More discovery.
            </h1>

            <p className="mt-5 max-w-sm leading-7 text-slate-400">
              Discover the AI research that matters to you. Let intelligent
              filtering find relevant papers and deliver insights directly
              to your inbox.
            </p>
          </div>

          <div className="mt-16 border-t border-white/10 pt-6">
            <p className="text-sm text-slate-500">
              arXiv research · Semantic search · AI-powered summaries
            </p>
          </div>
        </section>

        <section className="p-7 sm:p-10 md:p-12">
          <div className="mb-10 flex items-center gap-3 md:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-lg font-bold">
              R
            </div>
            <span className="font-semibold">
              Research<span className="text-blue-400">Digest</span>
            </span>
          </div>

          <div>
            <p className="text-sm text-slate-400">
              {isSignUp ? "Get started for free" : "Welcome back"}
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {isSignUp ? "Create your account" : "Sign in"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              {isSignUp
                ? "Create your personal research workspace."
                : "Sign in to access your research dashboard."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-[#080b14] px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-white/10 bg-[#080b14] px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              {isSignUp && (
                <p className="mt-2 text-xs text-slate-500">
                  Use at least 6 characters.
                </p>
              )}
            </div>

            {message && (
              <div
                role="status"
                className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm leading-6 text-emerald-300"
              >
                {message}
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm leading-6 text-red-300"
              >
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : isSignUp
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <div className="mt-7 text-center text-sm text-slate-400">
            {isSignUp
              ? "Already have an account? "
              : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp((current) => !current);
                setMessage("");
                setErrorMessage("");
              }}
              className="font-semibold text-blue-400 hover:text-blue-300"
            >
              {isSignUp ? "Sign in" : "Create one"}
            </button>
          </div>

          <p className="mt-8 text-center text-xs leading-5 text-slate-600">
            Your research workspace. Your interests. Your discoveries.
          </p>
        </section>
      </div>
    </main>
  );
}