import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { PricingAction } from "@/features/billing/pricing-action";

const freeFeatures = ["10 active Workspaces", "50 Copilot Turns / month", "5 full Reviews / month", "Starter Challenge library"];
const proFeatures = ["Unlimited Workspaces", "Unlimited Copilot Turns and Reviews*", "Full Challenge library", "Review comparison and advanced progress"];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-line bg-background">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-16">
          <Link aria-label="System Design Copilot home" href="/"><BrandMark /></Link>
          <Link className="inline-flex items-center gap-2 text-[13px] font-medium text-text-muted hover:text-foreground" href="/"><ArrowLeft aria-hidden="true" size={15} />Back to home</Link>
        </div>
      </header>
      <section className="mx-auto flex max-w-[1100px] flex-col items-center px-5 pb-10 pt-14 text-center sm:px-8">
        <p className="font-mono text-[11px] text-signal">PLANS / COMMERCIAL LAUNCH</p>
        <h1 className="mt-3 max-w-[760px] font-display text-[clamp(38px,5vw,56px)] font-medium leading-[1.04] tracking-[-0.045em]">Practice freely. Upgrade when the limits matter.</h1>
        <p className="mt-5 max-w-[680px] text-[15px] leading-6 text-text-muted">Both plans use the same AI profiles and privacy routing. Pro expands access, usage, and practice depth.</p>
      </section>
      <section className="mx-auto grid max-w-[920px] gap-6 px-5 pb-10 sm:px-8 md:grid-cols-2">
        <PlanCard name="Free" price="$0" description="Meaningful practice with bounded monthly AI usage." features={freeFeatures} />
        <PlanCard name="Pro" price="$20" description="Deeper, uninterrupted practice for committed learners." features={proFeatures} pro />
      </section>
      <section className="mx-auto flex max-w-[920px] flex-col gap-2 px-5 pb-14 text-center text-[11px] leading-5 text-text-muted sm:px-8">
        <p>* Subject to fair-use rate, concurrency, abuse, and spend protections. Pricing and allowances are server-configurable.</p>
         <p className="text-warning">Stripe Checkout is test-mode only during the Free personal beta, so no real payment is collected. Ordinary beta participants remain on Free; only separately configured non-public test accounts may exercise test-mode Pro access.</p>
      </section>
    </main>
  );
}

function PlanCard({ name, price, description, features, pro = false }: { name: string; price: string; description: string; features: string[]; pro?: boolean }) {
  return <article className={`flex min-h-[440px] flex-col rounded border p-7 text-left ${pro ? "border-chrome-800 bg-chrome-800 text-text-on-dark" : "border-line bg-surface"}`}>
    <div className="flex items-center justify-between"><h2 className="font-display text-[26px] font-medium">{name}</h2>{pro && <span className="rounded bg-signal px-2 py-1 font-mono text-[10px] text-white">PRO</span>}</div>
    <div className="mt-5 flex items-end gap-2"><span className="font-display text-[42px] font-medium">{price}</span><span className={`pb-1 text-[13px] ${pro ? "text-text-on-dark-secondary" : "text-text-muted"}`}>/ month</span></div>
    <p className={`mt-3 text-[13px] leading-5 ${pro ? "text-text-on-dark-secondary" : "text-text-muted"}`}>{description}</p>
    <div className={`my-6 h-px ${pro ? "bg-[#39413e]" : "bg-line"}`} />
    <ul className="grid gap-4">{features.map((feature) => <li className="flex items-center gap-2 text-[13px]" key={feature}><Check aria-hidden="true" className="shrink-0 text-signal" size={15} />{feature}</li>)}</ul>
    <div className="mt-auto pt-8"><PricingAction pro={pro} /></div>
  </article>;
}
