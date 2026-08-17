import { AppShell } from "@/components/navigation/app-shell";
import { ProgressOverview } from "@/features/progress/progress-overview";

export default function ProgressPage() {
  return (
    <AppShell fullBleed>
      <section className="w-full px-5 py-8 sm:px-8 lg:px-16 lg:py-[38px]">
        <ProgressOverview />
      </section>
    </AppShell>
  );
}
