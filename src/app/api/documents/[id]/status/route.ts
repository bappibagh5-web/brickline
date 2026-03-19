import { NextResponse } from 'next/server';
import { getCurrentUserAndProfile } from '@/lib/authz';
import type { DocumentStatus } from '@/lib/types';

const statuses = new Set<DocumentStatus>(['uploaded', 'under_review', 'accepted', 'rejected']);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { supabase, user, profile } = await getCurrentUserAndProfile();

  if (!user || !profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!(profile.role === 'admin' || profile.role === 'super_admin')) {
    return NextResponse.json({ error: 'Only admins can update document status.' }, { status: 403 });
  }

  const body = await request.json();
  const status = String(body.status || '') as DocumentStatus;

  if (!statuses.has(status)) {
    return NextResponse.json({ error: 'Invalid status value.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('documents')
    .update({ status, updated_by: user.id })
    .eq('id', id)
    .select('id,status')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Unable to update status.' }, { status: 400 });
  }

  return NextResponse.json({ document: data });
}
