import { NextResponse } from 'next/server';
import { getCurrentUserAndProfile } from '@/lib/authz';
import { createAdminClient } from '@/lib/supabase/admin';
import type { DocumentStatus, DocumentType } from '@/lib/types';

const allowedTypes = new Set<DocumentType>(['id_doc', 'bank_statement', 'purchase_contract', 'rent_roll', 'rehab_budget', 'other']);

function canUpload(role: string, userId: string, app: { borrower_id: string; broker_id: string | null }) {
  if (role === 'admin' || role === 'super_admin') return true;
  if (role === 'borrower' && app.borrower_id === userId) return true;
  if (role === 'broker' && app.broker_id === userId) return true;
  return false;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: applicationId } = await context.params;
  const { supabase, user, profile } = await getCurrentUserAndProfile();

  if (!user || !profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const fileUrl = String(body.file_url || '').trim();
  const fileName = String(body.file_name || '').trim();
  const documentType = String(body.document_type || '').trim() as DocumentType;

  if (!fileUrl || !fileName || !documentType) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  if (!allowedTypes.has(documentType)) {
    return NextResponse.json({ error: 'Invalid document type.' }, { status: 400 });
  }

  const { data: application, error: appError } = await supabase
    .from('applications')
    .select('id,borrower_id,broker_id')
    .eq('id', applicationId)
    .single();

  if (appError || !application) {
    return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
  }

  if (!canUpload(profile.role, user.id, application)) {
    return NextResponse.json({ error: 'Not allowed to upload for this application.' }, { status: 403 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from('documents')
    .insert({
      application_id: applicationId,
      uploaded_by: user.id,
      file_url: fileUrl,
      file_name: fileName,
      document_type: documentType,
      status: 'uploaded' as DocumentStatus,
      created_by: user.id,
      updated_by: user.id
    })
    .select('*')
    .single();

  if (insertError || !inserted) {
    return NextResponse.json({ error: insertError?.message || 'Could not save document record.' }, { status: 400 });
  }

  const { data: signed } = await supabase.storage.from('documents').createSignedUrl(fileUrl, 3600);

  const admin = createAdminClient();
  const { data: uploader } = await admin.from('user_profiles').select('full_name').eq('id', user.id).maybeSingle();

  return NextResponse.json({
    document: {
      ...inserted,
      uploaded_by_name: uploader?.full_name || user.email,
      download_url: signed?.signedUrl || null
    }
  });
}
