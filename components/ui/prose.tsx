import { cn } from "@/lib/utils";

/**
 * Renders plain-text CMS content: blank lines become paragraphs, and single
 * newlines become line breaks. Keeps the content model simple (no markdown
 * dependency) while still reading well.
 */
export function Prose({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
  return (
    <div className={cn("flex flex-col gap-4 leading-relaxed text-foreground/90", className)}>
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p.trim()}
        </p>
      ))}
    </div>
  );
}
