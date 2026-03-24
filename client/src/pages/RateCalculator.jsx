import { Link } from 'react-router-dom';

export default function RateCalculator() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f6fc] px-4">
      <div className="panel w-full max-w-xl p-8 text-center">
        <h1 className="text-3xl font-bold text-[#1f2747]">Rate Calculator</h1>
        <p className="mt-3 text-sm text-[#60709a]">
          Your funnel is complete. This is the next destination for pricing and scenarios.
        </p>
        <Link
          to="/dashboard"
          className="topbar-btn mx-auto mt-6 inline-flex justify-center"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
