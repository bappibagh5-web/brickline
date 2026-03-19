import { redirect } from 'next/navigation';
import { MultiStepIntakeForm } from '@/components/multi-step-intake-form';
import { SiteHeader } from '@/components/site-header';
import { getCurrentUserAndProfile } from '@/lib/authz';
import type { ApplicationRecord } from '@/lib/types';

type IntakePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
};

export default async function IntakePage({ params, searchParams }: IntakePageProps) {
  const { id } = await params;
  const { step } = await searchParams;
  const { supabase, user, profile } = await getCurrentUserAndProfile();

  if (!user || !profile) {
    redirect('/auth/login');
  }

  const { data: application, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !application) {
    redirect('/dashboard');
  }

  const app = application as ApplicationRecord;

  const canEdit =
    profile.role === 'admin' ||
    profile.role === 'super_admin' ||
    (profile.role === 'broker' && app.broker_id === user.id) ||
    (profile.role === 'borrower' && app.borrower_id === user.id && app.status === 'draft' && !app.borrower_locked);

  const parsedStep = Number(step || app.progress_step || 1);

  return (
    <main className="min-h-screen">
      <SiteHeader email={user.email} role={profile.role} />

      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Loan Application Intake</h1>
        <p className="mt-2 text-slate-600">
          Complete the borrower intake workflow. Progress is saved at each step so you can return later.
        </p>

        <div className="mt-6">
          <MultiStepIntakeForm application={app} role={profile.role} canEdit={canEdit} initialStep={parsedStep} />
        </div>

        <div className="mt-6 rounded-md border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
          Document preparation hook: this application is ready to link to `documents` in the next phase.
        </div>
      </section>
    </main>
  );
}
