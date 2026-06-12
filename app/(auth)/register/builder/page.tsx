import Link from "next/link";
import { BuilderRegisterForm } from "@/components/auth/BuilderRegisterForm";

export default function BuilderRegisterPage() {
  return (
    <>
      <BuilderRegisterForm />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-link">
          Sign in
        </Link>
      </p>
    </>
  );
}
