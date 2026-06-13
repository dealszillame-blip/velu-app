import Link from "next/link";
import { BuyerRegisterForm } from "@/components/auth/BuyerRegisterForm";

type BuyerRegisterPageProps = {
  searchParams: Promise<{ intent?: string }>;
};

export default async function BuyerRegisterPage({
  searchParams,
}: BuyerRegisterPageProps) {
  const { intent } = await searchParams;
  const ownLand = intent === "own-land";

  return (
    <>
      <BuyerRegisterForm
        redirectTo={ownLand ? "/buyer/my-land" : "/buyer/map"}
        variant={ownLand ? "own-land" : "default"}
      />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={ownLand ? "/login?next=/buyer/my-land" : "/login"}
          className="text-link"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
