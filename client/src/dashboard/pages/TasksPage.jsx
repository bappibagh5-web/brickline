import { CheckCheck, Clock3, ListTodo } from 'lucide-react';
import Card from '../components/Card.jsx';
import TaskItem from '../components/TaskItem.jsx';

function SummaryCard({ icon: Icon, title, value, tint }) {
  return (
    <Card className={`flex items-center gap-3 p-4 ${tint}`}>
      <div className="rounded-lg bg-white/70 p-2.5">
        <Icon size={18} className="text-[#4f61a2]" />
      </div>
      <div>
        <p className="text-[18px] font-semibold text-[#2e385d]">{title}</p>
        <p className="text-[40px] leading-none font-bold text-[#1f2747]">{value}</p>
      </div>
    </Card>
  );
}

function EmptyTasks() {
  return (
    <Card className="min-h-[460px] p-8">
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="h-36 w-56 rounded-[24px] bg-[#eaf2ff]" />
        <h3 className="mt-6 text-[34px] font-bold text-[#1f2747]">No tasks right now</h3>
        <p className="mt-3 max-w-3xl text-[16px] leading-relaxed text-[#5e688c]">
          You are all caught up. When a document, form section, signature, or next step needs your
          attention, it will show up here.
        </p>
        <button className="topbar-btn mt-6 !rounded-lg !px-6 !py-2">View Loan Requests</button>
      </div>
    </Card>
  );
}

function FilledTasks({ tasks }) {
  const attention = tasks.filter((task) => task.section === 'attention');
  const comingUp = tasks.filter((task) => task.section === 'coming-up');

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#e7ebf4] px-4 py-3">
          <h3 className="text-[20px] font-bold text-[#1f2747]">Needs Attention</h3>
          <p className="text-[14px] text-[#7a84a5]">{attention.length}/5 items</p>
        </div>
        {attention.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#e7ebf4] px-4 py-3">
          <h3 className="text-[20px] font-bold text-[#1f2747]">Coming Up</h3>
          <p className="text-[14px] text-[#7a84a5]">{comingUp.length} items</p>
        </div>
        {comingUp.map((task) => (
          <TaskItem key={task.id} task={task} showAction={false} />
        ))}
      </Card>
    </div>
  );
}

export default function TasksPage({ tasks }) {
  const openCount = tasks.filter((task) => task.section === 'attention').length;
  const dueSoonCount = 2;
  const completeCount = 7;

  return (
    <section>
      <div className="mb-4">
        <h1 className="section-title">Tasks</h1>
      </div>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <SummaryCard icon={ListTodo} title="Open" value={openCount} tint="bg-[#eef4ff]" />
        <SummaryCard icon={Clock3} title="Due Soon" value={dueSoonCount} tint="bg-[#faf7ed]" />
        <SummaryCard icon={CheckCheck} title="Completed" value={completeCount} tint="bg-[#eefaf4]" />
      </div>

      <FilledTasks tasks={tasks} />
    </section>
  );
}
