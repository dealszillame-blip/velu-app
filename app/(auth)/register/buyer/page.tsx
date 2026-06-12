import Link from "next/link";
import { BuyerRegisterForm } from "@/components/auth/BuyerRegisterForm";

export default function BuyerRegisterPage() {
  return (
    <>
      <BuyerRegisterForm />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-link">
          Sign in
        </Link>
      </p>
    </>
  );
}
