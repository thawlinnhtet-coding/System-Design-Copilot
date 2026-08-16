import { ArrowRight } from "lucide-react";
import { PracticeLink } from "@/components/design/practice-primitives";

export function PracticeCta() {
  return (
    <PracticeLink href="/challenges">
      Explore Challenges
      <ArrowRight aria-hidden="true" size={16} />
    </PracticeLink>
  );
}
