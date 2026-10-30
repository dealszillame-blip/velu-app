"use client";

import { usePathname } from "next/navigation";
import { BldwiseLogo } from "@/components/shared/BldwiseLogo";

type AuthShellProps = {
  children: React.ReactNode;
  eyebrow?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
};

export function AuthShell({
  children,
  eyebrow = "South West Sydney",
  title,
  description,
}: AuthShellProps) {
  const pathname = usePathname();
  const wide = pathname.startsWith("/login/land");

  return (
    <div className="flex min-h-full flex-col lg:min-h-screen lg:grid lg:grid-cols-2">
      <aside className="bldwise-auth-aside relative flex flex-col justify-between overflow-hidden px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-14">
        <div className="bldwise-grid-bg pointer-events-none absolute inset-0 opacity-80" aria-hidden />
        <div
          className="bldwise-auth-glow pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          aria-hidden
        />

        <div className="relative z-10">
          <BldwiseLogo variant="light" size="md" />
        </div>

        <div className="relative z-10 mt-10 lg:mt-0">
          <p className="label-caps mb-4 text-[color:rgba(255,255,255,0.55)]">{eyebrow}</p>
          <h1 className="max-w-md text-3xl font-semibold leading-tight text-white sm:text-4xl">
            {title ?? (
              <>
                You bring the land.
                <br />
                <span className="text-white">We connect you.</span>
              </>
            )}
          </h1>
          <p className="mt-4 max-w-sm text-sm font-light leading-relaxed text-white/50 sm:text-base">
            {description ??
              "The verified marketplace connecting vacant land buyers with licensed builders — the moment a block sells."}
          </p>

          <div className="mt-8 hidden gap-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm lg:flex">
            {[
              { icon: "🏞️", label: "Bring land", sub: "Your block, your build" },
              { icon: "🤝", label: "Connect", sub: "Verified builders" },
              { icon: "📋", label: "Compare", sub: "Side by side" },
            ].map((item, i, arr) => (
              <div
                key={item.label}
                className={`flex flex-1 flex-col items-center gap-2 px-5 py-5 text-center${
                  i < arr.length - 1 ? " border-r border-white/8" : ""
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/75">
                  {item.label}
                </span>
                <span className="text-[10px] text-white/35">{item.sub}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 mt-8 hidden text-xs text-white/25 lg:block">
          © 2026 bldwise Pty Ltd · Ingleburn NSW
        </p>
      </aside>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8 sm:py-12">
        <div className={wide ? "w-full max-w-3xl" : "w-full max-w-md"}>{children}</div>
      </div>
    </div>
  );
}
