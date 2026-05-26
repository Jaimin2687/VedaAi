"use client";

import clsx from "clsx";

type BadgeProps = {
  label: string;
  tone: "easy" | "moderate" | "hard";
};

const toneStyles: Record<BadgeProps["tone"], string> = {
  easy: "bg-emerald-100 text-emerald-700",
  moderate: "bg-amber-100 text-amber-700",
  hard: "bg-rose-100 text-rose-700"
};

export default function Badge({ label, tone }: BadgeProps) {
  return (
    <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-semibold", toneStyles[tone])}>
      {label}
    </span>
  );
}
