import { AuthForm } from '@/components/auth-form';

export default function LoginPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Brickline Access</h1>
      <p className="mt-2 text-slate-600">Sign in to manage your real estate lending workflow.</p>

      <div className="mt-8">
        <AuthForm />
      </div>
    </main>
  );
}
