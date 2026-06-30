import Link from "next/link";
import { ChevronRightIcon } from "./icons";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {item.href && !last ? (
                <Link href={item.href} className="transition-colors hover:text-primary">
                  {item.label}
                </Link>
              ) : (
                <span className={last ? "font-semibold text-foreground" : undefined}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronRightIcon className="size-3.5 rtl:rotate-180" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
