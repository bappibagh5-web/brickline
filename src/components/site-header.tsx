import Link from 'next/link';
import { logoutAction } from '@/app/actions';
import type { AppRole } from '@/lib/types';

type SiteHeaderProps = {
  email?: string;
  role?: AppRole;
};

const linksByRole: Record<AppRole, { href: string; label: string }[]> = {
  borrower: [{ href: '/borrower', label: 'Borrower Dashboard' }],
  broker: [{ href: '/broker', label: 'Broker Pipeline' }],
  admin: [{ href: '/admin', label: 'Admin Dashboard' }],
  lender: [{ href: '/lender', label: 'Lender View' }],
  super_admin: [
    { href: '/super-admin', label: 'Super Admin' },
    { href: '/admin', label: 'Admin Dashboard' }
  ]
};

export function SiteHeader({ email, role }: SiteHeaderProps) {
  const roleLinks = role ? linksByRole[role] : [];

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-brand-900">
          Brickline
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="text-slate-700 hover:text-brand-700">
            Dashboard
          </Link>
          {roleLinks.map((item) => (
            <Link key={item.href} href={item.href} className="text-slate-700 hover:text-brand-700">
              {item.label}
            </Link>
          ))}
          {role ? <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{role.replace('_', ' ')}</span> : null}
          {email ? (
            <form action={logoutAction}>
              <button type="submit" className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50">
                Sign Out
              </button>
            </form>
          ) : (
            <Link href="/auth/login" className="rounded-md bg-brand-700 px-3 py-1.5 text-white hover:bg-brand-900">
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
