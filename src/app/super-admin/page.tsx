import { redirect } from 'next/navigation';
import { RoleUpdateForm } from '@/components/role-update-form';
import { SiteHeader } from '@/components/site-header';
import { getCurrentUserAndProfile } from '@/lib/authz';
import type { AuditLogRecord, UserProfile } from '@/lib/types';

export default async function SuperAdminPage() {
  const { supabase, user, profile } = await getCurrentUserAndProfile();

  if (!user || !profile) {
    redirect('/auth/login');
  }

  if (profile.role !== 'super_admin') {
    redirect('/dashboard');
  }

  const [{ data: profiles }, { data: logs }] = await Promise.all([
    supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(30)
  ]);

  const profileList = (profiles as UserProfile[] | null) || [];
  const auditList = (logs as AuditLogRecord[] | null) || [];

  return (
    <main className="min-h-screen">
      <SiteHeader email={user.email} role={profile.role} />

      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Super Admin Console</h1>
        <p className="mt-2 text-slate-600">Manage global roles and inspect cross-entity audit history.</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">User Role Management</h2>
            <div className="mt-4 space-y-3">
              {profileList.map((item) => (
                <div key={item.id} className="rounded-md border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-900">{item.full_name}</p>
                  <p className="text-xs text-slate-500">{item.email}</p>
                  <div className="mt-2">
                    <RoleUpdateForm profileId={item.id} currentRole={item.role} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Recent Audit Logs</h2>
            <div className="mt-4 space-y-2 text-xs">
              {auditList.length ? (
                auditList.map((log) => (
                  <div key={log.id} className="rounded-md border border-slate-100 bg-slate-50 p-2">
                    <p className="font-medium text-slate-800">{log.entity_type} {log.action}</p>
                    <p className="text-slate-500">Entity: {log.entity_id}</p>
                    <p className="text-slate-500">Actor: {log.actor_id || 'system'}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No audit logs found.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
