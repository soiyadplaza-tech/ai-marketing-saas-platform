"use client";

import { useState } from "react";
import { Card } from "@/lib/ui";
import { APPS_SCRIPT_CODE } from "@/lib/apps-script";

const STEPS = [
  { t: "Open script.google.com", d: "Log in with the same Google account that owns the spreadsheet. Click “New project”." },
  { t: "Paste the code below", d: "Delete the default Code.gs contents, paste the full script from the box below. Press Save (💾)." },
  { t: "Deploy → New deployment", d: "Top-right: click the Deploy button (🚀) → New deployment." },
  { t: "Select type: Web app", d: "Click the gear icon next to Select a type and choose “Web app”." },
  { t: "Execute as: Me", d: "IMPORTANT — this makes the script read your sheet with YOUR permission (works even if the sheet is private)." },
  { t: "Who has access: Anyone", d: "IMPORTANT — this lets the FOYSAL IT app call the URL without login. Choose “Anyone”." },
  { t: "Click Deploy and authorize", d: "Review access → choose your Google account → Advanced → Go to project (unsafe) → Allow. You get a link like https://script.google.com/macros/s/XXXX/exec" },
];

const TESTS = [
  { q: "(your /exec URL)", d: "Should display your sheet rows as CSV text in the browser." },
  { q: "…?action=sheets", d: "Lists every tab with its gid — useful to pick the right tab." },
  { q: "…?format=json", d: "Returns the sheet as JSON with automatic headers." },
  { q: "…?gid=1267128335", d: "Forces a specific tab by its gid." },
];

function Tip({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-100 p-3">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-slate-500">{body}</div>
    </div>
  );
}

export default function GoogleScriptPage() {
  const [copied, setCopied] = useState(false);
  const [showScript, setShowScript] = useState(true);

  async function copy() {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy the script code:", APPS_SCRIPT_CODE.slice(0, 800));
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 animate-fadein">
      <div>
        <h1 className="text-2xl font-bold">Google Apps Script — Publish Guide</h1>
        <p className="text-sm text-slate-500">
          One-click way to make your master spreadsheet available to FOYSAL IT — even if the sheet stays private. Publish the script below at{" "}
          <code className="rounded bg-slate-100 px-1 font-mono text-xs">script.google.com</code>, then paste the URL into Add Data.
        </p>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">1) The Script (paste into Code.gs)</h2>
            <p className="text-xs text-slate-500">Your master sheet ID is already filled in. Edit DEFAULT_GID if you use a different tab.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowScript(!showScript)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold">
              {showScript ? "Hide" : "Show"} code
            </button>
            <button onClick={copy} className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white ${copied ? "bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-500"}`}>
              {copied ? "✓ Copied!" : "Copy Code"}
            </button>
          </div>
        </div>
        {showScript && (
          <pre className="mt-3 max-h-[28rem] overflow-auto rounded-lg bg-slate-950 p-4 text-[11px] leading-relaxed text-emerald-300">
            {APPS_SCRIPT_CODE}
          </pre>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold">2) Publish (Launch) Steps — 7 steps, ~2 minutes</h2>
        <div className="mt-3 space-y-3">
          {STEPS.map((s, i) => (
            <div key={i} className="flex gap-3 rounded-lg border border-slate-100 p-3">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-indigo-600 text-xs font-bold text-white">{i + 1}</div>
              <div>
                <div className="text-sm font-semibold">{s.t}</div>
                <div className="text-xs text-slate-500">{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold">3) Test the Published URL</h2>
        <p className="mt-1 text-xs text-slate-500">Open these in a browser (replace with your /exec URL). If you see data — it is published correctly.</p>
        <div className="mt-3 space-y-2">
          {TESTS.map((t, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-slate-50 p-3">
              <code className="shrink-0 rounded bg-white px-2 py-1 font-mono text-[11px] text-indigo-700">{t.q}</code>
              <span className="text-xs text-slate-500">{t.d}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          ⚠️ If the URL shows “Access denied” — you deployed with “Who has access: Only me”. Redeploy: Deploy → Manage deployments → ✏️ Edit → Version: New version → access “Anyone”.
          <br />
          If it shows a Google sign-in page — it is fine for browser tests, but the app needs the “Anyone” setting.
          <br />
          <b>Never</b> change “Execute as” to “Anyone” — that is not allowed for sheet reads and “Me” is the correct, safe choice.
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold">4) Pro Advice — Make the Script Powerful & Safe</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Tip title="🔐 Keep it private + Execute as: Me" body="Never set 'Who has access' to the sheet itself. The Web App runs with YOUR permission, so the spreadsheet can stay fully private. This is the safest way to share data without exposing the sheet." />
          <Tip title="🔁 Auto-refresh (Cron-like) with a Time-Driven Trigger" body="In Apps Script: Triggers → Add Trigger → any function (e.g. a refresh cache function) → time-driven → every minute/hour. Useful to keep data fresh without re-importing manually." />
          <Tip title="🧵 Watch for new rows (change detection)" body="Add an onEdit(e) function to log or flag brand-new rows. Combine with a timestamp column so FOYSAL IT always knows which leads are fresh since the last import." />
          <Tip title="⏱️ Respect quotas & large sheets" body="Apps Script has daily quota limits (~6 min compute/day, ~30k cells per getValues). For very big sheets, read in chunks or split into tabs. Our importer already pages in chunks of 500." />
          <Tip title="🔁 Versioning — Edit, then deploy a NEW version" body="After changing the code, go to Deploy → Manage deployments → ✏️ Edit → Version: 'New version' → Deploy. The /exec URL stays the same, so FOYSAL IT needs no change." />
          <Tip title="📧 Email yourself on errors" body="Add GmailApp.sendEmail('you@gmail.com', ...) inside the catch block so you are alerted the moment the script fails. Add a try/catch to every trigger." />
          <Tip title="🗂️ Multi-sheet: one script, many tabs" body="Call the same /exec URL with ?sheet=TabName or ?gid=123 to serve different tabs. Great for separating Leads / Contacts / Clients." />
          <Tip title="🚫 Don't paste API keys into the script" body="Keep secrets out of Apps Script. If you later need a token, use ScriptApp's LockService sparingly, or better — keep keys server-side in FOYSAL IT Integrations, not in the script." />
        </div>
        <div className="mt-3 rounded-lg bg-indigo-50 p-3 text-xs text-indigo-800">
          💡 <b>Recommended master-sheet structure</b> (the importer auto-maps these): <code className="font-mono">Name · Company · Email · Phone · Website · Industry · Location · Notes</code>. Keep one person per row — that is how FOYSAL IT builds one full profile per person.
        </div>
      </Card>

      <Card className="border-emerald-200 bg-emerald-50 p-4">
        <h2 className="font-semibold text-emerald-800">5) Connect to FOYSAL IT</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-emerald-900">
          <li>Copy your URL: <code className="font-mono text-xs">https://script.google.com/macros/s/XXXX/exec</code></li>
          <li>Go to <b>Add Data</b> (📥 in the sidebar).</li>
          <li>Paste the URL in the Google Sheet box → <b>Preview</b>.</li>
          <li>Check the AI column mapping and row counts → <b>Create Profiles</b>.</li>
        </ol>
        <p className="mt-3 text-xs text-emerald-800">
          Bonus: the script also serves <b>JSON</b> (<code>?format=json</code>) — you can point any other tool at the same URL to read the same master data.
        </p>
      </Card>
    </div>
  );
}
