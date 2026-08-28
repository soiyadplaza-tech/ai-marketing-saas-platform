"use client";

import { useEffect, useState } from "react";
import { Card, Badge, timeAgo } from "@/lib/ui";

interface Job { id: number; type: string; label: string; status: string; durationMs: number; createdAt: string; error: string | null; }
interface FileRow { id: number; name: string; fileType: string; status: string; recordsFound: number; createdAt: string; }

export default function ProcessingPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [files, setFiles] = useState<FileRow[]>([]);

  async function load() {
    const r = await fetch("/api/files");
    const d = await r.json();
    setJobs(d.jobs || []);
    setFiles(d.files || []);
  }
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, []);

  const statusStyle: Record<string, string> = {
    completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
    processing: "border-sky-200 bg-sky-50 text-sky-700",
    queued: "border-slate-200 bg-slate-50 text-slate-600",
    failed: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4 animate-fadein">
      <div>
        <h1 className="text-2xl font-bold">AI Processing Center</h1>
        <p className="text-sm text-slate-500">Background AI jobs and file processing. The app stays usable while jobs run.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 p-4"><h2 className="font-semibold">AI Jobs</h2></div>
          <div className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
            {jobs.length === 0 && <div className="p-8 text-center text-sm text-slate-400">No jobs yet.</div>}
            {jobs.map((j) => (
              <div key={j.id} className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{j.label}</div>
                  <div className="text-xs text-slate-500">{j.type} · {j.durationMs}ms · {timeAgo(j.createdAt)}</div>
                  {j.error && <div className="text-xs text-rose-600">{j.error}</div>}
                </div>
                <Badge className={statusStyle[j.status]}>{j.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4"><h2 className="font-semibold">File Library</h2></div>
          <div className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
            {files.length === 0 && <div className="p-8 text-center text-sm text-slate-400">No files imported yet.</div>}
            {files.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{f.name}</div>
                  <div className="text-xs text-slate-500">{f.fileType} · {f.recordsFound} records · {timeAgo(f.createdAt)}</div>
                </div>
                <Badge className={statusStyle[f.status]}>{f.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
