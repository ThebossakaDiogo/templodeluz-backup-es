export function SacredCandle() {
  return (
    <div aria-hidden="true" className="relative h-[132px] w-[112px] shrink-0">
      <div className="sacred-candle-aura absolute left-1/2 top-[42px] h-24 w-24 -translate-x-1/2 rounded-full bg-amber-300/20 blur-2xl" />
      <div className="absolute left-1/2 top-[50px] h-16 w-16 -translate-x-1/2 rounded-full border border-amber-300/20" />

      <span className="sacred-candle-ember sacred-candle-ember-one" />
      <span className="sacred-candle-ember sacred-candle-ember-two" />
      <span className="sacred-candle-ember sacred-candle-ember-three" />

      <div className="sacred-candle-flame absolute left-1/2 top-2 h-[45px] w-[28px] -translate-x-1/2 origin-bottom rounded-[55%_45%_58%_42%/70%_60%_40%_30%] bg-gradient-to-t from-orange-500 via-amber-300 to-amber-50 shadow-[0_0_18px_5px_rgba(251,191,36,0.42)]">
        <div className="absolute bottom-1 left-1/2 h-6 w-3 -translate-x-1/2 rounded-full bg-gradient-to-t from-orange-600 to-white/90 blur-[0.5px]" />
      </div>

      <div className="absolute left-1/2 top-[48px] h-3 w-1 -translate-x-1/2 rounded-full bg-[#2f1b14]" />
      <div className="absolute bottom-2 left-1/2 h-[76px] w-[54px] -translate-x-1/2 overflow-hidden rounded-t-[16px] rounded-b-[10px] border border-amber-100/70 bg-gradient-to-r from-[#f6ddb0] via-[#fff8df] to-[#e9c88d] shadow-[0_15px_28px_-14px_rgba(245,158,11,0.62)]">
        <div className="absolute inset-x-0 top-0 h-3 rounded-[50%] bg-[#fff9e8] shadow-sm" />
        <div className="absolute right-2 top-1 h-6 w-2 rounded-b-full bg-[#f4dfb8]" />
        <div className="absolute left-2 top-0 h-4 w-1.5 rounded-b-full bg-white/75" />
        <div className="absolute inset-y-3 left-3 w-2 bg-white/25 blur-sm" />
      </div>
      <div className="absolute bottom-0 left-1/2 h-3 w-20 -translate-x-1/2 rounded-[50%] bg-black/30 blur-sm" />
    </div>
  );
}
