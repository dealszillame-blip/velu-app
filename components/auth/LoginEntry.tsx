"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { BuyerStartForm } from "@/components/auth/BuyerStartForm";
import {
  DEMO_LOGIN_PASSWORD,
  DemoLoginAccounts,
  type DemoLoginAccount,
} from "@/components/auth/DemoLoginAccounts";
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
  const [demoLogin, setDemoLogin] = useState<{
    email: string;
    password: string;
    nonce: number;
  } | null>(null);

  function useDemoAccount(account: DemoLoginAccount) {
    setDemoLogin({
      email: account.email,
      password: DEMO_LOGIN_PASSWORD,
      nonce: Date.now(),
    });
    setView("signin");
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {view === "signin" ? (
        <LoginForm
          key={demoLogin?.nonce ?? "signin"}
          onStart={() => setView("start")}
          demoLogin={demoLogin}
        />
      ) : (
        <BuyerStartForm onSignIn={() => setView("signin")} />
      )}
      <DemoLoginAccounts onUse={useDemoAccount} />
    </div>
  );
}
