import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function PracticeCta() {
  return (
    <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-signal px-4 text-sm font-semibold text-text-on-dark transition-colors hover:brightness-110" href="/challenges">
      Explore Challenges
      <ArrowRight aria-hidden="true" size={16} />
    </Link>
  );
}
