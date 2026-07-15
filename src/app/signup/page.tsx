"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell, GoogleIcon } from "@/components/auth/auth-shell";
import { AUTH_REDIRECT_PATH, signInWithGoogle, signUp } from "@/lib/auth-client";
import { SignUpInput, signUpSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
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
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      };

      const parsedData = signUpSchema.safeParse(rawData);
      if (!parsedData.success) {
        setError(parsedData.error.issues[0]?.message ?? "Invalid input");
        return;
      }

      const data: SignUpInput = parsedData.data;
      const res = await signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      if (res.error) {
        setError(res.error.message || "Something went wrong");
        return;
      }

      router.push(AUTH_REDIRECT_PATH);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    setError(null);

    try {
      const res = await signInWithGoogle();
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
      title="Create account"
      description="Enter your details to get started"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="ml-1 font-medium underline underline-offset-4">
            Log in
          </Link>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            autoComplete="name"
            required
          />
        </div>
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
            minLength={8}
            autoComplete="new-password"
            required
          />
          <p className="text-muted-foreground text-xs">Must be at least 8 characters</p>
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button className="w-full" type="submit" disabled={loading || googleLoading}>
          {loading ? "Creating account..." : "Create account"}
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
        onClick={handleGoogleSignUp}
        disabled={loading || googleLoading}
      >
        <GoogleIcon />
        {googleLoading ? "Redirecting..." : "Continue with Google"}
      </Button>
    </AuthShell>
  );
}
