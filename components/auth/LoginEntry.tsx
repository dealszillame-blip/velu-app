"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { BuyerStartForm } from "@/components/auth/BuyerStartForm";
import { LoginForm } from "@/components/auth/LoginForm";

export function LoginEntry() {
  const searchParams = useSearchParams();
  const returning = Boolean(
    searchParams.get("next") ||
      searchParams.get("redirect") ||
      searchParams.get("onboarding") ||
      searchParams.get("error") ||
      searchParams.get("reset")
  );
  const [view, setView] = useState<"start" | "signin">(returning ? "signin" : "start");

  if (view === "signin") {
    return <LoginForm onStart={() => setView("start")} />;
  }

  return <BuyerStartForm onSignIn={() => setView("signin")} />;
}
