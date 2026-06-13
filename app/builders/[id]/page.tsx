"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { BuilderPublicProfileView } from "@/components/builder/BuilderPublicProfileView";
import { buttonVariants } from "@/components/ui/button";
import type { BuilderPublicProfile } from "@/lib/builder-profile";
import { cn } from "@/lib/utils";

export default function PublicBuilderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [profile, setProfile] = useState<BuilderPublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/builders/${id}/profile`)
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setError(data.error ?? "Profile not found.");
            return;
          }
          setProfile(data);
        })
        .catch(() => setError("Failed to load profile."));
    });
  }, [params]);

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-black/[0.06] bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4 sm:px-6">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1.5 rounded-full -ml-2"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Velu
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {error ? (
          <p className="text-center text-sm text-muted-foreground">{error}</p>
        ) : !profile ? (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        ) : (
          <BuilderPublicProfileView profile={profile} />
        )}
      </main>
    </div>
  );
}
