import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <span className="text-lg font-semibold">Velu</span>
          <div className="flex gap-2">
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
              Sign in
            </Link>
            <Link href="/register/buyer" className={buttonVariants()}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto flex max-w-6xl flex-1 flex-col justify-center px-4 py-16">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          South West Sydney · Vacant land only
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          When land sells, connect the right builder to the right buyer.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Velu is a verified marketplace for vacant land — agents list parcels,
          buyers explore the map, and builders respond to sold-lot leads in
          real time.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/register/buyer"
            className={cn(buttonVariants({ size: "lg" }))}
          >
            I&apos;m buying land
          </Link>
          <Link
            href="/register/builder"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
          >
            I&apos;m a builder
          </Link>
          <Link
            href="/register/agent"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
          >
            I&apos;m an agent
          </Link>
        </div>
      </section>
    </main>
  );
}
