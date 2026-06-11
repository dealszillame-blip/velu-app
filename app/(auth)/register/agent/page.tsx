import Link from "next/link";
import { AgentRegisterForm } from "@/components/auth/AgentRegisterForm";

export default function AgentRegisterPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <AgentRegisterForm />
      <p className="mt-4 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
