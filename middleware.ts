import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { AppRole } from '@/lib/types';

type CookieWrite = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

const protectedPrefixes = ['/dashboard', '/borrower', '/broker', '/admin', '/lender', '/super-admin'];

const routeRoleRules: { prefix: string; allowed: AppRole[] }[] = [
  { prefix: '/borrower', allowed: ['borrower', 'admin', 'super_admin'] },
  { prefix: '/broker', allowed: ['broker', 'admin', 'super_admin'] },
  { prefix: '/admin', allowed: ['admin', 'super_admin'] },
  { prefix: '/lender', allowed: ['lender', 'admin', 'super_admin'] },
  { prefix: '/super-admin', allowed: ['super_admin'] }
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieWrite[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as never)
          );
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith('/auth');
  const isProtectedRoute = protectedPrefixes.some((prefix) => path.startsWith(prefix));

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!user) {
    return response;
  }

  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).maybeSingle();
  const role = profile?.role as AppRole | undefined;

  if (!role && isProtectedRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  const rule = routeRoleRules.find((entry) => path.startsWith(entry.prefix));

  if (rule && role && !rule.allowed.includes(role)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
