import { NextResponse } from 'next/server';
import { getCurrentUserAndProfile } from '@/lib/authz';

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { supabase, user, profile } = await getCurrentUserAndProfile();

  if (!user || !profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!(profile.role === 'admin' || profile.role === 'super_admin')) {
    return NextResponse.json({ error: 'Only admins can delete documents.' }, { status: 403 });
  }

  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .select('id,file_url')
    .eq('id', id)
    .single();

  if (docErr || !doc) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  }

  const { error: storageError } = await supabase.storage.from('documents').remove([doc.file_url]);
  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 400 });
  }

  const { error: deleteError } = await supabase.from('documents').delete().eq('id', id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
