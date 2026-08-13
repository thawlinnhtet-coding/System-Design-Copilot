import { AppShell } from "@/components/navigation/app-shell";
import { BillingCheckoutResult } from "@/features/billing/billing-checkout-result";

export default function BillingCancelPage() {
  return <AppShell><BillingCheckoutResult canceled /></AppShell>;
}
