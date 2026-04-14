import { ChevronLeft, CheckCircle2, Phone } from 'lucide-react';
import { BRAND_LOGOS } from '../lib/brandAssets.js';

function RightPanel() {
  return (
    <aside className="relative h-[280px] w-full overflow-hidden rounded-b-[20px] bg-[radial-gradient(circle_at_20%_10%,#1e48ff_0%,#071564_48%,#030a36_100%)] lg:sticky lg:top-0 lg:h-full lg:w-[40%] lg:min-w-[340px] lg:rounded-b-none lg:rounded-r-[20px]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:36px_36px]" />

      <div className="relative z-10 flex h-full flex-col px-5 py-4 lg:px-7 lg:py-6">
        <p className="ml-auto inline-flex items-center gap-2 text-sm font-medium text-white/90">
          <Phone className="h-4 w-4" />
          Need help? 1-844-415-4663
        </p>

        <div className="relative mt-2 flex flex-1 items-center justify-center lg:mt-8">
          <div className="h-[170px] w-[270px] rounded-[20px] border border-[#3259ff]/40 bg-[radial-gradient(circle_at_50%_45%,rgba(73,147,255,0.35),rgba(4,18,89,0.2)_55%,transparent_75%)] p-4 shadow-[0_0_45px_rgba(33,104,255,0.38)] lg:h-[250px] lg:w-[390px] lg:p-6">
            <div className="h-full w-full rounded-[20px] border border-[#3f67ff]/40 bg-[radial-gradient(circle,rgba(72,124,255,0.8)_1.3px,transparent_1.4px)] [background-size:16px_16px]" />
          </div>

          <div className="absolute bottom-2 left-1/2 w-[300px] -translate-x-1/2 rounded-xl border border-white/20 bg-[#0f2d9f]/45 px-4 py-3 backdrop-blur-md lg:bottom-6 lg:w-[360px] lg:px-6 lg:py-4">
            <span className="inline-block rounded-full bg-[#2f5cf3] px-3 py-1 text-[10px] font-semibold tracking-wide text-white lg:text-[11px]">
              NATIONWIDE INVESTOR LENDING
            </span>
            <div className="mt-2 flex items-center justify-between gap-3 lg:mt-3 lg:gap-4">
              <div>
                <p className="text-3xl font-extrabold tracking-tight text-white lg:text-[38px]">$2.3B+</p>
                <p className="text-[10px] tracking-[0.14em] text-white/65 lg:text-xs">FUNDED</p>
              </div>
              <div className="h-10 w-px bg-white/25 lg:h-12" />
              <p className="text-base font-medium leading-snug text-white/90 lg:text-[26px]">
                Built for speed,
                <br />
                not banks
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function OnboardingLayout({
  children,
  onBack,
  disableBack,
  stepNumber
}) {
  return (
    <div className="min-h-screen bg-[#eef2f8] p-3 lg:p-5">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_20px_65px_rgba(15,35,95,0.12)] lg:h-[calc(100vh-40px)] lg:flex-row">
        <section className="flex w-full flex-col bg-white lg:w-[60%]">
          <div className="px-4 pb-3 pt-4 lg:px-8 lg:pb-4 lg:pt-6">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center">
              <button
                type="button"
                onClick={onBack}
                disabled={disableBack}
                className="inline-flex w-fit items-center gap-2 text-sm font-medium text-[#4b5a88] hover:text-[#2f54eb] disabled:opacity-45"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              <img
                src={BRAND_LOGOS.mainBlue}
                alt="Brickline"
                className="h-7 w-auto justify-self-center"
              />

              <div />
            </div>

            <div className="mt-4 inline-flex items-center overflow-hidden rounded-full bg-[#dbe4f7]">
              <span className="rounded-full bg-[#2f54eb] px-4 py-1.5 text-xs font-semibold text-white">
                Step {stepNumber} of 6
              </span>
              <span className="px-4 py-1.5 text-xs font-medium text-[#6676a1]">Loan Type</span>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 lg:px-8 lg:pb-6">
            <div className="mx-auto w-full max-w-[720px] flex-1">
              {children}
            </div>

            <div className="mx-auto mt-4 flex w-full max-w-[720px] flex-wrap items-center gap-x-6 gap-y-2 pb-1 text-xs font-medium text-[#5d6c91] lg:text-sm">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 fill-[#2f54eb] text-white" />
                No upfront fees
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 fill-[#2f54eb] text-white" />
                Fast closings
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 fill-[#2f54eb] text-white" />
                Investor-focused
              </span>
            </div>
          </div>
        </section>

        <RightPanel />
      </div>
    </div>
  );
}
