import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

export function Pagination({
  basePath,
  page,
  totalPages,
  extraQuery,
  dict,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  extraQuery?: Record<string, string>;
  dict: Dictionary;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams(extraQuery);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <PageLink href={href(page - 1)} disabled={page <= 1} label={dict.listing.previous}>
        <ChevronLeftIcon className="size-4 rtl:rotate-180" />
        <span className="hidden sm:inline">{dict.listing.previous}</span>
      </PageLink>
      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "grid size-9 place-items-center rounded-lg text-sm font-bold transition-colors",
            p === page
              ? "brand-gradient text-white"
              : "border border-border bg-surface hover:bg-surface-2",
          )}
        >
          {p}
        </Link>
      ))}
      <PageLink href={href(page + 1)} disabled={page >= totalPages} label={dict.listing.next}>
        <span className="hidden sm:inline">{dict.listing.next}</span>
        <ChevronRightIcon className="size-4 rtl:rotate-180" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled
        aria-label={label}
        className="inline-flex h-9 cursor-not-allowed items-center gap-1 rounded-lg border border-border px-3 text-sm font-bold text-muted opacity-50"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm font-bold transition-colors hover:bg-surface-2"
    >
      {children}
    </Link>
  );
}
