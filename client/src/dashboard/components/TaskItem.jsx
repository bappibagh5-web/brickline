import { FileText } from 'lucide-react';

export default function TaskItem({ task, showAction = true }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-[#eceef5] px-4 py-4 first:border-t-0">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg border border-[#ccdaf8] bg-[#edf4ff] p-2 text-[#4f6fe3]">
          <FileText size={14} />
        </div>
        <div>
          <h4 className="text-[17px] font-semibold text-[#283153]">{task.title}</h4>
          <p className="mt-0.5 text-[13px] text-[#6f7899]">{task.loanMeta}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="rounded-lg bg-[#eef0f4] px-2.5 py-1 text-[12px] font-semibold text-[#4c5575]">
              {task.taskType}
            </span>
            <span className="text-[13px] text-[#687394]">Due: {task.dueLabel}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <span className="text-[14px] text-[#5b668a]">{task.dueLabel}</span>
        {showAction ? (
          <button className="topbar-btn !h-9 !rounded-md !px-5 !py-0 text-sm">{task.cta}</button>
        ) : (
          <span className="h-2.5 w-24 rounded-full bg-[#f2f4fa]" />
        )}
      </div>
    </div>
  );
}
