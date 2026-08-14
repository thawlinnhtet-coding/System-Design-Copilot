import { AppShell } from "@/components/navigation/app-shell";
import { ChallengeDetail } from "@/features/challenges/challenge-detail";

export default async function ChallengeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <AppShell><section className="mx-auto w-full max-w-6xl"><ChallengeDetail slug={slug} /></section></AppShell>;
}
