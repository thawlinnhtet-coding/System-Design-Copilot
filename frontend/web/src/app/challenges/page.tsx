import { AppShell } from "@/components/navigation/app-shell";
import { ChallengeCatalog } from "@/features/challenges/challenge-catalog";

export default function ChallengesPage() {
  return (
    <AppShell fullBleed>
      <section className="w-full px-5 py-8 sm:px-8 lg:px-16 lg:py-[38px]">
        <ChallengeCatalog />
      </section>
    </AppShell>
  );
}
