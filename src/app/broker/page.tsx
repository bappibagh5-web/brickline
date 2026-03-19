import { redirect } from 'next/navigation';
import { BrokerCreateApplicationForm } from '@/components/broker-create-application-form';
import { DocumentUploadForm } from '@/components/document-upload-form';
import { NoteForm } from '@/components/note-form';
import { SiteHeader } from '@/components/site-header';
import { StatusBadge } from '@/components/status-badge';
import { getCurrentUserAndProfile } from '@/lib/authz';
import type { ApplicationRecord } from '@/lib/types';

export default async function BrokerPage() {
  const { supabase, user, profile } = await getCurrentUserAndProfile();

  if (!user || !profile) {
    redirect('/auth/login');
  }

  if (profile.role !== 'broker') {
    redirect('/dashboard');
  }

  const { data: applications } = await supabase.from('applications').select('*').order('created_at', { ascending: false });

  const appList = (applications as ApplicationRecord[] | null) || [];
  const uploadOptions = appList.map((app) => ({
    id: app.id,
    label: `${app.id.slice(0, 8)} - borrower ${app.borrower_id.slice(0, 8)}`
  }));

  return (
    <main className="min-h-screen">
      <SiteHeader email={user.email} role={profile.role} />

      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Broker Pipeline</h1>
        <p className="mt-2 text-slate-600">Manage applications you created or were assigned to. Internal notes are hidden by policy.</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <BrokerCreateApplicationForm />
          <DocumentUploadForm applications={uploadOptions} />
        </div>

        <div className="mt-8 space-y-4">
          {appList.length ? (
            appList.map((app) => (
              <article key={app.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">Application {app.id.slice(0, 8)}</p>
                    <p className="text-xs text-slate-500">Borrower: {app.borrower_id}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
                <NoteForm applicationId={app.id} role={profile.role} />
              </article>
            ))
          ) : (
            <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">No broker applications found.</div>
          )}
        </div>
      </section>
    </main>
  );
}
