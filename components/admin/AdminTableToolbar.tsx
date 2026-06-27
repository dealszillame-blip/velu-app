"use client";

import { Input } from "@/components/ui/input";

type AdminTableToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
};

export function AdminTableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  children,
}: AdminTableToolbarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className="max-w-sm"
      />
      {children}
    </div>
  );
}
