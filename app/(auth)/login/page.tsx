import { Suspense } from "react";
import { LoginEntry } from "@/components/auth/LoginEntry";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginEntry />
    </Suspense>
  );
}
