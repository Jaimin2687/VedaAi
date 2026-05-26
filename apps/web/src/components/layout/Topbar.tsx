"use client";

import Link from "next/link";
import clsx from "clsx";

type TopbarProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
};

export default function Topbar({ title, subtitle, showBack, backHref }: TopbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white px-6 py-4 shadow-md">
      <div className="flex items-center gap-3">
        {showBack ? (
          <Link
            href={backHref ?? "/"}
            className={clsx(
              "flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-100"
            )}
          >
            ←
          </Link>
        ) : null}
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          {subtitle ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100">
          🔔
        </button>
        <div className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm">
          <div className="h-7 w-7 rounded-full bg-gray-200" />
          John Doe
        </div>
      </div>
    </div>
  );
}
