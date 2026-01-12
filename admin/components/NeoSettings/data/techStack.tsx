import React from 'react';

export type SkillCategory =
  | 'System'
  | 'Hardware'
  | 'Software'
  | 'Language'
  | 'Frontend'
  | 'Backend'
  | 'Database';

type SvgIconComponent = React.FC<React.SVGProps<SVGSVGElement>>;

const LetterIcon =
  (letter: string): SvgIconComponent =>
  ({ children, ...props }) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" opacity="0.55" />
      <path d="M7 17V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.25" />
      <text
        x="12"
        y="14.2"
        textAnchor="middle"
        fontSize="9.5"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
        fill="currentColor"
      >
        {letter}
      </text>
      {children}
    </svg>
  );

const ReactAtomIcon: SvgIconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    <ellipse cx="12" cy="12" rx="8" ry="3.2" stroke="currentColor" strokeWidth="1.6" opacity="0.85" />
    <ellipse
      cx="12"
      cy="12"
      rx="8"
      ry="3.2"
      stroke="currentColor"
      strokeWidth="1.6"
      opacity="0.6"
      transform="rotate(60 12 12)"
    />
    <ellipse
      cx="12"
      cy="12"
      rx="8"
      ry="3.2"
      stroke="currentColor"
      strokeWidth="1.6"
      opacity="0.6"
      transform="rotate(-60 12 12)"
    />
  </svg>
);

export const SvgIcons = {
  Generic: LetterIcon('?'),
  React: ReactAtomIcon,
  TypeScript: LetterIcon('TS'),
  JavaScript: LetterIcon('JS'),
  Node: LetterIcon('N'),
  Rust: LetterIcon('Rs'),
  Docker: LetterIcon('Dk'),
  Linux: LetterIcon('Lx'),
  VSCode: LetterIcon('VS'),
  Git: LetterIcon('Git'),
  Nginx: LetterIcon('Ng'),
  Redis: LetterIcon('R'),
  MongoDB: LetterIcon('M'),
  Postgres: LetterIcon('PG'),
  MySQL: LetterIcon('My'),
  GraphQL: LetterIcon('GQL'),
  Vite: LetterIcon('V'),
  Tailwind: LetterIcon('TW'),
  Next: LetterIcon('Nx'),
  Astro: LetterIcon('As'),
  Bun: LetterIcon('Bn'),
  Deno: LetterIcon('Dn'),
} satisfies Record<string, SvgIconComponent>;

export type SkillIconKey = keyof typeof SvgIcons;

export type SkillDef = {
  icon: SkillIconKey;
  category: SkillCategory;
  url: string;
  color: string;
  bg: string;
  border: string;
};

const TONE_STYLES = {
  amber: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  blue: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  cyan: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  emerald: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  fuchsia: { color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30' },
  green: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  indigo: { color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  lime: { color: 'text-lime-400', bg: 'bg-lime-500/10', border: 'border-lime-500/30' },
  orange: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  pink: { color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
  purple: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  red: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  rose: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  sky: { color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  slate: { color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/25' },
  stone: { color: 'text-stone-300', bg: 'bg-stone-500/10', border: 'border-stone-500/25' },
  teal: { color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30' },
  yellow: { color: 'text-yellow-300', bg: 'bg-yellow-500/10', border: 'border-yellow-500/25' },
  zinc: { color: 'text-zinc-300', bg: 'bg-zinc-500/10', border: 'border-zinc-500/25' },
} as const;

type Tone = keyof typeof TONE_STYLES;

const makeDef = (partial: Pick<SkillDef, 'icon' | 'category' | 'url'> & { tone: Tone }): SkillDef => {
  const styles = TONE_STYLES[partial.tone];
  return {
    icon: partial.icon,
    category: partial.category,
    url: partial.url,
    color: styles.color,
    bg: styles.bg,
    border: styles.border,
  };
};

export const SKILL_LIBRARY: Record<string, SkillDef> = {
  React: makeDef({ icon: 'React', category: 'Frontend', url: 'https://react.dev', tone: 'cyan' }),
  TypeScript: makeDef({ icon: 'TypeScript', category: 'Language', url: 'https://www.typescriptlang.org', tone: 'blue' }),
  JavaScript: makeDef({ icon: 'JavaScript', category: 'Language', url: 'https://developer.mozilla.org/docs/Web/JavaScript', tone: 'yellow' }),
  Node: makeDef({ icon: 'Node', category: 'Backend', url: 'https://nodejs.org', tone: 'green' }),
  Rust: makeDef({ icon: 'Rust', category: 'Language', url: 'https://www.rust-lang.org', tone: 'orange' }),
  Docker: makeDef({ icon: 'Docker', category: 'Software', url: 'https://www.docker.com', tone: 'sky' }),
  Linux: makeDef({ icon: 'Linux', category: 'System', url: 'https://www.kernel.org', tone: 'slate' }),
  'VS Code': makeDef({ icon: 'VSCode', category: 'Software', url: 'https://code.visualstudio.com', tone: 'indigo' }),
  Git: makeDef({ icon: 'Git', category: 'Software', url: 'https://git-scm.com', tone: 'red' }),
  Vite: makeDef({ icon: 'Vite', category: 'Frontend', url: 'https://vite.dev', tone: 'purple' }),
  Tailwind: makeDef({ icon: 'Tailwind', category: 'Frontend', url: 'https://tailwindcss.com', tone: 'teal' }),
  Next: makeDef({ icon: 'Next', category: 'Frontend', url: 'https://nextjs.org', tone: 'stone' }),
  Astro: makeDef({ icon: 'Astro', category: 'Frontend', url: 'https://astro.build', tone: 'fuchsia' }),
  Bun: makeDef({ icon: 'Bun', category: 'Backend', url: 'https://bun.sh', tone: 'amber' }),
  Deno: makeDef({ icon: 'Deno', category: 'Backend', url: 'https://deno.com', tone: 'zinc' }),
  Nginx: makeDef({ icon: 'Nginx', category: 'Backend', url: 'https://nginx.org', tone: 'emerald' }),
  GraphQL: makeDef({ icon: 'GraphQL', category: 'Backend', url: 'https://graphql.org', tone: 'pink' }),
  Redis: makeDef({ icon: 'Redis', category: 'Database', url: 'https://redis.io', tone: 'rose' }),
  MongoDB: makeDef({ icon: 'MongoDB', category: 'Database', url: 'https://www.mongodb.com', tone: 'lime' }),
  Postgres: makeDef({ icon: 'Postgres', category: 'Database', url: 'https://www.postgresql.org', tone: 'blue' }),
  MySQL: makeDef({ icon: 'MySQL', category: 'Database', url: 'https://www.mysql.com', tone: 'sky' }),
};

export const DEFAULT_SKILLS = ['React', 'TypeScript', 'Node', 'MongoDB', 'Docker', 'Linux', 'VS Code'];
