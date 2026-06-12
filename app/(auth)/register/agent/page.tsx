import Link from "next/link";
import { AgentRegisterForm } from "@/components/auth/AgentRegisterForm";

export default function AgentRegisterPage() {
  return (
    <>
      <AgentRegisterForm />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-link">
          Sign in
        </Link>
      </p>
    </>
  );
}
