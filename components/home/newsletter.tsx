import type { Dictionary } from "@/lib/i18n/dictionaries";
import { ArrowIcon } from "@/components/ui/icons";

export function Newsletter({ dict }: { dict: Dictionary }) {
  return (
    <section className="relative overflow-hidden rounded-3xl brand-gradient p-8 sm:p-12">
      <div className="absolute -top-16 size-56 rounded-full bg-white/20 blur-3xl ltr:right-0 rtl:left-0" />
      <div className="relative flex flex-col items-center gap-5 text-center text-white">
        <div>
          <h2 className="text-xl font-black sm:text-2xl">{dict.newsletter.heading}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/90">
            {dict.newsletter.subheading}
          </p>
        </div>
        <form className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            placeholder={dict.newsletter.placeholder}
            className="h-11 flex-1 rounded-xl bg-white/95 px-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-500"
          />
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 text-sm font-bold text-white transition-transform hover:scale-[1.03]"
          >
            {dict.newsletter.cta}
            <ArrowIcon className="size-4 rtl:rotate-180" />
          </button>
        </form>
      </div>
    </section>
  );
}
