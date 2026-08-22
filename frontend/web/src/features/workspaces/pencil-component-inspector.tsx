import { Trash2 } from "lucide-react";
import type { CanvasNode, CanvasNodeData } from "./architecture-editor-store";

function humanize(value: string | undefined) {
  return value
    ? value.replaceAll("_", " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/^./, (character) => character.toUpperCase())
    : "Not specified";
}

function valueFor(node: CanvasNode, key: string) {
  return String(node.data.properties[key] ?? "");
}

export function PencilComponentInspector({ disabled, node, onChange, onDelete }: { disabled: boolean; node: CanvasNode; onChange: (patch: Partial<CanvasNodeData>) => void; onDelete: () => void }) {
  const updateProperty = (key: string, value: string) => onChange({ properties: { ...node.data.properties, [key]: value } });
  const responsibility = valueFor(node, "responsibility");
  const fields = [
    { key: "responsibility", label: "Responsibility", kind: "input" },
    { key: "stateModel", label: "State model", kind: "select", options: ["STATELESS", "STATEFUL", "EVENT_SOURCED"] },
    { key: "protocol", label: "Protocol", kind: "select", options: ["HTTPS", "HTTP", "GRPC", "WEBSOCKET", "TCP", "UDP"] },
    { key: "authBoundary", label: "Authentication", kind: "select", options: ["NONE", "SERVICE_JWT", "USER_SESSION", "MTLS", "API_KEY"] },
    { key: "deliveryGuarantee", label: "Delivery semantics", kind: "select", options: ["AT_LEAST_ONCE", "AT_MOST_ONCE", "EXACTLY_ONCE"] },
  ] as const;
  const summaryFields = fields.filter((field) => field.key !== "responsibility" && valueFor(node, field.key));
  return <section className="pt-5">
    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#626a66]">Selected component</p>
    <h2 className="mt-2 font-display text-[22px] font-normal leading-[1.2] text-[#18201e]">{node.data.label}</h2>
    <p className="mt-3 text-[13px] leading-5 text-[#626a66]">{responsibility || "Record the role this Component plays and the behavior it must preserve."}</p>
    <dl className="mt-5 grid gap-3 text-[12px]">
      <div className="flex items-center justify-between gap-4"><dt className="text-[#626a66]">Type</dt><dd className="text-right text-[#18201e]">{humanize(node.data.type)}</dd></div>
      {summaryFields.map((field) => <div className="flex items-center justify-between gap-4" key={field.key}><dt className="text-[#626a66]">{field.label}</dt><dd className="text-right text-[#18201e]">{humanize(valueFor(node, field.key))}</dd></div>)}
    </dl>
    <div className="mt-7">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#626a66]">Edit Component</p>
      <label className="mt-4 block text-[10px] text-[#626a66]" htmlFor="component-label">Name</label>
      <input className="mt-1.5 min-h-9 w-full rounded-[4px] border border-[#d6d1c5] bg-[#f4f1e8] px-3 text-[12px] text-[#18201e] outline-none focus:border-[#0f766e] disabled:opacity-50" disabled={disabled} id="component-label" onChange={(event) => onChange({ label: event.target.value })} value={node.data.label} />
      {fields.map((field) => <label className="mt-3 block text-[10px] text-[#626a66]" key={field.key}>{field.label}{field.kind === "select" ? <select className="mt-1.5 min-h-9 w-full rounded-[4px] border border-[#d6d1c5] bg-[#f4f1e8] px-3 text-[12px] text-[#18201e] outline-none focus:border-[#0f766e] disabled:opacity-50" disabled={disabled} onChange={(event) => updateProperty(field.key, event.target.value)} value={valueFor(node, field.key)}><option value="">Not specified</option>{field.options.map((option) => <option key={option} value={option}>{humanize(option)}</option>)}</select> : <input className="mt-1.5 min-h-9 w-full rounded-[4px] border border-[#d6d1c5] bg-[#f4f1e8] px-3 text-[12px] text-[#18201e] outline-none focus:border-[#0f766e] disabled:opacity-50" disabled={disabled} onChange={(event) => updateProperty(field.key, event.target.value)} value={valueFor(node, field.key)} />}</label>)}
    </div>
    <div className="mt-6 flex flex-wrap gap-2 border-t border-[#35413d] pt-5">
      <button className="inline-flex min-h-[38px] items-center rounded-[4px] bg-[#0f766e] px-3 text-[12px] font-semibold text-[#f0f3f1] disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled} onClick={() => onChange({})} type="button">Save changes</button>
      <button className="inline-flex min-h-[38px] items-center gap-2 rounded-[4px] border border-[#c7a09a] px-3 text-[12px] font-semibold text-[#8d332a] hover:bg-[#f5e3e0] disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled} onClick={onDelete} type="button"><Trash2 aria-hidden="true" size={14} />Delete</button>
    </div>
  </section>;
}
