"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge } from "@/lib/ui";

interface Member { id: number; orgId: number; name: string; email: string; role: string; active: boolean; workspace: string; joined: string; isOwner: boolean; leadCount: number; }

export default function MembersPage() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch("/api/members").then(async (r) => {
      if (r.status === 401) { setErr("Only the platform admin can view members."); return; }
      setData(await r.json());
    });
  }, []);

  if (err) return <Card className="mx-auto max-w-3xl p-8 text-center text-sm text-slate-500">{err}</Card>;
  if (!data) return <div className="grid min-h-[50vh] place-items-center"><span className="spinner spinner-dark" /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-4 animate-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-sm text-slate-500">Everyone who has joined the platform. You (the owner) can see all of them.</p>
        </div>
        <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700">{data.totalMembers} members</Badge>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Workspace</th>
              <th className="px-4 py-3">Leads</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.members.map((m: Member) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                      {m.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">
                        {m.name}
                        {m.isOwner && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">OWNER</span>}
                      </div>
                      <div className="text-xs text-slate-500">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge className={m.role === "super_admin" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-600"}>
                    {m.role === "super_admin" ? "Admin" : "Member"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{m.workspace}</td>
                <td className="px-4 py-3">
                  <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700">{m.leadCount?.toLocaleString() || 0}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{new Date(m.joined).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Link href={`/leads?org=${m.orgId}`} className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold hover:bg-slate-50">
                    View workspace
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
