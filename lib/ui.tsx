import type { ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export const CATEGORY_STYLE: Record<string, string> = {
  cold: "bg-slate-100 text-slate-600 border-slate-200",
  warm: "bg-amber-100 text-amber-700 border-amber-200",
  hot: "bg-orange-100 text-orange-700 border-orange-200",
  priority: "bg-rose-100 text-rose-700 border-rose-200",
};

export const SEVERITY_STYLE: Record<string, string> = {
  good: "bg-emerald-100 text-emerald-700 border-emerald-200",
  info: "bg-sky-100 text-sky-700 border-sky-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  critical: "bg-rose-100 text-rose-700 border-rose-200",
  high: "bg-rose-100 text-rose-700 border-rose-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-sky-100 text-sky-700 border-sky-200",
};

export const STAGE_LABELS: Record<string, string> = {
  new_lead: "New Lead",
  researching: "Researching",
  audited: "Audited",
  qualified: "Qualified",
  contacted: "Contacted",
  replied: "Replied",
  interested: "Interested",
  meeting_booked: "Meeting Booked",
  proposal_sent: "Proposal Sent",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", className)}>
      {children}
    </span>
  );
}

export function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const color = score >= 80 ? "#e11d48" : score >= 60 ? "#ea580c" : score >= 40 ? "#d97706" : "#64748b";
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (score / 100) * c;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={c}
        strokeDashoffset={off}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fontSize={size / 3.5} fontWeight="700" fill={color}>
        {score}
      </text>
    </svg>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>{children}</div>;
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dd = Math.floor(h / 24);
  if (dd < 30) return `${dd}d ago`;
  return d.toLocaleDateString();
}
