import type { Dictionary } from "@/lib/i18n/dictionaries";

// Where the APK lives — drop the file at public/download/wanbai-store.apk.
const APK_PATH = "/download/wanbai-store.apk";

function AndroidGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.6 9.48l1.84-3.18a.5.5 0 0 0-.87-.5l-1.86 3.22a11.4 11.4 0 0 0-9.42 0L5.43 5.8a.5.5 0 1 0-.87.5L6.4 9.48A10.8 10.8 0 0 0 1 18h22a10.8 10.8 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" />
    </svg>
  );
}

function DownloadGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M12 3v12m0 0l4-4m-4 4l-4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AppDownload({
  dict,
  logo,
}: {
  dict: Dictionary;
  logo?: string | null;
}) {
  const d = dict.appDownload;

  return (
    <section id="app-download" className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-10">
      {/* Ambient colour */}
      <div className="pointer-events-none absolute -top-24 size-72 rounded-full bg-primary/20 blur-3xl ltr:-right-16 rtl:-left-16" />
      <div className="pointer-events-none absolute -bottom-24 size-72 rounded-full bg-fuchsia-500/10 blur-3xl ltr:-left-16 rtl:-right-16" />

      <div className="relative grid items-center gap-8 lg:grid-cols-2">
        {/* Copy + CTA */}
        <div className="flex flex-col gap-5">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-bold text-primary">
            <AndroidGlyph className="size-4" />
            {d.badge}
          </span>

          <div>
            <h2 className="text-2xl font-black sm:text-3xl">{d.heading}</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              {d.subtitle}
            </p>
          </div>

          <ul className="grid gap-2 sm:grid-cols-2">
            {d.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm font-medium">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <CheckGlyph className="size-3.5" />
                </span>
                {f}
              </li>
            ))}
          </ul>

          <div className="flex flex-col items-start gap-2">
            <a
              href={APK_PATH}
              download="wanbai-store.apk"
              type="application/vnd.android.package-archive"
              className="inline-flex items-center gap-2.5 rounded-2xl brand-gradient px-6 py-3.5 text-sm font-black text-white shadow-[var(--shadow-pop)] transition-transform hover:scale-[1.03]"
            >
              <DownloadGlyph className="size-5" />
              {d.download}
            </a>
            <span className="text-xs text-muted">{d.meta}</span>
          </div>
        </div>

        {/* Phone mock + install steps */}
        <div className="flex items-center justify-center gap-5">
          {/* Phone */}
          <div className="relative hidden shrink-0 sm:block">
            <div className="h-72 w-40 rounded-[2rem] border-[6px] border-foreground/10 bg-gradient-to-b from-primary/15 to-fuchsia-500/10 p-3 shadow-[var(--shadow-card)]">
              <div className="mx-auto mb-4 mt-1 h-1.5 w-12 rounded-full bg-foreground/15" />
              <div
                aria-hidden
                style={{ backgroundImage: `url(${logo || "/logo.svg"})` }}
                className="mx-auto size-16 rounded-2xl bg-contain bg-center bg-no-repeat"
              />
              <p className="mt-3 text-center text-sm font-black">{dict.brand.name}</p>
              <div className="mt-4 space-y-2">
                <div className="h-6 rounded-lg bg-foreground/5" />
                <div className="h-6 w-4/5 rounded-lg bg-foreground/5" />
                <div className="h-6 w-3/5 rounded-lg bg-foreground/5" />
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="flex-1 rounded-2xl border border-border bg-background p-4">
            <p className="mb-3 text-sm font-bold">{d.stepsTitle}</p>
            <ol className="flex flex-col gap-3">
              {d.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-black text-primary">
                    {i + 1}
                  </span>
                  <span className="text-xs leading-relaxed text-muted">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 rounded-xl bg-surface-2 px-3 py-2 text-[11px] leading-relaxed text-muted">
              {d.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
