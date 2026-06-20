"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getPostLoginPath } from "@/lib/auth-redirect";
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

type LoginMode = "password" | "otp";
type OtpStep = "email" | "code";

export function LoginForm() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [mode, setMode] = useState<LoginMode>("password");
  const [otpStep, setOtpStep] = useState<OtpStep>("email");
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
      setError("Sign-in link expired or invalid. Request a new code.");
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
    setOtpStep("email");
    setOtp("");
    resetMessages();
  }

  async function sendOtp() {
    resetMessages();
    setLoading(true);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
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

    setOtpStep("code");
    setInfo(`We sent a 6-digit code to ${email.trim()}.`);
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

  async function handleOtpEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    await sendOtp();
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
            { value: "otp", label: "Email code" },
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
              <Label htmlFor="password" className="label-caps">
                Password
              </Label>
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
            <Button
              type="submit"
              className="h-12 w-full rounded-full text-base"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Continue"}
            </Button>
          </form>
        ) : otpStep === "email" ? (
          <form onSubmit={handleOtpEmailSubmit} className="space-y-5">
            <p className="text-sm text-muted-foreground">
              We&apos;ll email you a one-time code — no password needed.
            </p>
            <div className="space-y-2">
              <Label htmlFor="otp-email" className="label-caps">
                Email
              </Label>
              <Input
                id="otp-email"
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
              {loading ? "Sending code…" : "Send sign-in code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyOtpCode} className="space-y-5">
            {info && (
              <p className="text-sm text-muted-foreground" role="status">
                {info}
              </p>
            )}
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
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="text-center text-lg tracking-[0.3em]"
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
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying…" : "Verify and sign in"}
            </Button>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setOtpStep("email");
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
                onClick={() => sendOtp()}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
              </button>
            </div>
          </form>
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
