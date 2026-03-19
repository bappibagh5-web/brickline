import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { StartApplicationForm } from '@/components/start-application-form';
import { StatusBadge } from '@/components/status-badge';
import { getCurrentUserAndProfile } from '@/lib/authz';
import { LOAN_TYPE_LABELS } from '@/lib/intake';
import type { ApplicationRecord } from '@/lib/types';

export default async function BorrowerPage() {
  const { supabase, user, profile } = await getCurrentUserAndProfile();

  if (!user || !profile) {
    redirect('/auth/login');
  }

  if (profile.role !== 'borrower') {
    redirect('/dashboard');
  }

  const { data } = await supabase.from('applications').select('*').order('updated_at', { ascending: false });
  const applications = (data as ApplicationRecord[] | null) || [];

  return (
    <main className="min-h-screen">
      <SiteHeader email={user.email} role={profile.role} />

      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
        <p className="mt-2 text-slate-600">Create, resume, and submit your own REI loan applications.</p>

        <div className="mt-6">
          <StartApplicationForm role={profile.role} />
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Application List</h2>
          <div className="mt-4 space-y-3">
            {applications.length ? (
              applications.map((app) => (
                <article key={app.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">Application {app.id.slice(0, 8)}</p>
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
                      {app.status === 'submitted' ? 'View Application' : 'Continue Intake'}
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-500">No applications yet.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
