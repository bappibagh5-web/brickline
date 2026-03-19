import { redirect } from 'next/navigation';
import { ApplicationDocuments } from '@/components/application-documents';
import { MultiStepIntakeForm } from '@/components/multi-step-intake-form';
import { SiteHeader } from '@/components/site-header';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserAndProfile } from '@/lib/authz';
import type { ApplicationRecord, DocumentRecord, UserProfile } from '@/lib/types';

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

  const canEditIntake =
    profile.role === 'admin' ||
    profile.role === 'super_admin' ||
    (profile.role === 'broker' && app.broker_id === user.id) ||
    (profile.role === 'borrower' && app.borrower_id === user.id && app.status === 'draft' && !app.borrower_locked);

  const canUploadDocuments =
    profile.role === 'admin' ||
    profile.role === 'super_admin' ||
    (profile.role === 'broker' && app.broker_id === user.id) ||
    (profile.role === 'borrower' && app.borrower_id === user.id);

  const parsedStep = Number(step || app.progress_step || 1);

  const { data: docs } = await supabase
    .from('documents')
    .select('*')
    .eq('application_id', id)
    .order('created_at', { ascending: false });

  const documents = (docs as DocumentRecord[] | null) || [];
  const paths = documents.map((doc) => doc.file_url);

  let signedByPath = new Map<string, string>();
  if (paths.length) {
    const { data: signedRows } = await supabase.storage.from('documents').createSignedUrls(paths, 3600);
    signedRows?.forEach((row, index) => {
      if (row.signedUrl) {
        signedByPath.set(paths[index], row.signedUrl);
      }
    });
  }

  const uploaderIds = Array.from(new Set(documents.map((doc) => doc.uploaded_by)));
  const admin = createAdminClient();
  const { data: uploaders } = uploaderIds.length
    ? await admin.from('user_profiles').select('id,full_name').in('id', uploaderIds)
    : { data: [] as Pick<UserProfile, 'id' | 'full_name'>[] };

  const uploaderMap = new Map<string, string>();
  ((uploaders as Pick<UserProfile, 'id' | 'full_name'>[] | null) || []).forEach((item) => {
    uploaderMap.set(item.id, item.full_name);
  });

  const documentsForUI = documents.map((doc) => ({
    ...doc,
    uploaded_by_name: uploaderMap.get(doc.uploaded_by) || doc.uploaded_by,
    download_url: signedByPath.get(doc.file_url) || null
  }));

  return (
    <main className="min-h-screen">
      <SiteHeader email={user.email} role={profile.role} />

      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Loan Application Intake</h1>
        <p className="mt-2 text-slate-600">Complete borrower intake and manage required documents for underwriting.</p>

        <div className="mt-6">
          <MultiStepIntakeForm application={app} role={profile.role} canEdit={canEditIntake} initialStep={parsedStep} />
        </div>

        <ApplicationDocuments
          applicationId={id}
          loanType={app.loan_type}
          role={profile.role}
          canUpload={canUploadDocuments}
          canAdminManage={profile.role === 'admin' || profile.role === 'super_admin'}
          initialDocuments={documentsForUI}
        />
      </section>
    </main>
  );
}
