'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ROLE_HOME, getCurrentUserAndProfile, roleCanChangeStatus, roleCanManageUsers, roleCanWriteNotes } from '@/lib/authz';
import { createAdminClient } from '@/lib/supabase/admin';
import type { AppRole, ApplicationStatus, NoteType } from '@/lib/types';

export type ActionState = {
  error?: string;
  success?: string;
};

const DEFAULT_SIGNUP_ROLE: AppRole = 'borrower';

function safeRole(value: string): AppRole {
  const allowed: AppRole[] = ['borrower', 'broker', 'admin', 'lender', 'super_admin'];
  return (allowed.includes(value as AppRole) ? value : DEFAULT_SIGNUP_ROLE) as AppRole;
}

function safeStatus(value: string): ApplicationStatus {
  const allowed: ApplicationStatus[] = ['submitted', 'in_review', 'missing_items', 'completed'];
  return (allowed.includes(value as ApplicationStatus) ? value : 'submitted') as ApplicationStatus;
}

function safeNoteType(value: string): NoteType {
  return value === 'internal' ? 'internal' : 'borrower_visible';
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');

  const { supabase } = await getCurrentUserAndProfile();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect('/dashboard');
}

export async function signupAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const fullName = String(formData.get('full_name') || '').trim();
  const role = safeRole(String(formData.get('role') || DEFAULT_SIGNUP_ROLE));

  const { supabase } = await getCurrentUserAndProfile();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    const admin = createAdminClient();
    await admin.from('user_profiles').upsert({
      id: data.user.id,
      role,
      full_name: fullName || email,
      email
    });
  }

  return { success: 'Account created. Verify your email, then sign in.' };
}

export async function logoutAction() {
  const { supabase } = await getCurrentUserAndProfile();
  await supabase.auth.signOut();
  redirect('/auth/login');
}

export async function createApplicationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user, profile } = await getCurrentUserAndProfile();

  if (!user || !profile) {
    return { error: 'Please sign in first.' };
  }

  const borrowerId = String(formData.get('borrower_id') || user.id);
  const brokerIdInput = String(formData.get('broker_id') || '');

  if (profile.role === 'borrower' && borrowerId !== user.id) {
    return { error: 'Borrowers can only create their own applications.' };
  }

  const payload = {
    borrower_id: borrowerId,
    broker_id: brokerIdInput || (profile.role === 'broker' ? user.id : null),
    status: 'submitted' as ApplicationStatus,
    created_by: user.id,
    updated_by: user.id
  };

  const { error } = await supabase.from('applications').insert(payload);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/borrower');
  revalidatePath('/broker');
  revalidatePath('/admin');
  revalidatePath('/dashboard');

  return { success: 'Application created.' };
}

export async function uploadDocumentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await getCurrentUserAndProfile();

  if (!user) {
    return { error: 'Please sign in before uploading documents.' };
  }

  const applicationId = String(formData.get('application_id') || '');
  const documentType = String(formData.get('document_type') || 'general');
  const file = formData.get('file');

  if (!applicationId || !(file instanceof File)) {
    return { error: 'Select an application and file.' };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${user.id}/${applicationId}/${randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from('application-docs').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false
  });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { error: insertError } = await supabase.from('documents').insert({
    application_id: applicationId,
    uploaded_by: user.id,
    file_url: filePath,
    document_type: documentType,
    created_by: user.id,
    updated_by: user.id
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath('/borrower');
  revalidatePath('/broker');
  revalidatePath('/admin');
  revalidatePath('/lender');

  return { success: 'Document uploaded.' };
}

export async function updateApplicationStatusAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user, profile } = await getCurrentUserAndProfile();

  if (!user || !profile || !roleCanChangeStatus(profile.role)) {
    return { error: 'Not authorized.' };
  }

  const applicationId = String(formData.get('application_id') || '');
  const status = safeStatus(String(formData.get('status') || 'submitted'));

  const { error } = await supabase
    .from('applications')
    .update({ status, updated_by: user.id })
    .eq('id', applicationId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin');
  return { success: 'Status updated.' };
}

export async function addNoteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user, profile } = await getCurrentUserAndProfile();

  if (!user || !profile || !roleCanWriteNotes(profile.role)) {
    return { error: 'Not authorized to add notes.' };
  }

  const applicationId = String(formData.get('application_id') || '');
  const noteType = safeNoteType(String(formData.get('note_type') || 'borrower_visible'));
  const content = String(formData.get('content') || '').trim();

  if (!content) {
    return { error: 'Note content is required.' };
  }

  if (profile.role === 'broker' && noteType === 'internal') {
    return { error: 'Brokers cannot create internal notes.' };
  }

  const { error } = await supabase.from('notes').insert({
    application_id: applicationId,
    created_by: user.id,
    note_type: noteType,
    content
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/broker');
  revalidatePath('/admin');
  return { success: 'Note added.' };
}

export async function assignLenderAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user, profile } = await getCurrentUserAndProfile();

  if (!user || !profile || !(profile.role === 'admin' || profile.role === 'super_admin')) {
    return { error: 'Only admin roles can assign lenders.' };
  }

  const applicationId = String(formData.get('application_id') || '');
  const lenderId = String(formData.get('lender_id') || '');

  const { error } = await supabase.from('application_lenders').insert({
    application_id: applicationId,
    lender_id: lenderId,
    assigned_by: user.id
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/lender');
  return { success: 'Lender assigned.' };
}

export async function updateUserRoleAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, profile } = await getCurrentUserAndProfile();

  if (!profile || !roleCanManageUsers(profile.role)) {
    return { error: 'Only super admins can manage roles.' };
  }

  const profileId = String(formData.get('profile_id') || '');
  const role = safeRole(String(formData.get('role') || 'borrower'));

  const { error } = await supabase.from('user_profiles').update({ role }).eq('id', profileId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/super-admin');
  return { success: 'Role updated.' };
}

export async function routeToRoleHomeAction() {
  const { profile } = await getCurrentUserAndProfile();

  if (!profile) {
    redirect('/auth/login');
  }

  redirect(ROLE_HOME[profile.role]);
}
