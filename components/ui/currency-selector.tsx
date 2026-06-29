"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { currencies } from "@/lib/data/catalog";
import { cn, setCookie } from "@/lib/utils";
import { ChevronDownIcon } from "./icons";

export function CurrencySelector({ current }: { current: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const active = currencies.find((c) => c.code === current) ?? currencies[0];

  function choose(code: string) {
    setCookie("currency", code);
    setOpen(false);
    router.refresh();
  }

  return (
    <div
      ref={ref}
      className="relative"
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 text-sm font-semibold transition-colors hover:bg-surface-2"
      >
        <span aria-hidden>{active.flag}</span>
        <span>{active.code}</span>
        <ChevronDownIcon className="size-4 text-muted" />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-2 min-w-40 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-[var(--shadow-pop)] ltr:right-0 rtl:left-0"
        >
          {currencies.map((c) => (
            <li key={c.code}>
              <button
                type="button"
                onClick={() => choose(c.code)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-surface-2",
                  c.code === current && "text-primary font-bold",
                )}
              >
                <span aria-hidden>{c.flag}</span>
                <span className="font-semibold">{c.code}</span>
                <span className="text-muted ltr:ml-auto rtl:mr-auto">{c.symbol}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
