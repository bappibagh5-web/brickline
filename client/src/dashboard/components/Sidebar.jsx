import {
  CircleHelp,
  FileText,
  FolderOpen,
  GraduationCap,
  House,
  ListChecks,
  MessageSquare,
  PanelLeftClose
} from 'lucide-react';

const iconMap = {
  home: House,
  'loan-requests': FileText,
  documents: FolderOpen,
  messages: MessageSquare,
  tasks: ListChecks,
  resources: GraduationCap
};

export default function Sidebar({ items, activeKey, onSelect, onGoResources }) {
  return (
    <aside className="brickline-sidebar relative flex h-screen w-[260px] shrink-0 flex-col text-white">
      <div className="flex h-16 items-center gap-3 border-b border-white/15 px-6">
        <PanelLeftClose size={28} />
        <span className="text-3xl font-bold tracking-tight">Brickline</span>
      </div>

      <nav className="px-3 pt-4">
        {items.map((item) => {
          const Icon = iconMap[item.key] || House;
          const active = activeKey === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className={`relative mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-all duration-150 ${
                active ? 'bg-white/10' : 'hover:bg-white/10'
              }`}
            >
              <span
                className={`absolute left-0 h-10 w-1 rounded-r ${
                  active ? 'bg-white' : 'bg-transparent'
                }`}
              />
              <Icon size={23} />
              <span>{item.label}</span>
              {item.badge ? (
                <span className="ml-auto rounded-full bg-[#f15c58] px-2 py-[2px] text-[11px] font-bold">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 border-t border-white/20 px-3 py-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-all duration-150 hover:bg-white/10">
          <CircleHelp size={22} />
          Help & Feedback
        </button>
      </div>
    </aside>
  );
}
