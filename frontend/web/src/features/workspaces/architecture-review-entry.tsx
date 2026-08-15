"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiRequestError, useAuthenticatedApiClient, type ManualRecreationRequest } from "@/lib/api/authenticated-client";

const field = "field w-full";
const manualRecreationSchema = z.object({
  name: z.string().trim().min(1, "Workspace name is required.").max(120),
  systemDescription: z.string().trim().min(1, "System description is required.").max(2000),
  reviewGoal: z.string().trim().min(1, "Review goal is required.").max(2000),
  knownRequirements: z.string().max(10000),
  knownAssumptions: z.string().max(10000),
});
type ManualRecreationFormValues = z.input<typeof manualRecreationSchema>;

export function ArchitectureReviewEntry() {
  const api = useAuthenticatedApiClient();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotency = useRef({ key: crypto.randomUUID(), fingerprint: "" });
  const { register, handleSubmit, formState: { errors } } = useForm<ManualRecreationFormValues>({
    resolver: zodResolver(manualRecreationSchema),
    defaultValues: { name: "", systemDescription: "", reviewGoal: "", knownRequirements: "", knownAssumptions: "" },
  });

  async function create(values: ManualRecreationFormValues) {
    setError(null);
    setIsCreating(true);
    try {
      const request: ManualRecreationRequest = {
        name: values.name.trim(),
        systemDescription: values.systemDescription.trim(),
        reviewGoal: values.reviewGoal.trim(),
        knownRequirements: lines(values.knownRequirements),
        knownAssumptions: lines(values.knownAssumptions),
      };
      const fingerprint = JSON.stringify(request);
      if (idempotency.current.fingerprint !== fingerprint) {
        idempotency.current = { key: crypto.randomUUID(), fingerprint };
      }
      const workspace = await api.createManualArchitectureReviewWorkspace(request, idempotency.current.key);
      if (workspace.id) router.push(`/workspace/${workspace.id}`);
    } catch (caught) {
      setError(caught instanceof ApiRequestError && caught.status === 403
        ? "Your plan has reached its active Workspace limit. Archive an inactive Workspace and try again."
        : "The Review Workspace could not be created. Your input is still here; try again.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1440px] flex-col gap-7 bg-background px-5 py-10 sm:px-8 lg:px-16 lg:py-[42px]" data-testid="architecture-review-entry">
      <header className="max-w-[760px]">
        <p className="font-mono text-[11px] leading-[1.3] text-text-muted">PRACTICE / ARCHITECTURE REVIEW</p>
        <h1 className="mt-[10px] font-display text-[42px] font-medium leading-[1.05] tracking-[-0.04em] text-foreground">Start from the system you already have.</h1>
        <p className="mt-[10px] max-w-[720px] text-[15px] leading-[1.5] text-text-muted">Reconstruct an existing architecture or import documented design work. The next step is to inspect the starting context before creating a Review Workspace.</p>
      </header>

      {error ? <p className="border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <form className="flex flex-col gap-4 border border-line bg-surface p-6 sm:p-8" onSubmit={(event) => void handleSubmit(create)(event)}>
          <div>
            <p className="font-mono text-[11px] leading-[1.3] text-text-muted">MANUAL RECREATION</p>
            <h2 className="mt-2 font-display text-2xl leading-[1.3]">Reconstruct an existing system</h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">Start with a blank, editable Architecture Document and make the existing system explicit yourself.</p>
          </div>
          <label className="grid gap-1 text-sm font-semibold" htmlFor="review-workspace-name">Workspace name<input aria-label="Workspace name" className={field} id="review-workspace-name" maxLength={120} placeholder="e.g. Ticket booking" {...register("name")} />{errors.name ? <span className="text-xs font-normal text-danger">{errors.name.message}</span> : null}</label>
          <label className="grid gap-1 text-sm font-semibold" htmlFor="review-system-description">System description<textarea aria-label="System description" className={`${field} min-h-24`} id="review-system-description" maxLength={2000} placeholder="Describe the existing system, users, and important boundaries." {...register("systemDescription")} />{errors.systemDescription ? <span className="text-xs font-normal text-danger">{errors.systemDescription.message}</span> : null}</label>
          <label className="grid gap-1 text-sm font-semibold" htmlFor="review-goal">Review goal<textarea aria-label="Review goal" className={`${field} min-h-20`} id="review-goal" maxLength={2000} placeholder="What should a later review evaluate?" {...register("reviewGoal")} />{errors.reviewGoal ? <span className="text-xs font-normal text-danger">{errors.reviewGoal.message}</span> : null}</label>
          <label className="grid gap-1 text-sm font-semibold" htmlFor="known-requirements">Known requirements <span className="font-normal text-text-muted">Optional; one per line.</span><textarea aria-label="Known requirements" className={`${field} min-h-20`} id="known-requirements" maxLength={10000} placeholder="Never oversell a seat" {...register("knownRequirements")} /></label>
          <label className="grid gap-1 text-sm font-semibold" htmlFor="known-assumptions">Known assumptions <span className="font-normal text-text-muted">Optional; one per line.</span><textarea aria-label="Known assumptions" className={`${field} min-h-20`} id="known-assumptions" maxLength={10000} placeholder="Inventory is partitioned by venue" {...register("knownAssumptions")} /></label>
          <button className="mt-2 inline-flex min-h-11 w-fit items-center justify-center border border-signal bg-signal px-4 text-sm font-semibold text-text-on-dark hover:brightness-110" disabled={isCreating} type="submit">{isCreating ? "Creating Review Workspace..." : "Create Review Workspace"}</button>
        </form>

        <section className="flex flex-col gap-4 border border-line bg-surface p-6 sm:p-8">
          <div>
            <p className="font-mono text-[11px] leading-[1.3] text-text-muted">IMPORT PACKAGE</p>
            <h2 className="mt-2 font-display text-2xl leading-[1.3]">Bring documented architecture work</h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">Import a supported JSON package to inspect its portable content before the Review Workspace is created.</p>
          </div>
          <div className="border-l-2 border-signal pl-4 text-sm leading-6 text-text-muted">Import is previewed and server-validated before a Review Workspace is created.</div>
          <Link className="mt-auto inline-flex min-h-11 w-fit items-center justify-center border border-signal px-4 text-sm font-semibold text-signal hover:bg-signal/10" href="/data">Import a package instead</Link>
        </section>
      </div>
    </div>
  );
}

function lines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}
