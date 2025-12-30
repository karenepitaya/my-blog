import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { createSlug } from './slug';
import type { TocItem } from '../interfaces/Article';

export const MARKDOWN_RENDERER_ID = 'expressive-code@0.41.5';

type RenderOptions = {
  themes?: string[];
};

type MarkdownRenderer = {
  render: (markdown: string) => Promise<string>;
};

const { window } = new JSDOM('<!doctype html><html><body></body></html>');
const purify = DOMPurify(window);
const rendererCache = new Map<string, Promise<MarkdownRenderer>>();
const fallbackThemes = ['github-dark', 'github-light'];

function normalizeThemes(options: RenderOptions): string[] {
  const themes = (options.themes ?? []).map(theme => String(theme).trim()).filter(Boolean);
  return themes.length > 0 ? themes : fallbackThemes;
}

function getRendererCacheKey(options: RenderOptions): string {
  return JSON.stringify({ themes: normalizeThemes(options) });
}

async function getMarkdownRenderer(options: RenderOptions): Promise<MarkdownRenderer> {
  const cacheKey = getRendererCacheKey(options);
  const cached = rendererCache.get(cacheKey);
  if (cached) return cached;

  const rendererPromise = (async () => {
    const [
      { unified },
      { default: remarkParse },
      { default: remarkGfm },
      { default: remarkMath },
      { default: remarkDirective },
      { default: remarkRehype },
      { default: rehypeRaw },
      { default: rehypeKatex },
      { default: rehypeStringify },
      { default: rehypeExpressiveCode },
      { pluginLineNumbers },
    ] = await Promise.all([
      import('unified'),
      import('remark-parse'),
      import('remark-gfm'),
      import('remark-math'),
      import('remark-directive'),
      import('remark-rehype'),
      import('rehype-raw'),
      import('rehype-katex'),
      import('rehype-stringify'),
      import('rehype-expressive-code'),
      import('@expressive-code/plugin-line-numbers'),
    ]);

    const themes = normalizeThemes(options);

    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      .use(remarkDirective)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeKatex)
      .use(rehypeExpressiveCode, {
        themes,
        useDarkModeMediaQuery: false,
        defaultProps: {
          showLineNumbers: false,
          wrap: false,
        },
        plugins: [pluginLineNumbers()],
      })
      .use(rehypeStringify);

    return {
      render: async (markdown: string) => {
        try {
          const file = await processor.process(markdown);
          return String(file);
        } catch (error) {
          const hasCustomThemes = normalizeThemes(options).join('|') !== fallbackThemes.join('|');
          if (!hasCustomThemes) throw error;
          console.warn('[markdown] expressive-code render failed, falling back to default themes.', error);
          const fallbackRenderer = await getMarkdownRenderer({ themes: fallbackThemes });
          return fallbackRenderer.render(markdown);
        }
      },
    };
  })();

  rendererCache.set(cacheKey, rendererPromise);
  return rendererPromise;
}

function sanitizeHtml(rawHtml: string): string {
  return purify.sanitize(rawHtml, {
    ALLOW_DATA_ATTR: true,
    ADD_TAGS: ['button', 'svg', 'path'],
    ADD_ATTR: [
      'class',
      'role',
      'aria-label',
      'aria-hidden',
      'title',
      'tabindex',
      'viewBox',
      'fill',
      'stroke',
      'stroke-width',
      'stroke-linecap',
      'stroke-linejoin',
      'd',
    ],
  }) as string;
}

export async function markdownToHtml(md: string, options: RenderOptions = {}): Promise<string> {
  const renderer = await getMarkdownRenderer(options);
  const rawHtml = await renderer.render(md);
  return sanitizeHtml(rawHtml);
}

/**
 * Render markdown into sanitized HTML, and ensure all headings have stable `id`s
 * so that the generated TOC can be used for anchor navigation.
 */
export async function renderMarkdownWithToc(
  markdown: string,
  options: RenderOptions = {}
): Promise<{ html: string; toc: TocItem[]; renderer: string }> {
  const sanitizedHtml = await markdownToHtml(markdown, options);
  const dom = new JSDOM(`<body>${sanitizedHtml}</body>`);
  const body = dom.window.document.body;

  const toc: TocItem[] = [];
  const usedIds = new Map<string, number>();

  const headings = body.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach((el, index) => {
    const level = Number(el.tagName.slice(1));
    const text = (el.textContent ?? '').trim();

    const base = createSlug(text) || `section-${index + 1}`;
    const nextCount = (usedIds.get(base) ?? 0) + 1;
    usedIds.set(base, nextCount);
    const id = nextCount === 1 ? base : `${base}-${nextCount}`;

    el.setAttribute('id', id);
    toc.push({ level, text, id });
  });

  return { html: body.innerHTML, toc, renderer: MARKDOWN_RENDERER_ID };
}
