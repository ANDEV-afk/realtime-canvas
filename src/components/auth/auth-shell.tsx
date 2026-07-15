import Link from "next/link";
import { MagicCard } from "@/components/ui/magic-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        d="M21.35 11.1H12v2.99h5.37a4.6 4.6 0 0 1-1.99 3.02v2.5h3.22c1.88-1.73 2.95-4.28 2.95-7.31 0-.41-.04-.81-.1-1.2Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.67 0 4.9-.88 6.53-2.39l-3.22-2.5c-.9.6-2.05.96-3.31.96-2.55 0-4.71-1.72-5.48-4.04H3.2v2.58A9.86 9.86 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.52 14.03a5.9 5.9 0 0 1 0-3.76V7.69H3.2a9.98 9.98 0 0 0 0 8.92l3.32-2.58Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.93c1.45 0 2.76.5 3.79 1.47l2.84-2.84C16.89 2.92 14.67 2 12 2a9.86 9.86 0 0 0-8.8 5.69l3.32 2.58C7.29 7.65 9.45 5.93 12 5.93Z"
        fill="#EA4335"
      />
    </svg>
  );
}

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_oklch(0.93_0.02_280)_0%,_transparent_55%),radial-gradient(circle_at_bottom_right,_oklch(0.95_0.03_30)_0%,_transparent_50%)]"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-foreground inline-flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-xl text-sm font-bold">
              L
            </span>
            Let See
          </Link>
        </div>

        <Card className="w-full border-none p-0 shadow-none">
          <MagicCard
            className="rounded-4xl p-0"
            gradientColor="oklch(0.75 0.08 280 / 0.35)"
          >
            <CardHeader className="border-border border-b p-6 [.border-b]:pb-6">
              <CardTitle className="text-center text-xl font-semibold">{title}</CardTitle>
              <CardDescription className="text-center">{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-6">{children}</CardContent>
            <CardFooter className="border-border justify-center border-t p-6 text-sm [.border-t]:pt-6">
              {footer}
            </CardFooter>
          </MagicCard>
        </Card>
      </div>
    </div>
  );
}
