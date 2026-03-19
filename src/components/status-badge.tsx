import type { ApplicationStatus } from '@/lib/types';

const styles: Record<ApplicationStatus, string> = {
  draft: 'bg-slate-100 text-slate-800',
  submitted: 'bg-sky-100 text-sky-800',
  in_review: 'bg-amber-100 text-amber-800',
  missing_items: 'bg-rose-100 text-rose-800',
  completed: 'bg-emerald-100 text-emerald-800'
};

type StatusBadgeProps = {
  status: ApplicationStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
