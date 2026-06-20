"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl, getPostLoginPath } from "@/lib/auth-redirect";
import { SegmentControl } from "@/components/shared/SegmentControl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginMode = "password" | "email";
type EmailStep = "email" | "sent";

export function LoginForm() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [mode, setMode] = useState<LoginMode>("password");
  const [emailStep, setEmailStep] = useState<EmailStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (searchParams.get("onboarding") === "required") {
      setError("Sign in to finish setting up your profile.");
    }
    if (searchParams.get("error") === "auth_callback") {
      setError("Sign-in link expired or invalid. Request a new link.");
    }
    if (searchParams.get("reset") === "success") {
      setInfo("Password updated. Sign in with your new password.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setInterval(() => {
      setResendIn((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  function resetMessages() {
    setError(null);
    setInfo(null);
  }

  function switchMode(next: LoginMode) {
    setMode(next);
    setEmailStep("email");
    setOtp("");
    resetMessages();
  }

  async function sendEmailSignIn() {
    resetMessages();
    setLoading(true);

    const nextPath = getPostLoginPath(searchParams);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: getAuthCallbackUrl(nextPath),
      },
    });

    if (otpError) {
      const message = otpError.message.toLowerCase().includes("signups not allowed")
        ? "No account found for this email. Create an account first."
        : otpError.message;
      setError(message);
      setLoading(false);
      return;
    }

    setEmailStep("sent");
    setInfo(`We sent a sign-in link to ${email.trim()}.`);
    setResendIn(60);
    setLoading(false);
  }

  async function verifyOtpCode(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: "email",
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    window.location.assign(getPostLoginPath(searchParams));
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      window.location.assign(getPostLoginPath(searchParams));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    await sendEmailSignIn();
  }

  return (
    <Card className="w-full border-border shadow-[0_8px_32px_rgba(19,49,76,0.08)]">
      <CardHeader>
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>Welcome back to Velu</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <SegmentControl
          options={[
            { value: "password", label: "Password" },
            { value: "email", label: "Email link" },
          ]}
          value={mode}
          onChange={switchMode}
        />

        {mode === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="label-caps">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="password" className="label-caps">
                  Password
                </Label>
                <Link href="/forgot-password" className="text-link text-xs">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            {info && (
              <p className="text-sm text-muted-foreground" role="status">
                {info}
              </p>
            )}
            <Button
              type="submit"
              className="h-12 w-full rounded-full text-base"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Continue"}
            </Button>
          </form>
        ) : emailStep === "email" ? (
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <p className="text-sm text-muted-foreground">
              We&apos;ll email you a one-time sign-in link — no password needed.
            </p>
            <div className="space-y-2">
              <Label htmlFor="email-link" className="label-caps">
                Email
              </Label>
              <Input
                id="email-link"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="h-12 w-full rounded-full text-base"
              disabled={loading}
            >
              {loading ? "Sending link…" : "Send sign-in link"}
            </Button>
          </form>
        ) : (
          <div className="space-y-5">
            {info && (
              <p className="text-sm text-muted-foreground" role="status">
                {info} Click the link in the email to sign in. You can close this
                tab once you&apos;re in.
              </p>
            )}
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setEmailStep("email");
                  setOtp("");
                  resetMessages();
                }}
              >
                Use a different email
              </button>
              <button
                type="button"
                className={cn(
                  "text-link",
                  (resendIn > 0 || loading) && "pointer-events-none opacity-50"
                )}
                disabled={resendIn > 0 || loading}
                onClick={() => sendEmailSignIn()}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend link"}
              </button>
            </div>

            <details className="rounded-lg border border-border px-4 py-3 text-sm">
              <summary className="cursor-pointer font-medium text-muted-foreground">
                Have a 6-digit code instead?
              </summary>
              <form onSubmit={verifyOtpCode} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp-code" className="label-caps">
                    6-digit code
                  </Label>
                  <Input
                    id="otp-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, ""))
                    }
                    className="text-center text-lg tracking-[0.3em]"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-11 w-full rounded-full"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? "Verifying…" : "Verify code"}
                </Button>
              </form>
            </details>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/register/buyer" className="text-link">
            Create account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
