"use client";

import { useEffect, useState } from "react";
import { Card, Badge } from "@/lib/ui";

interface User { id: number; name: string; email: string; role: string; active: boolean; }

const ROLES = ["super_admin", "admin", "manager", "sales", "marketing", "auditor", "viewer"];
const ROLE_PERMS: Record<string, string> = {
  super_admin: "Full access to everything, billing & org settings.",
  admin: "Manage leads, campaigns, team & integrations.",
  manager: "Assign leads/tasks, view team performance.",
  sales: "Work assigned leads, pipeline & outreach.",
  marketing: "Campaigns, audits & opportunity analysis.",
  auditor: "Run website audits & review findings.",
  viewer: "Read-only access to dashboards & reports.",
};

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => { fetch("/api/team").then((r) => r.json()).then((d) => setUsers(d.users || [])); }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-4 animate-fadein">
      <div>
        <h1 className="text-2xl font-bold">Team Management</h1>
        <p className="text-sm text-slate-500">Roles, permissions and organization-level access control.</p>
      </div>

      <Card>
        <div className="border-b border-slate-100 p-4"><h2 className="font-semibold">Members</h2></div>
        <div className="divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">{u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div>
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </div>
              </div>
              <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700 capitalize">{u.role.replace("_", " ")}</Badge>
            </div>
          ))}
          {users.length === 0 && <div className="p-8 text-center text-sm text-slate-400">No team members.</div>}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 font-semibold">Roles & Permissions</h2>
        <div className="space-y-2">
          {ROLES.map((r) => (
            <div key={r} className="flex items-start gap-3 rounded-lg border border-slate-100 p-2 text-sm">
              <Badge className="border-slate-200 bg-slate-50 capitalize">{r.replace("_", " ")}</Badge>
              <span className="text-slate-600">{ROLE_PERMS[r]}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
