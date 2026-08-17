"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell, GoogleIcon } from "@/components/auth/auth-shell";
import { AUTH_REDIRECT_PATH, signIn, signInWithGoogle } from "@/lib/auth-client";
import { SignInInput, signInSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const rawData = {
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      };

      const parsedData = signInSchema.safeParse(rawData);
      if (!parsedData.success) {
        setError(parsedData.error.issues[0]?.message ?? "Invalid input");
        return;
      }

      const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const redirectTo = searchParams?.get("redirect") || AUTH_REDIRECT_PATH;

      const data: SignInInput = parsedData.data;
      const res = await signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: redirectTo,
      });

      if (res.error) {
        setError(res.error.message || "Invalid email or password");
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);

    try {
      const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const redirectTo = searchParams?.get("redirect") || AUTH_REDIRECT_PATH;

      const res = await signInWithGoogle(redirectTo);
      if (res.error) {
        setError(res.error.message || "Google sign in failed");
        setGoogleLoading(false);
      }
    } catch {
      setError("Google sign in failed. Check your Google OAuth settings.");
      setGoogleLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Log in to your CoolBoard workspace"
      footer={
        <>
          New to CoolBoard?{" "}
          <Link href="/signup" className="ml-1 font-medium text-white underline underline-offset-4 hover:opacity-75">
            Create an account
          </Link>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="email" className="text-sm font-normal text-zinc-300">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            required
            className="rounded-lg border-white/20 bg-[#18181b] px-3.5 py-2.5 text-base text-white placeholder:text-zinc-500 focus:border-[#4d49fc] focus:ring-1 focus:ring-[#4d49fc]"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password" className="text-sm font-normal text-zinc-300">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="rounded-lg border-white/20 bg-[#18181b] px-3.5 py-2.5 text-base text-white placeholder:text-zinc-500 focus:border-[#4d49fc] focus:ring-1 focus:ring-[#4d49fc]"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading || googleLoading}
          className="mt-2 h-11 w-full rounded-[50px] bg-[#4d49fc] text-base font-medium text-white transition-shadow hover:bg-[#4d49fc]/90 hover:shadow-[0_4px_24px_rgba(77,73,252,0.35)]"
        >
          {loading ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs uppercase text-zinc-500">
        <div className="h-px flex-1 bg-white/10" />
        <span>Or continue with</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        disabled={loading || googleLoading}
        className="h-11 w-full rounded-[50px] border border-white/20 bg-transparent text-base font-normal text-white transition-all duration-200 hover:bg-white hover:text-black hover:border-white"
      >
        <GoogleIcon />
        {googleLoading ? "Redirecting..." : "Continue with Google"}
      </Button>
    </AuthShell>
  );
}
