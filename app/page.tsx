import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/i18n/config";

// The site is locale-prefixed. Opening the bare domain lands on the default
// locale (Arabic); users can switch to English from the header.
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
