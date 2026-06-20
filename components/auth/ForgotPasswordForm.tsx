"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [retryIn, setRetryIn] = useState(0);

  useEffect(() => {
    if (retryIn <= 0) return;
    const timer = setInterval(() => {
      setRetryIn((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryIn]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (retryIn > 0) return;
    setError(null);
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: getAuthCallbackUrl("/reset-password"),
      }
    );

    if (resetError) {
      setError(getAuthErrorMessage(resetError.message));
      if (resetError.message.toLowerCase().includes("rate limit")) {
        setRetryIn(60);
      }
      setLoading(false);
      return;
    }

    setSent(true);
    setRetryIn(60);
    setLoading(false);
  }

  return (
    <Card className="w-full border-border shadow-[0_8px_32px_rgba(19,49,76,0.08)]">
      <CardHeader>
        <CardTitle className="text-2xl">Reset password</CardTitle>
        <CardDescription>
          {sent
            ? "Check your inbox for a reset link."
            : "We’ll email you a link to choose a new password."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {sent ? (
          <>
            <p className="text-sm text-muted-foreground" role="status">
              If an account exists for <strong>{email.trim()}</strong>, you
              will receive an email shortly. The link expires after a short
              time.
            </p>
            <Link
              href="/login"
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-primary text-base font-medium text-primary-foreground"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="label-caps">
                Email
              </Label>
              <Input
                id="reset-email"
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
              disabled={loading || retryIn > 0}
            >
              {loading
                ? "Sending link…"
                : retryIn > 0
                  ? `Try again in ${retryIn}s`
                  : "Send reset link"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link href="/login" className="text-link">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
