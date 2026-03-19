import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { StartApplicationForm } from '@/components/start-application-form';
import { StatusBadge } from '@/components/status-badge';
import { getCurrentUserAndProfile } from '@/lib/authz';
import { LOAN_TYPE_LABELS } from '@/lib/intake';
import type { ApplicationRecord, UserProfile } from '@/lib/types';

export default async function BrokerPage() {
  const { supabase, user, profile } = await getCurrentUserAndProfile();

  if (!user || !profile) {
    redirect('/auth/login');
  }

  if (profile.role !== 'broker') {
    redirect('/dashboard');
  }

  const [{ data: appData }, { data: borrowers }] = await Promise.all([
    supabase.from('applications').select('*').order('updated_at', { ascending: false }),
    supabase.from('user_profiles').select('id,full_name,email').eq('role', 'borrower').order('created_at', { ascending: false })
  ]);

  const applications = (appData as ApplicationRecord[] | null) || [];
  const borrowerOptions = (borrowers as Pick<UserProfile, 'id' | 'full_name' | 'email'>[] | null) || [];

  return (
    <main className="min-h-screen">
      <SiteHeader email={user.email} role={profile.role} />

      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Broker Pipeline</h1>
        <p className="mt-2 text-slate-600">Create and manage borrower applications assigned to your broker account.</p>

        <div className="mt-6">
          <StartApplicationForm role={profile.role} borrowerOptions={borrowerOptions} />
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Pipeline</h2>
          <div className="mt-4 space-y-3">
            {applications.length ? (
              applications.map((app) => (
                <article key={app.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">Application {app.id.slice(0, 8)}</p>
                      <p className="text-xs text-slate-500">Borrower: {app.borrower_id.slice(0, 8)} | Broker: {app.broker_id?.slice(0, 8) || '-'}</p>
                      <p className="text-xs text-slate-500">
                        Step {app.progress_step}/5 | {app.loan_type ? LOAN_TYPE_LABELS[app.loan_type] : 'Loan type pending'}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>

                  <div className="mt-3">
                    <Link
                      href={`/applications/${app.id}/intake?step=${Math.max(1, app.progress_step)}`}
                      className="inline-flex rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Open Intake
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-500">No broker applications yet.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
