import type { Dictionary } from "@/lib/i18n/dictionaries";
import { BoltIcon, ShieldIcon, StarIcon, SupportIcon } from "@/components/ui/icons";

export function TrustBar({ dict }: { dict: Dictionary }) {
  const items = [
    { Icon: ShieldIcon, label: dict.trust.secure },
    { Icon: BoltIcon, label: dict.trust.instant },
    { Icon: SupportIcon, label: dict.trust.support },
    { Icon: StarIcon, label: dict.trust.trusted },
  ];
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ Icon, label }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 shadow-[var(--shadow-card)]"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </span>
          <span className="text-sm font-bold">{label}</span>
        </div>
      ))}
    </section>
  );
}
