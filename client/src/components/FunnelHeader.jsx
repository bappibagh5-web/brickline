import { BRAND_LOGOS } from '../lib/brandAssets.js';

export default function FunnelHeader({ rightText = 'Questions? 1-844-415-4663' }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[#d6d9db] bg-white px-5 md:px-6">
      <img
        src={BRAND_LOGOS.mainBlue}
        alt="Brickline"
        className="h-8 w-auto object-contain"
      />
      <p className="text-xs text-[#4b5563]">{rightText}</p>
    </header>
  );
}

