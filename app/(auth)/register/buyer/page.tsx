import Link from "next/link";
import { BuyerRegisterForm } from "@/components/auth/BuyerRegisterForm";

export default function BuyerRegisterPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <BuyerRegisterForm />
      <p className="mt-4 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
