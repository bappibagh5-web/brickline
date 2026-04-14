export default function StepLayout({
  title,
  subtitle,
  content,
  footer
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="max-w-[720px]">
        <h1 className="text-[clamp(34px,3.1vw,48px)] font-bold leading-tight tracking-[-0.02em] text-[#0b1f57]">
          {title}
        </h1>
        {subtitle ? <p className="mt-2 text-base leading-tight text-[#6b7694]">{subtitle}</p> : null}
      </div>

      <div className="mt-5 w-full max-w-[720px]">{content}</div>
      {footer ? <div className="mt-4 w-full max-w-[720px]">{footer}</div> : null}
    </div>
  );
}
