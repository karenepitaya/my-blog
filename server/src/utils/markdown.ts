import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { createSlug } from './slug';
import type { TocItem } from '../interfaces/Article';

// Keep marked in sync mode to avoid unexpected async behavior.
marked.setOptions({ async: false });

const { window } = new JSDOM('<!doctype html><html><body></body></html>');
const purify = DOMPurify(window);

export function markdownToHtml(md: string): string {
  const rawHtml = marked.parse(md) as string;
  return purify.sanitize(rawHtml) as string;
}

/**
 * Render markdown into sanitized HTML, and ensure all headings have stable `id`s
 * so that the generated TOC can be used for anchor navigation.
 */
export function renderMarkdownWithToc(markdown: string): { html: string; toc: TocItem[] } {
  const sanitizedHtml = markdownToHtml(markdown);
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

  return { html: body.innerHTML, toc };
}

