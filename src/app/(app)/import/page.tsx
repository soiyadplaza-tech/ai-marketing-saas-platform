"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card, Badge } from "@/lib/ui";

type Kind = "csv" | "text" | "manual";

const SOURCES = [
  { kind: "csv" as Kind, icon: "📄", label: "CSV / Excel", desc: "Upload or paste CSV. AI maps columns automatically." },
  { kind: "text" as Kind, icon: "📝", label: "Paste Anything", desc: "Paste unstructured text — AI extracts leads." },
  { kind: "manual" as Kind, icon: "✍️", label: "Manual Entry", desc: "Add a single lead by hand." },
];

const UPCOMING = ["Google Sheets", "PDF", "Word", "PowerPoint", "Images (OCR)", "Video", "Website URL"];

function SheetImport() {
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [done, setDone] = useState<any>(null);
  const [error, setError] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function doPreview() {
    setLoading(true); setError(""); setDone(null); setPreview(null);
    const r = await fetch("/api/import/sheet", { method: "POST", body: JSON.stringify({ mode: "preview", url: url || undefined, content: fileContent || undefined }) });
    const d = await r.json();
    setLoading(false);
    if (!r.ok) { setError(d.error || "Failed to read the sheet"); return; }
    setPreview(d);
  }

  async function commit() {
    setCommitting(true); setError("");
    const r = await fetch("/api/import/sheet", { method: "POST", body: JSON.stringify({ mode: "commit", url: url || undefined, content: fileContent || undefined, fileName }) });
    const d = await r.json();
    setCommitting(false);
    if (!r.ok) { setError(d.error || "Import failed"); return; }
    setDone(d); setPreview(null);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => { setFileContent(String(reader.result || "")); setUrl(""); };
    reader.readAsText(f);
  }

  return (
    <Card className="border-indigo-300 bg-gradient-to-br from-indigo-50 to-white p-5">
      <div className="flex items-center gap-3">
        <div className="text-2xl">📥</div>
        <div>
          <div className="font-semibold">Import Google Sheet / CSV — one profile per person</div>
          <div className="text-xs text-slate-500">Paste your Google Sheet link (shared as “Anyone with the link can view”) or upload a CSV. Every person becomes a full profile with all their data.</div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={url}
          onChange={(e) => { setUrl(e.target.value); setFileContent(""); setFileName(""); }}
          placeholder="https://docs.google.com/spreadsheets/d/.../edit?gid=..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button onClick={() => fileRef.current?.click()} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold">Upload CSV</button>
        <input ref={fileRef} type="file" accept=".csv,.txt" onChange={onFile} className="hidden" />
        <button onClick={doPreview} disabled={loading || (!url && !fileContent)} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? "Reading…" : "Preview"}
        </button>
      </div>
      {fileName && <div className="mt-2 text-xs text-slate-500">Selected file: {fileName}</div>}
      <div className="mt-2 text-xs text-slate-500">
        Keep your sheet <b>private</b>? Publish the ready-made <Link href="/google-script" className="font-semibold text-indigo-600 hover:underline">Google Apps Script →</Link> and paste its <code className="font-mono">/exec</code> URL here instead.
      </div>

      {error && <div className="mt-3 rounded-lg bg-rose-50 p-2 text-sm text-rose-700">⚠️ {error}</div>}

      {done && (
        <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          ✅ Created <b>{done.inserted}</b> per-person profiles ({done.dupCount} duplicates skipped, {done.invalidCount} invalid).{" "}
          <Link href="/leads" className="font-semibold underline">View profiles →</Link>
        </div>
      )}

      {preview && (
        <div className="mt-4">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge className="border-slate-200 bg-white text-slate-600">{preview.total} rows</Badge>
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">{preview.newCount} new profiles</Badge>
            <Badge className="border-amber-200 bg-amber-50 text-amber-700">{preview.dupCount} duplicates</Badge>
            <Badge className="border-rose-200 bg-rose-50 text-rose-700">{preview.invalidCount} invalid</Badge>
          </div>
          <div className="mb-3 rounded-lg bg-white p-3 text-xs shadow-sm">
            <div className="mb-1 font-medium text-slate-600">AI Column Mapping (auto-detected)</div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(preview.mapping).slice(0, 30).map(([col, field]: any) => (
                <span key={col} className={`rounded px-1.5 py-0.5 ${field === "(ignored)" ? "bg-slate-100 text-slate-400" : "bg-indigo-50 text-indigo-700"}`}>{col}→{field}</span>
              ))}
            </div>
          </div>
          <div className="max-h-72 overflow-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 text-left text-slate-500"><tr><th className="p-2">Person</th><th className="p-2">Title</th><th className="p-2">Company</th><th className="p-2">Email</th><th className="p-2">Status</th></tr></thead>
              <tbody>
                {preview.sample.map((s: any, i: number) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="p-2 font-medium">{s.lead.contactName || "—"}</td>
                    <td className="p-2 text-slate-500">{s.lead.title || "—"}</td>
                    <td className="p-2">{s.lead.company}</td>
                    <td className="p-2 text-slate-500">{s.lead.email || "—"}</td>
                    <td className="p-2"><Badge className={s.status === "new" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : s.status === "duplicate" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-rose-200 bg-rose-50 text-rose-700"}>{s.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={commit} disabled={committing || preview.newCount === 0} className="mt-3 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {committing ? "Creating profiles…" : `Create ${preview.newCount} Profiles`}
          </button>
        </div>
      )}
    </Card>
  );
}

function Base44Import() {
  const [status, setStatus] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function refresh() {
    const r = await fetch("/api/integrations/base44");
    setStatus(await r.json());
  }
  useEffect(() => { refresh(); }, []);

  async function run() {
    setBusy(true); setResult(null);
    const r = await fetch("/api/integrations/base44", { method: "POST" });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) { setResult({ error: d.message || "Import failed" }); return; }
    setResult(d);
  }

  const connected = status?.status === "connected";
  return (
    <Card className="border-indigo-200 bg-indigo-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🗂️</div>
          <div>
            <div className="font-semibold">Master Spreadsheet — Base44 DataSheet Hub</div>
            <div className="text-xs text-slate-500">
              {status == null ? "Checking connection…" : connected ? `Connected${status.appName ? " · " + status.appName : ""} · ${status.available} master leads available` : status?.error || "Not connected"}
            </div>
          </div>
        </div>
        <Badge className={connected ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}>
          {connected ? "● Connected" : "○ " + (status?.status || "…")}
        </Badge>
      </div>
      {connected && (
        <button onClick={run} disabled={busy} className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Importing master leads…" : `Import / Sync ${status.available} Master Leads`}
        </button>
      )}
      {result?.error && <div className="mt-2 rounded-lg bg-rose-50 p-2 text-sm text-rose-700">{result.error}</div>}
      {result?.ok && <div className="mt-2 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">✅ {result.inserted} new, {result.updated} updated from the master spreadsheet.</div>}
    </Card>
  );
}

export default function ImportPage() {
  const [kind, setKind] = useState<Kind>("csv");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [done, setDone] = useState<any>(null);
  const [manual, setManual] = useState({ company: "", contactName: "", email: "", phone: "", website: "", industry: "", location: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  async function doPreview() {
    setLoading(true); setDone(null);
    const r = await fetch("/api/import", { method: "POST", body: JSON.stringify({ mode: "preview", kind, content }) });
    setPreview(await r.json());
    setLoading(false);
  }

  async function commit() {
    setCommitting(true);
    const body: any = { mode: "commit", kind, content };
    if (kind === "manual") body.leads = [manual];
    const r = await fetch("/api/import", { method: "POST", body: JSON.stringify(body) });
    const d = await r.json();
    setDone(d); setPreview(null); setContent(""); setCommitting(false);
  }

  async function commitManual() {
    setCommitting(true);
    const r = await fetch("/api/leads", { method: "POST", body: JSON.stringify(manual) });
    const d = await r.json();
    setCommitting(false);
    if (r.ok) setDone({ inserted: 1 });
    else alert(d.error || "Failed");
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setContent(String(reader.result || ""));
    reader.readAsText(f);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 animate-fadein">
      <div>
        <h1 className="text-2xl font-bold">Add Data</h1>
        <p className="text-sm text-slate-500">Universal AI data input — import leads from multiple sources.</p>
      </div>

      <SheetImport />

      <Base44Import />

      <div className="grid gap-3 sm:grid-cols-3">
        {SOURCES.map((s) => (
          <button key={s.kind} onClick={() => { setKind(s.kind); setPreview(null); setDone(null); }} className={`rounded-xl border p-4 text-left transition ${kind === s.kind ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
            <div className="text-2xl">{s.icon}</div>
            <div className="mt-2 font-semibold">{s.label}</div>
            <div className="text-xs text-slate-500">{s.desc}</div>
          </button>
        ))}
      </div>

      {done && (
        <Card className="border-emerald-200 bg-emerald-50 p-6 text-center">
          <div className="text-3xl">✅</div>
          <div className="mt-2 font-semibold text-emerald-800">Imported {done.inserted} leads successfully!</div>
          {done.dupCount > 0 && <div className="text-sm text-emerald-700">{done.dupCount} duplicates skipped · {done.invalidCount} invalid</div>}
          <Link href="/leads" className="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">View Leads →</Link>
        </Card>
      )}

      {kind === "csv" && !done && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Upload or paste CSV</h3>
            <button onClick={() => fileRef.current?.click()} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Choose File</button>
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={onFile} className="hidden" />
          </div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="company,email,phone,website,industry,location&#10;Acme Ltd,info@acme.com,+880...,acme.com,Retail,Dhaka" className="mt-3 w-full rounded-lg border border-slate-300 p-3 font-mono text-xs" />
          <button onClick={doPreview} disabled={loading || !content.trim()} className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Analyzing…" : "Preview & Map"}</button>
        </Card>
      )}

      {kind === "text" && !done && (
        <Card className="p-4">
          <h3 className="font-semibold">Paste any text</h3>
          <p className="text-xs text-slate-500">Emails, business cards content, notes — AI extracts structured leads.</p>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="Acme Ltd - contact John Doe john@acme.com +8801711000000 acme.com..." className="mt-3 w-full rounded-lg border border-slate-300 p-3 text-sm" />
          <button onClick={doPreview} disabled={loading || !content.trim()} className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Extracting…" : "Extract Leads"}</button>
        </Card>
      )}

      {kind === "manual" && !done && (
        <Card className="p-4">
          <h3 className="mb-3 font-semibold">Add a lead</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {([["company","Company *"],["contactName","Contact Name"],["email","Email"],["phone","Phone"],["website","Website"],["industry","Industry"],["location","Location"]] as const).map(([k, label]) => (
              <div key={k}>
                <label className="text-xs font-medium text-slate-600">{label}</label>
                <input value={(manual as any)[k]} onChange={(e) => setManual({ ...manual, [k]: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
            ))}
          </div>
          <button onClick={commitManual} disabled={committing || !manual.company.trim()} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{committing ? "Saving…" : "Create Lead"}</button>
        </Card>
      )}

      {preview && (
        <Card className="p-4">
          <h3 className="mb-2 font-semibold">Preview</h3>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">{preview.newCount} new</Badge>
            <Badge className="border-amber-200 bg-amber-50 text-amber-700">{preview.dupCount} duplicates</Badge>
            <Badge className="border-rose-200 bg-rose-50 text-rose-700">{preview.invalidCount} invalid</Badge>
          </div>
          {preview.mapping && Object.keys(preview.mapping).length > 0 && (
            <div className="mb-3 rounded-lg bg-slate-50 p-3 text-xs">
              <div className="mb-1 font-medium text-slate-600">AI Column Mapping</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(preview.mapping).map(([col, field]: any) => (
                  <span key={col} className="rounded bg-white px-2 py-1 shadow-sm">{col} → <b className="text-indigo-600">{field}</b></span>
                ))}
              </div>
            </div>
          )}
          <div className="max-h-64 overflow-auto rounded-lg border border-slate-100">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-left text-slate-500"><tr><th className="p-2">Company</th><th className="p-2">Email</th><th className="p-2">Website</th><th className="p-2">Status</th></tr></thead>
              <tbody>
                {preview.sample.map((s: any, i: number) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="p-2">{s.lead.company}</td>
                    <td className="p-2">{s.lead.email || "—"}</td>
                    <td className="p-2">{s.lead.website || "—"}</td>
                    <td className="p-2">
                      <Badge className={s.status === "new" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : s.status === "duplicate" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-rose-200 bg-rose-50 text-rose-700"}>{s.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={commit} disabled={committing || preview.newCount === 0} className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{committing ? "Importing…" : `Import ${preview.newCount} Leads`}</button>
        </Card>
      )}

      <Card className="p-4">
        <h3 className="font-semibold">More sources — Integration Required</h3>
        <p className="text-xs text-slate-500">These sources require a connected provider or file-processing service.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {UPCOMING.map((u) => <Badge key={u} className="border-slate-200 bg-slate-50 text-slate-500">{u} · setup in Integrations</Badge>)}
        </div>
        <Link href="/integrations" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">Go to Integrations →</Link>
      </Card>
    </div>
  );
}
