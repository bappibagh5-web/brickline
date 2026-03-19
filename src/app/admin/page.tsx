import { redirect } from 'next/navigation';
import { AssignLenderForm } from '@/components/assign-lender-form';
import { NoteForm } from '@/components/note-form';
import { SiteHeader } from '@/components/site-header';
import { StatusBadge } from '@/components/status-badge';
import { StatusForm } from '@/components/status-form';
import { getCurrentUserAndProfile } from '@/lib/authz';
import type { ApplicationRecord, NoteRecord, UserProfile } from '@/lib/types';

export default async function AdminPage() {
  const { supabase, user, profile } = await getCurrentUserAndProfile();

  if (!user || !profile) {
    redirect('/auth/login');
  }

  if (!(profile.role === 'admin' || profile.role === 'super_admin')) {
    redirect('/dashboard');
  }

  const [{ data: applications }, { data: notes }, { data: lenders }] = await Promise.all([
    supabase.from('applications').select('*').order('created_at', { ascending: false }),
    supabase.from('notes').select('*').order('created_at', { ascending: false }),
    supabase.from('user_profiles').select('id,full_name,email').eq('role', 'lender'),
  ]);

  const appList = (applications as ApplicationRecord[] | null) || [];
  const noteList = (notes as NoteRecord[] | null) || [];
  const lenderList = (lenders as Pick<UserProfile, 'id' | 'full_name' | 'email'>[] | null) || [];

  const notesByApp = new Map<string, NoteRecord[]>();
  noteList.forEach((note) => {
    const existing = notesByApp.get(note.application_id) || [];
    existing.push(note);
    notesByApp.set(note.application_id, existing);
  });

  return (
    <main className="min-h-screen">
      <SiteHeader email={user.email} role={profile.role} />

      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-slate-600">Full cross-application view with status controls, internal notes, and lender assignment.</p>

        <div className="mt-6 space-y-4">
          {appList.length ? (
            appList.map((app) => {
              const appNotes = notesByApp.get(app.id) || [];

              return (
                <article key={app.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Application {app.id.slice(0, 8)}</h2>
                      <p className="text-xs text-slate-500">Borrower: {app.borrower_id}</p>
                      <p className="text-xs text-slate-500">Broker: {app.broker_id || 'Unassigned'}</p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>

                  <StatusForm applicationId={app.id} currentStatus={app.status} />
                  <AssignLenderForm applicationId={app.id} lenders={lenderList} />
                  <NoteForm applicationId={app.id} role={profile.role} />

                  <div className="mt-3 rounded-md border border-slate-100 bg-slate-50 p-3 text-xs">
                    <p className="font-medium text-slate-700">Notes</p>
                    {appNotes.length ? (
                      <ul className="mt-2 space-y-1 text-slate-600">
                        {appNotes.slice(0, 5).map((note) => (
                          <li key={note.id}>[{note.note_type}] {note.content}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-slate-500">No notes yet.</p>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">No applications yet.</div>
          )}
        </div>
      </section>
    </main>
  );
}
