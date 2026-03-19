import { createClient } from '@/lib/supabase/server';
import type { AppRole, UserProfile } from '@/lib/types';

export const ROLE_HOME: Record<AppRole, string> = {
  borrower: '/borrower',
  broker: '/broker',
  admin: '/admin',
  lender: '/lender',
  super_admin: '/super-admin'
};

export function roleCanWriteNotes(role: AppRole) {
  return role === 'broker' || role === 'admin' || role === 'super_admin';
}

export function roleCanChangeStatus(role: AppRole) {
  return role === 'admin' || role === 'super_admin';
}

export function roleCanManageUsers(role: AppRole) {
  return role === 'super_admin';
}

export async function getCurrentUserAndProfile() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabase, user: null, profile: null as UserProfile | null };
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    profile: (profile as UserProfile | null) ?? null
  };
}
