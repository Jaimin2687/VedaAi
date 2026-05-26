"use client";

import Link from "next/link";
import clsx from "clsx";

const navItems = [
  { label: "Home", href: "/" },
  { label: "My Groups", href: "/groups" },
  { label: "Assignments", href: "/" },
  { label: "AI Teacher's Toolkit", href: "/toolkit" },
  { label: "My Library", href: "/library" }
];

export default function Sidebar() {
  return (
    <aside className="hidden h-[calc(100vh-48px)] w-64 flex-col rounded-3xl bg-white p-5 shadow-lg lg:flex">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-300 text-white">
          V
        </div>
        <span>VedaAI</span>
      </div>

      <Link
        href="/assignments/new"
        className="mt-6 flex items-center justify-center rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-orange-300"
      >
        ✨ Create Assignment
      </Link>

      <nav className="mt-6 space-y-2 text-sm text-gray-600">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={clsx(
              "flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-gray-100",
              item.label === "Assignments" && "bg-gray-100 font-semibold text-gray-900"
            )}
          >
            <span className="h-2 w-2 rounded-full bg-gray-300" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">
          ⚙️ Settings
        </button>
        <div className="flex items-center gap-3 rounded-2xl bg-gray-100 p-3">
          <div className="h-10 w-10 rounded-full bg-orange-200" />
          <div>
            <p className="text-sm font-semibold">Delhi Public School</p>
            <p className="text-xs text-gray-500">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
