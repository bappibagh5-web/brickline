export default function ProgressBar({ value }) {
  return (
    <div className="h-[6px] w-full overflow-hidden rounded bg-[#dbe4f5]">
      <div
        className="h-full rounded bg-gradient-to-r from-[#3a58e7] to-[#4f74ff]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
