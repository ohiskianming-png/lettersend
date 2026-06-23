import React from 'react';

interface BorderRendererProps {
  borderId: string | undefined;
}

export default function BorderRenderer({ borderId }: BorderRendererProps) {
  if (!borderId || borderId === 'default') {
    return (
      <div className="absolute inset-0 border border-ink/5 rounded-[40px] pointer-events-none z-10" />
    );
  }

  switch (borderId) {
    case 'vintage-gold':
      return (
        <>
          {/* Main frame border */}
          <div className="absolute inset-3 border border-amber-500/20 rounded-[34px] pointer-events-none z-10" />
          <div className="absolute inset-5 border-2 border-double border-amber-500/45 rounded-[30px] pointer-events-none z-10" />
          
          {/* Ornamental corner flourishes */}
          <div className="absolute top-7 left-7 w-6 h-6 border-b border-r border-amber-500/30 rounded-br-sm pointer-events-none z-10" />
          <div className="absolute top-7 right-7 w-6 h-6 border-b border-l border-amber-500/30 rounded-bl-sm pointer-events-none z-10" />
          <div className="absolute bottom-7 left-7 w-6 h-6 border-t border-r border-amber-500/30 rounded-tr-sm pointer-events-none z-10" />
          <div className="absolute bottom-7 right-7 w-6 h-6 border-t border-l border-amber-500/30 rounded-tl-sm pointer-events-none z-10" />

          {/* Miniature corner accent diamonds */}
          <div className="absolute top-5 left-5 w-2.5 h-2.5 rotate-45 border border-amber-500/60 bg-amber-500/10 pointer-events-none z-10" />
          <div className="absolute top-5 right-5 w-2.5 h-2.5 rotate-45 border border-amber-500/60 bg-amber-500/10 pointer-events-none z-10" />
          <div className="absolute bottom-5 left-5 w-2.5 h-2.5 rotate-45 border border-amber-500/60 bg-amber-500/10 pointer-events-none z-10" />
          <div className="absolute bottom-5 right-5 w-2.5 h-2.5 rotate-45 border border-amber-500/60 bg-amber-500/10 pointer-events-none z-10" />

          {/* Inner faint grid */}
          <div className="absolute inset-9 border border-amber-500/5 rounded-[22px] pointer-events-none z-10" />
        </>
      );

    case 'stitched':
      return (
        <>
          <div className="absolute inset-0 border border-ink/5 rounded-[40px] pointer-events-none z-10" />
          <div className="absolute inset-4 border border-dashed border-amber-800/15 rounded-[32px] pointer-events-none z-10" />
          <div className="absolute inset-5 border border-dashed border-amber-800/25 rounded-[30px] pointer-events-none z-10" />
          {/* Subtle leather-like corner lines */}
          <div className="absolute top-4 left-4 w-4 h-4 border-l border-t border-amber-900/10 pointer-events-none z-10" />
          <div className="absolute top-4 right-4 w-4 h-4 border-r border-t border-amber-900/10 pointer-events-none z-10" />
          <div className="absolute bottom-4 left-4 w-4 h-4 border-l border-b border-amber-900/10 pointer-events-none z-10" />
          <div className="absolute bottom-4 right-4 w-4 h-4 border-r border-b border-amber-900/10 pointer-events-none z-10" />
        </>
      );

    case 'royal-crimson':
      return (
        <>
          {/* Thick external velvet lining */}
          <div className="absolute inset-0 border-[14px] border-rose-950 rounded-[40px] pointer-events-none z-10 shadow-inner" />
          {/* Golden outline framing inside */}
          <div className="absolute inset-[10px] border border-amber-400/55 rounded-[32px] pointer-events-none z-10" />
          <div className="absolute inset-[14px] border-2 border-amber-500/35 rounded-[30px] pointer-events-none z-10" />
          <div className="absolute inset-[18px] border border-amber-400/15 rounded-[28px] pointer-events-none z-10" />
        </>
      );

    case 'botanical-ivy':
      return (
        <>
          {/* Main frame */}
          <div className="absolute inset-0 border border-emerald-800/5 rounded-[40px] pointer-events-none z-10" />
          <div className="absolute inset-4 border border-emerald-800/10 rounded-[32px] pointer-events-none z-10" />
          
          {/* Corner botanic graphics SVG */}
          <div className="absolute top-4 left-4 w-12 h-12 text-emerald-800/30 pointer-events-none z-10">
            <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full rotate-0">
              <path d="M2,18 C6,18 10,14 10,10 C10,6 6,2 2,2 C2,6 6,10 6,10 C6,10 10,6 14,2" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              <ellipse cx="6" cy="6" rx="2" ry="1.2" transform="rotate(-30 6 6)"/>
              <ellipse cx="14" cy="10" rx="1.5" ry="1" transform="rotate(20 14 10)"/>
            </svg>
          </div>
          <div className="absolute top-4 right-4 w-12 h-12 text-emerald-800/30 pointer-events-none z-10">
            <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full rotate-90">
              <path d="M2,18 C6,18 10,14 10,10 C10,6 6,2 2,2 C2,6 6,10 6,10 C6,10 10,6 14,2" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              <ellipse cx="6" cy="6" rx="2" ry="1.2" transform="rotate(-30 6 6)"/>
              <ellipse cx="14" cy="10" rx="1.5" ry="1" transform="rotate(20 14 10)"/>
            </svg>
          </div>
          <div className="absolute bottom-4 left-4 w-12 h-12 text-emerald-800/30 pointer-events-none z-10">
            <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full -rotate-90">
              <path d="M2,18 C6,18 10,14 10,10 C10,6 6,2 2,2 C2,6 6,10 6,10 C6,10 10,6 14,2" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              <ellipse cx="6" cy="6" rx="2" ry="1.2" transform="rotate(-30 6 6)"/>
              <ellipse cx="14" cy="10" rx="1.5" ry="1" transform="rotate(20 14 10)"/>
            </svg>
          </div>
          <div className="absolute bottom-4 right-4 w-12 h-12 text-emerald-800/30 pointer-events-none z-10">
            <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full rotate-180">
              <path d="M2,18 C6,18 10,14 10,10 C10,6 6,2 2,2 C2,6 6,10 6,10 C6,10 10,6 14,2" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              <ellipse cx="6" cy="6" rx="2" ry="1.2" transform="rotate(-30 6 6)"/>
              <ellipse cx="14" cy="10" rx="1.5" ry="1" transform="rotate(20 14 10)"/>
            </svg>
          </div>
        </>
      );

    default:
      return (
        <div className="absolute inset-0 border border-ink/5 rounded-[40px] pointer-events-none z-10" />
      );
  }
}
