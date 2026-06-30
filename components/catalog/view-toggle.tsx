import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { GridIcon, ListIcon } from "@/components/ui/icons";

export function ViewToggle({
  basePath,
  view,
  dict,
}: {
  basePath: string;
  view: "grid" | "list";
  dict: Dictionary;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
      <Link
        href={basePath}
        aria-label={dict.listing.gridView}
        aria-current={view === "grid" ? "true" : undefined}
        className={cn(
          "grid size-8 place-items-center rounded-lg transition-colors",
          view === "grid" ? "brand-gradient text-white" : "text-muted hover:bg-surface-2",
        )}
      >
        <GridIcon className="size-[18px]" />
      </Link>
      <Link
        href={`${basePath}?view=list`}
        aria-label={dict.listing.listView}
        aria-current={view === "list" ? "true" : undefined}
        className={cn(
          "grid size-8 place-items-center rounded-lg transition-colors",
          view === "list" ? "brand-gradient text-white" : "text-muted hover:bg-surface-2",
        )}
      >
        <ListIcon className="size-[18px]" />
      </Link>
    </div>
  );
}
