export function SacredCandle() {
  return (
    <div aria-hidden="true" className="relative h-[154px] w-[138px] shrink-0">
      <div className="sacred-candle-aura absolute left-1/2 top-[34px] h-28 w-28 -translate-x-1/2 rounded-full bg-amber-300/25 blur-2xl" />
      <div className="absolute left-1/2 top-[41px] h-20 w-20 -translate-x-1/2 rounded-full border border-amber-200/20" />
      <div className="absolute left-1/2 top-[49px] h-14 w-14 -translate-x-1/2 rounded-full border border-amber-100/15" />

      <span className="sacred-candle-ember sacred-candle-ember-one" />
      <span className="sacred-candle-ember sacred-candle-ember-two" />
      <span className="sacred-candle-ember sacred-candle-ember-three" />

      <div className="sacred-candle-flame absolute left-1/2 top-0 z-20 h-[56px] w-[34px] -translate-x-1/2 origin-bottom rounded-[55%_45%_58%_42%/70%_60%_40%_30%] bg-gradient-to-t from-orange-600 via-amber-400 to-[#fff6c5] shadow-[0_0_22px_7px_rgba(251,191,36,0.5)]">
        <div className="absolute bottom-1 left-1/2 h-8 w-4 -translate-x-1/2 rounded-[50%_50%_55%_45%] bg-gradient-to-t from-orange-500 via-amber-100 to-white blur-[0.5px]" />
      </div>

      <div className="absolute left-1/2 top-[51px] z-20 h-4 w-1.5 -translate-x-1/2 rounded-full bg-[#27150f] shadow-[0_0_5px_rgba(0,0,0,0.45)]" />
      <div className="absolute bottom-[10px] left-1/2 h-[88px] w-[70px] -translate-x-1/2 overflow-visible rounded-t-[20px] rounded-b-[14px] border border-amber-100/80 bg-gradient-to-r from-[#d7a968] via-[#fff6d7] via-55% to-[#c88b45] shadow-[0_20px_34px_-15px_rgba(245,158,11,0.75)]">
        <div className="absolute inset-[3px] overflow-hidden rounded-t-[17px] rounded-b-[11px] bg-gradient-to-r from-[#e6bd7b] via-[#fffbe9] via-50% to-[#dca65c]">
          <div className="absolute inset-x-0 top-0 h-4 rounded-[50%] border-b border-amber-200/80 bg-[#fff9e5] shadow-[inset_0_-4px_8px_rgba(191,124,43,0.14)]" />
          <div className="absolute left-2 top-1 h-8 w-2 rounded-b-full bg-white/75 blur-[0.3px]" />
          <div className="absolute inset-y-4 left-4 w-2 bg-white/30 blur-sm" />
          <div className="absolute right-2 top-1 h-10 w-2 rounded-b-full bg-[#e7c186]/80" />
        </div>
        <div className="absolute -left-1 top-9 h-7 w-3 rounded-b-full bg-[#f4d49e] shadow-[1px_2px_2px_rgba(95,55,18,0.13)]" />
        <div className="absolute right-1 top-5 h-11 w-3 rounded-b-full bg-[#ffe8b8] shadow-[-1px_2px_2px_rgba(95,55,18,0.13)]" />
        <div className="absolute right-4 top-8 h-5 w-2 rounded-b-full bg-[#f3cd8f]" />
      </div>
      <div className="absolute bottom-1 left-1/2 h-4 w-24 -translate-x-1/2 rounded-[50%] bg-black/35 blur-md" />
      <div className="absolute bottom-2 left-1/2 h-2.5 w-[92px] -translate-x-1/2 rounded-[50%] border border-amber-200/25 bg-gradient-to-r from-[#55325e] via-[#a06b4c] to-[#55325e] shadow-[0_7px_15px_rgba(0,0,0,0.32)]" />
    </div>
  );
}
