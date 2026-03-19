import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { StatusBadge } from '@/components/status-badge';
import { getCurrentUserAndProfile } from '@/lib/authz';
import type { ApplicationRecord, DocumentRecord, NoteRecord } from '@/lib/types';

export default async function LenderPage() {
  const { supabase, user, profile } = await getCurrentUserAndProfile();

  if (!user || !profile) {
    redirect('/auth/login');
  }

  if (profile.role !== 'lender') {
    redirect('/dashboard');
  }

  const [{ data: applications }, { data: documents }, { data: notes }] = await Promise.all([
    supabase.from('applications').select('*').order('created_at', { ascending: false }),
    supabase.from('documents').select('*').order('created_at', { ascending: false }),
    supabase.from('notes').select('*').order('created_at', { ascending: false })
  ]);

  const appList = (applications as ApplicationRecord[] | null) || [];
  const documentList = (documents as DocumentRecord[] | null) || [];
  const noteList = (notes as NoteRecord[] | null) || [];

  const docsByApp = new Map<string, number>();
  documentList.forEach((doc) => {
    docsByApp.set(doc.application_id, (docsByApp.get(doc.application_id) || 0) + 1);
  });

  const notesByApp = new Map<string, number>();
  noteList.forEach((note) => {
    notesByApp.set(note.application_id, (notesByApp.get(note.application_id) || 0) + 1);
  });

  return (
    <main className="min-h-screen">
      <SiteHeader email={user.email} role={profile.role} />

      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Lender Review View</h1>
        <p className="mt-2 text-slate-600">Read-only access to applications assigned to your lender account.</p>

        <div className="mt-6 space-y-3">
          {appList.length ? (
            appList.map((app) => (
              <article key={app.id} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">Application {app.id.slice(0, 8)}</p>
                  <StatusBadge status={app.status} />
                </div>
                <p className="mt-2 text-xs text-slate-500">Documents: {docsByApp.get(app.id) || 0} | Borrower-visible notes: {notesByApp.get(app.id) || 0}</p>
              </article>
            ))
          ) : (
            <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">No assigned applications.</div>
          )}
        </div>
      </section>
    </main>
  );
}
