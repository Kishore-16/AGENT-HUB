import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChangePasswordForm } from "@/components/profile/change-password-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [agentCount, totalRuns] = await Promise.all([
    prisma.agent.count({ where: { creatorId: user.id } }),
    prisma.agentRun.count({ where: { agent: { creatorId: user.id } } }),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
      <p className="mt-2 text-slate-600">Your account details and settings.</p>

      {/* Account info */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
          Account
        </h2>
        <div className="divide-y divide-slate-100 text-sm">
          <div className="flex items-center justify-between py-3">
            <span className="text-slate-500">Name</span>
            <span className="font-medium text-slate-900">{user.name}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-slate-500">Email</span>
            <span className="font-medium text-slate-900">{user.email}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-slate-500">Member since</span>
            <span className="font-medium text-slate-900">
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">{agentCount}</p>
          <p className="mt-1 text-sm text-slate-500">Published Agents</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">{totalRuns}</p>
          <p className="mt-1 text-sm text-slate-500">Total Runs</p>
        </div>
      </div>

      <div className="mt-4">
        <Link
          href="/developer-dashboard"
          className="inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Developer Dashboard →
        </Link>
        <Link
          href="/history"
          className="ml-3 inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Run History →
        </Link>
      </div>

      {/* Change password */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900">Change Password</h2>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </div>
    </main>
  );
}
