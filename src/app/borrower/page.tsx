import { redirect } from 'next/navigation';
import { BorrowerIntakeForm } from '@/components/borrower-intake-form';
import { DocumentUploadForm } from '@/components/document-upload-form';
import { SiteHeader } from '@/components/site-header';
import { StatusBadge } from '@/components/status-badge';
import { getCurrentUserAndProfile } from '@/lib/authz';
import type { ApplicationRecord, DocumentRecord, NoteRecord } from '@/lib/types';

export default async function BorrowerPage() {
  const { supabase, user, profile } = await getCurrentUserAndProfile();

  if (!user || !profile) {
    redirect('/auth/login');
  }

  if (profile.role !== 'borrower') {
    redirect('/dashboard');
  }

  const [{ data: applications }, { data: documents }, { data: notes }] = await Promise.all([
    supabase.from('applications').select('*').order('created_at', { ascending: false }),
    supabase.from('documents').select('*').order('created_at', { ascending: false }),
    supabase.from('notes').select('*').order('created_at', { ascending: false })
  ]);

  const appList = (applications as ApplicationRecord[] | null) || [];
  const docsByApp = new Map<string, number>();
  ((documents as DocumentRecord[] | null) || []).forEach((doc) => {
    docsByApp.set(doc.application_id, (docsByApp.get(doc.application_id) || 0) + 1);
  });
  const notesByApp = new Map<string, number>();
  ((notes as NoteRecord[] | null) || []).forEach((note) => {
    notesByApp.set(note.application_id, (notesByApp.get(note.application_id) || 0) + 1);
  });

  const uploadOptions = appList.map((app) => ({
    id: app.id,
    label: `${app.id.slice(0, 8)} - ${new Date(app.created_at).toLocaleDateString()}`
  }));

  return (
    <main className="min-h-screen">
      <SiteHeader email={user.email} role={profile.role} />

      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Borrower Dashboard</h1>
        <p className="mt-2 text-slate-600">Access only your own applications, status, and borrower-visible notes.</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <BorrowerIntakeForm borrowerId={user.id} />
          <DocumentUploadForm applications={uploadOptions} />
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">My Applications</h2>
          <div className="mt-4 space-y-3">
            {appList.length ? (
              appList.map((app) => (
                <article key={app.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">Application {app.id.slice(0, 8)}</p>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Documents: {docsByApp.get(app.id) || 0} | Notes: {notesByApp.get(app.id) || 0}</p>
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
