"use client";

import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  showBack?: boolean;
  backHref?: string;
};

export default function AppShell({
  title,
  subtitle,
  children,
  showBack,
  backHref
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f4f4f5]">
      <div className="mx-auto flex w-full max-w-[1400px] gap-6 px-4 py-6">
        <Sidebar />
        <main className="flex-1 space-y-6">
          <Topbar title={title} subtitle={subtitle} showBack={showBack} backHref={backHref} />
          {children}
        </main>
      </div>
    </div>
  );
}
