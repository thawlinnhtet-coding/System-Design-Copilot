"use client";

import { AlertTriangle, CheckCircle2, Download, FileJson, Upload } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiRequestError, useAuthenticatedApiClient } from "@/lib/api/authenticated-client";
import { downloadPortablePackage, packageBytes, portablePackageMaxBytes, validatePortablePackage, type PortablePackage } from "@/lib/portable-package";

const emptyPackage: PortablePackage = { format: "system-design-copilot", schemaVersion: 1, workspace: { title: "Starter design", requirements: [], assumptions: [], decisions: [], architecture: { schemaVersion: 1, components: [], connections: [], boundaries: [] } } };
type PortableError = { path: string; reason: string; correction: string };

export function PortableData() {
  const [selectedPackage, setSelectedPackage] = useState<PortablePackage | null>(null);
  const [errors, setErrors] = useState<PortableError[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [serverValidated, setServerValidated] = useState(false);
  const [systemDescription, setSystemDescription] = useState("");
  const [reviewGoal, setReviewGoal] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const api = useAuthenticatedApiClient();
  const router = useRouter();

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setSelectedPackage(null);
    setErrors([]);
    setServerValidated(false);
    if (file.size > portablePackageMaxBytes) { setErrors([{ path: "$", reason: "This file is larger than the 1 MiB import limit.", correction: "Remove unused content and choose a smaller package." }]); return; }
    setIsReading(true);
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const result = validatePortablePackage(parsed);
      setErrors(result.errors.map((reason) => ({ path: "$", reason, correction: "Correct the package and choose it again." })));
      if (result.package) {
        setSelectedPackage(result.package);
        await new Promise((resolve) => window.setTimeout(resolve, 0));
        try {
          const serverResult = await api.validatePortableImport(result.package);
          setServerValidated(true);
          if (serverResult.preview?.bytes && serverResult.preview.bytes > portablePackageMaxBytes) setErrors([{ path: "$", reason: "The server rejected this package because it exceeds the import limit.", correction: "Remove unused content and try again." }]);
        } catch (caught) {
          const details = caught instanceof ApiRequestError ? caught.details : undefined;
          const serverErrors = Array.isArray(details?.errors) ? details.errors.map((item) => {
            if (typeof item === "object" && item !== null) {
              const value = item as Record<string, unknown>;
              return { path: String(value.path ?? "$"), reason: String(value.reason ?? "The server rejected this package."), correction: String(value.correction ?? "Correct the package and try again.") };
            }
            return { path: "$", reason: "The server rejected this package.", correction: "Correct the package and try again." };
          }) : [{ path: "$", reason: "The server could not validate this package.", correction: "Correct it and try again." }];
          setErrors(serverErrors);
        }
      }
    } catch { setErrors([{ path: "$", reason: "The file is not valid JSON.", correction: "Choose a valid JSON package." }]); } finally { setIsReading(false); }
  }

  async function createImportedWorkspace() {
    if (!selectedPackage || !systemDescription.trim() || !reviewGoal.trim()) return;
    setIsImporting(true);
    try {
      const workspace = await api.importPortablePackage(selectedPackage.workspace.title, systemDescription.trim(), reviewGoal.trim(), selectedPackage);
      if (workspace.id) router.push(`/workspace/${workspace.id}`);
    } catch (caught) {
      const details = caught instanceof ApiRequestError ? caught.details : undefined;
      setErrors(Array.isArray(details?.errors) ? details.errors.map((item) => {
        const value = item as Record<string, unknown>;
        return { path: String(value.path ?? "$"), reason: String(value.reason ?? "The import could not be created."), correction: String(value.correction ?? "Correct the package and try again.") };
      }) : [{ path: "$", reason: "The import could not be created.", correction: "Try again after correcting the package." }]);
    } finally { setIsImporting(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-lg border border-line bg-surface p-6 sm:p-8">
        <div className="flex size-11 items-center justify-center rounded-md bg-signal-soft text-signal"><Upload aria-hidden="true" size={20} /></div>
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Import Package</p>
        <h2 className="mt-2 font-display text-2xl font-semibold">Bring a design into practice.</h2>
        <p className="mt-3 text-sm leading-6 text-text-muted">Choose the documented JSON format. We check the format, version, size, and server-owned fields in your browser before anything can leave it.</p>
        <label className="mt-6 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-line px-4 text-sm font-semibold transition-colors hover:bg-surface-alt">
          <FileJson aria-hidden="true" size={17} /> {isReading ? "Checking package..." : "Choose JSON package"}
          <input accept="application/json,.json" aria-label="Choose JSON package" className="sr-only" disabled={isReading} onChange={handleFile} type="file" />
        </label>
        {fileName ? <p className="mt-3 truncate text-xs text-text-muted" title={fileName}>{fileName}</p> : null}
        {errors.length ? <div className="mt-5 space-y-3 rounded-md border border-danger/30 bg-danger/10 p-4 text-sm text-danger" role="alert">{errors.map((error, index) => <p className="flex gap-2" key={`${error.path}-${index}`}><AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={15} /><span><code className="font-mono text-xs">{error.path}</code>: {error.reason}<span className="mt-1 block text-xs text-text-muted">Correction: {error.correction}</span></span></p>)}</div> : null}
        {selectedPackage ? <div className="mt-5 rounded-md border border-success/30 bg-success/10 p-4 text-sm"><p className="flex items-center gap-2 font-semibold text-success"><CheckCircle2 aria-hidden="true" size={16} /> {serverValidated ? "Package validated by the server" : "Package preview ready"}</p><p className="mt-2 text-text-muted">{selectedPackage.workspace.title || "Untitled design"} · {packageBytes(selectedPackage)} bytes</p><p className="mt-3 text-text-muted">Requirements: {selectedPackage.workspace.requirements.length} · Assumptions: {selectedPackage.workspace.assumptions.length} · Decisions: {selectedPackage.workspace.decisions.length} · Components: {selectedPackage.workspace.architecture.components.length}</p></div> : null}
        {serverValidated ? <form className="mt-5 grid gap-3 border-t border-line pt-5" onSubmit={(event) => { event.preventDefault(); void createImportedWorkspace(); }}>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">ARCHITECTURE REVIEW BRIEF</p>
          <label className="grid gap-1 text-sm font-semibold">System description<textarea aria-label="Imported system description" className="field min-h-20" maxLength={2000} onChange={(event) => setSystemDescription(event.target.value)} required value={systemDescription} /></label>
          <label className="grid gap-1 text-sm font-semibold">Review goal<textarea aria-label="Imported review goal" className="field min-h-20" onChange={(event) => setReviewGoal(event.target.value)} required value={reviewGoal} /></label>
          <button className="inline-flex min-h-11 items-center justify-center rounded-md bg-signal px-4 text-sm font-semibold text-text-on-dark" disabled={isImporting} type="submit">{isImporting ? "Creating Workspace..." : "Create Architecture Review Workspace"}</button>
        </form> : null}
      </section>

      <section className="rounded-lg border border-line bg-surface p-6 sm:p-8">
        <div className="flex size-11 items-center justify-center rounded-md bg-signal-soft text-signal"><Download aria-hidden="true" size={20} /></div>
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Export Package</p>
        <h2 className="mt-2 font-display text-2xl font-semibold">Keep a portable copy.</h2>
        <p className="mt-3 text-sm leading-6 text-text-muted">Exports contain only the versioned design shape: Requirements, Assumptions, Decisions, and Architecture Document content. Credentials, billing, Usage Records, provider metadata, and Reviews never belong in this file.</p>
        <button className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-signal px-4 text-sm font-semibold text-text-on-dark hover:brightness-110" onClick={() => downloadPortablePackage(emptyPackage, "system-design-copilot-starter.json")} type="button"><Download aria-hidden="true" size={16} /> Download starter package</button>
        <p className="mt-4 text-xs leading-5 text-text-muted">Workspace-specific export becomes available from the Architecture Document once the editor contract is connected. This starter package is safe to use for testing the import flow.</p>
      </section>
    </div>
  );
}
