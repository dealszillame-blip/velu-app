import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VerifyPage() {
  return (
    <Card className="w-full border-border shadow-[0_8px_32px_rgba(19,49,76,0.08)]">
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          Click the link in your inbox to activate your Velu account, then sign
          in to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/login" className={cn(buttonVariants(), "h-12 w-full rounded-full")}>
          Continue to sign in
        </Link>
      </CardContent>
    </Card>
  );
}
