import { redirect } from 'next/navigation';
import { ROLE_HOME, getCurrentUserAndProfile } from '@/lib/authz';

export default async function DashboardPage() {
  const { profile } = await getCurrentUserAndProfile();

  if (!profile) {
    redirect('/auth/login');
  }

  redirect(ROLE_HOME[profile.role]);
}
