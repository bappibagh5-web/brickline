import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { ROLE_HOME, getCurrentUserAndProfile } from '@/lib/authz';

export default async function Home() {
  const { user, profile } = await getCurrentUserAndProfile();
  const ctaHref = profile ? ROLE_HOME[profile.role] : '/auth/login';

  return (
    <main className="min-h-screen">
      <SiteHeader email={user?.email} role={profile?.role} />
      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-700">REI Lending Platform</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold text-slate-900">Role-based lending operations with least-privilege access control.</h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Brickline uses Supabase Auth + RLS to isolate borrower, broker, lender, admin, and super-admin access across
          applications, documents, notes, and audit trails.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={ctaHref} className="rounded-md bg-brand-700 px-5 py-3 text-sm font-medium text-white hover:bg-brand-900">
            Open Role Dashboard
          </Link>
          <Link href="/auth/login" className="rounded-md border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-white">
            Sign In / Sign Up
          </Link>
        </div>
      </section>
    </main>
  );
}
