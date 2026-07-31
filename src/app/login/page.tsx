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
      title="Log in"
      description="Use your email and password, or continue with Google"
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="ml-1 font-medium underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button className="w-full" type="submit" disabled={loading || googleLoading}>
          {loading ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <div className="text-muted-foreground flex items-center gap-3 text-xs uppercase">
        <div className="border-border h-px flex-1 border-t" />
        <span>Or continue with</span>
        <div className="border-border h-px flex-1 border-t" />
      </div>

      <Button
        className="w-full"
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        disabled={loading || googleLoading}
      >
        <GoogleIcon />
        {googleLoading ? "Redirecting..." : "Continue with Google"}
      </Button>
    </AuthShell>
  );
}
