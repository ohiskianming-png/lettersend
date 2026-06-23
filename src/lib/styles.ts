import React from 'react';

export interface PaperTemplate {
  id: string;
  name: string;
  description: string;
  previewBg: string;
  bgStyle: React.CSSProperties;
  textClass: string;
  titleClass: string;
  hrClass: string;
}

export interface BorderTemplate {
  id: string;
  name: string;
  description: string;
  previewBorder: string;
}

export const PAPER_TEMPLATES: PaperTemplate[] = [
  {
    id: 'default',
    name: 'Classic Ivory',
    description: 'Crisp ivory white with traditional letter format',
    previewBg: '#fdfbf7',
    bgStyle: { backgroundColor: '#fdfbf7' },
    textClass: 'text-ink/80',
    titleClass: 'text-sepia',
    hrClass: 'bg-ink/5'
  },
  {
    id: 'parchment',
    name: 'Vintage Parchment',
    description: 'Warm Aged parchment paper for old-world aesthetics',
    previewBg: '#f2e6cb',
    bgStyle: {
      backgroundColor: '#f5edd7',
      backgroundImage: `
        linear-gradient(to right, rgba(238, 226, 203, 0.4), rgba(245, 237, 219, 0.4)),
        radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.6), transparent),
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 100 100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.03' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.9 0 0 0 0 0.85 0 0 0 0 0.7 0 0 0 0.12 0'/%3E%3CfeBlend mode='multiply' in='SourceGraphic'/%3E%3C/filter%3E%3Crect width='100' height='100' fill='%23F4EBD0' filter='url(%23noise)' opacity='0.7'/%3E%3C/svg%3E")
      `,
      backgroundBlendMode: 'multiply, normal, normal'
    },
    textClass: 'text-amber-950/80 font-serif italic',
    titleClass: 'text-amber-900',
    hrClass: 'bg-amber-900/10'
  },
  {
    id: 'ruled',
    name: 'Ruled Notebook',
    description: 'Blue Horizontal lines with traditional red margin',
    previewBg: '#fcfcf9',
    bgStyle: {
      backgroundColor: '#fcfcf9',
      backgroundImage: `
        linear-gradient(rgba(31, 115, 230, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(239, 68, 68, 0.12) 1px, transparent 1px)
      `,
      backgroundSize: '100% 2rem, 100% 100%',
      backgroundPosition: '0 1rem, 4.5rem 0',
      backgroundRepeat: 'repeat, no-repeat'
    },
    textClass: 'text-neutral-800/90 font-serif leading-[2rem] pt-[0.2rem]',
    titleClass: 'text-blue-900 font-sans tracking-wide',
    hrClass: 'bg-red-400/20'
  },
  {
    id: 'blueprint',
    name: 'Blueprint Grid',
    description: 'Technical draft blueprint background',
    previewBg: '#1e3a8a',
    bgStyle: {
      backgroundColor: '#0f172a',
      backgroundImage: `
        linear-gradient(rgba(56, 189, 248, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(56, 189, 248, 0.1) 1px, transparent 1px)
      `,
      backgroundSize: '24px 24px',
      backgroundPosition: 'center center'
    },
    textClass: 'text-sky-300/90 font-mono tracking-tight',
    titleClass: 'text-sky-200 font-mono font-bold uppercase tracking-widest',
    hrClass: 'bg-sky-400/20'
  },
  {
    id: 'linen',
    name: 'Cream Linen',
    description: 'Fine crosswoven natural thread texture',
    previewBg: '#fbfaf7',
    bgStyle: {
      backgroundColor: '#fbfaf7',
      backgroundImage: `
        linear-gradient(90deg, rgba(139,120,95,0.03) 1px, transparent 1px),
        linear-gradient(rgba(139,120,95,0.03) 1px, transparent 1px)
      `,
      backgroundSize: '10px 10px'
    },
    textClass: 'text-stone-800/85',
    titleClass: 'text-stone-700 font-serif',
    hrClass: 'bg-stone-200'
  },
  {
    id: 'sakura',
    name: 'Sakura Blush',
    description: 'Soft pastel cherry blossom backing with botanics',
    previewBg: '#fef2f2',
    bgStyle: {
      backgroundColor: '#fff1f2',
      backgroundImage: `
        radial-gradient(circle at 10% 20%, rgba(251, 113, 133, 0.05), transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(251, 113, 133, 0.05), transparent 40%)
      `
    },
    textClass: 'text-rose-950/80 italic font-serif',
    titleClass: 'text-rose-700',
    hrClass: 'bg-rose-100'
  },
  {
    id: 'charcoal',
    name: 'Midnight Charcoal',
    description: 'Deep chalkboard with starry specks for gold/white ink',
    previewBg: '#1e1e1e',
    bgStyle: {
      backgroundColor: '#18181b',
      backgroundImage: `
        radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.03) 1px, transparent 0),
        linear-gradient(to bottom, rgba(24, 24, 27, 0.95), rgba(9, 9, 11, 0.99))
      `,
      backgroundSize: '16px 16px, 100% 100%'
    },
    textClass: 'text-zinc-200/90 font-serif italic tracking-wide',
    titleClass: 'text-amber-300 font-serif',
    hrClass: 'bg-zinc-800'
  }
];

export const BORDER_TEMPLATES: BorderTemplate[] = [
  {
    id: 'default',
    name: 'None',
    description: 'Original border styling',
    previewBorder: 'border border-neutral-200'
  },
  {
    id: 'vintage-gold',
    name: 'Vintage Gold Double',
    description: 'Luxurious dual gold-lined edges with decorated corners',
    previewBorder: 'border-4 border-double border-amber-500/50'
  },
  {
    id: 'stitched',
    name: 'Stitched Leather',
    description: 'Artisanal hand-stitched leather thread path',
    previewBorder: 'border-2 border-dashed border-sepia/40'
  },
  {
    id: 'royal-crimson',
    name: 'Royal Crimson',
    description: 'Thick luxurious deep crimson with golden accents',
    previewBorder: 'border-4 border-rose-900/80 ring-2 ring-amber-500/30 ring-inset'
  },
  {
    id: 'botanical-ivy',
    name: 'Flourish Botanicals',
    description: 'Dainty hand-drawn leaf vine illustrations',
    previewBorder: 'border border-emerald-800/20'
  }
];

export function getPaperStyle(id: string | undefined): PaperTemplate {
  return PAPER_TEMPLATES.find(p => p.id === id) || PAPER_TEMPLATES[0];
}

export function getBorderStyle(id: string | undefined): BorderTemplate {
  return BORDER_TEMPLATES.find(b => b.id === id) || BORDER_TEMPLATES[0];
}
