"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Hammer, MessageSquare } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WorkspaceProject = {
  id: string;
  current_stage: string;
  land_listings?: { address?: string; suburb?: string } | { address?: string; suburb?: string }[] | null;
};

function listingLabel(row: WorkspaceProject["land_listings"]) {
  const listing = Array.isArray(row) ? row[0] : row;
  if (!listing) return "Your project";
  return [listing.address, listing.suburb].filter(Boolean).join(", ");
}

export function WorkspacePanel() {
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [threads, setThreads] = useState<number>(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/workspace/projects").then((res) => res.json()),
      fetch("/api/inquiries").then((res) => res.json()),
    ])
      .then(([projectData, inquiryData]) => {
        setProjects(Array.isArray(projectData) ? projectData : []);
        setThreads(Array.isArray(inquiryData) ? inquiryData.length : 0);
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Shared workspace for you and your builder: messages, accepted
        contracts, and milestone tracking.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/buyer/messages"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-auto justify-start gap-3 rounded-xl p-4"
          )}
        >
          <MessageSquare className="h-5 w-5 text-primary" />
          <span className="text-left">
            <span className="block font-medium">Messages</span>
            <span className="block text-xs font-normal text-muted-foreground">
              {threads} open thread{threads === 1 ? "" : "s"}
            </span>
          </span>
        </Link>
        <Link
          href="/buyer/compare"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-auto justify-start gap-3 rounded-xl p-4"
          )}
        >
          <Hammer className="h-5 w-5 text-primary" />
          <span className="text-left">
            <span className="block font-medium">Tenders &amp; project</span>
            <span className="block text-xs font-normal text-muted-foreground">
              Compare packages, then track the build
            </span>
          </span>
        </Link>
      </div>

      {projects.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Active builds</p>
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/buyer/project/${project.id}`}
              className="block rounded-xl border border-border p-4 hover:bg-muted/40"
            >
              <p className="font-medium">{listingLabel(project.land_listings)}</p>
              <p className="text-sm capitalize text-muted-foreground">
                Stage: {project.current_stage.replace("_", " ")}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Accept a builder proposal to open a shared milestone tracker.
        </p>
      )}
    </div>
  );
}
