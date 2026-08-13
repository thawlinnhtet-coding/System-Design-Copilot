"use client";

import { AlertTriangle, CheckCircle2, Download, FileJson, Upload } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { downloadPortablePackage, packageBytes, portablePackageMaxBytes, validatePortablePackage, type PortablePackage } from "@/lib/portable-package";

const emptyPackage: PortablePackage = { format: "system-design-copilot", schemaVersion: 1, workspace: { title: "", requirements: [], assumptions: [], decisions: [], architecture: { nodes: [], edges: [], groups: [], viewport: {} } } };

export function PortableData() {
  const [selectedPackage, setSelectedPackage] = useState<PortablePackage | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setSelectedPackage(null);
    setErrors([]);
    if (file.size > portablePackageMaxBytes) { setErrors(["This file is larger than the 1 MiB import limit."]); return; }
    setIsReading(true);
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const result = validatePortablePackage(parsed);
      setErrors(result.errors);
      setSelectedPackage(result.package ?? null);
    } catch { setErrors(["The file is not valid JSON."]); } finally { setIsReading(false); }
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
          <input accept="application/json,.json" className="sr-only" disabled={isReading} onChange={handleFile} type="file" />
        </label>
        {fileName ? <p className="mt-3 truncate text-xs text-text-muted" title={fileName}>{fileName}</p> : null}
        {errors.length ? <div className="mt-5 space-y-2 rounded-md border border-danger/30 bg-danger/10 p-4 text-sm text-danger" role="alert">{errors.map((error) => <p className="flex gap-2" key={error}><AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={15} />{error}</p>)}</div> : null}
        {selectedPackage ? <div className="mt-5 rounded-md border border-success/30 bg-success/10 p-4 text-sm"><p className="flex items-center gap-2 font-semibold text-success"><CheckCircle2 aria-hidden="true" size={16} /> Package validated</p><p className="mt-2 text-text-muted">{selectedPackage.workspace.title || "Untitled design"} · {packageBytes(selectedPackage)} bytes</p><p className="mt-3 text-text-muted">The server-side import and Review Goal handoff will create a new Architecture Review Workspace in the next Workspace entry slice.</p></div> : null}
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
