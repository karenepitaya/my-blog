import React, { useEffect, useMemo, useState } from 'react';
import {
  FONT_CSS_EN,
  FONT_CSS_ZH,
  resolveFontOrigin,
  ZH_FONT_FAMILY,
} from '../styles/fonts';

type FontSnapshot = {
  zhTitleFamily: string;
  zhTitleWeight: string;
  zhBodyFamily: string;
  zhBodyWeight: string;
  enTitleFamily: string;
  enTitleWeight: string;
  enBodyFamily: string;
  enBodyWeight: string;
  zhLoaded700: boolean | null;
  zhLoaded400: boolean | null;
  enLoaded700: boolean | null;
  enLoaded400: boolean | null;
  htmlLang: string;
  injectedStylesheetHref: string | null;
  injectedPreloadHref: string | null;
  injectedPreconnectHref: string | null;
  wrapperStylePresent: boolean;
  wrapperStyleHasAbsoluteUrl: boolean;
};

type FontAuditBadNode = {
  path: string;
  text: string;
  fontFamily: string;
  className: string;
  inlineStyle: string;
};

type FontAuditResult = {
  scannedAt: string;
  totalElements: number;
  matchedElements: number;
  samples: FontAuditBadNode[];
  cssVars: Record<string, string>;
  fontsCheck: Record<string, boolean | null>;
};

const readFont = (el: HTMLElement | null) => {
  if (!el) return { family: '', weight: '' };
  const cs = getComputedStyle(el);
  return { family: cs.fontFamily, weight: cs.fontWeight };
};

const checkFont = (query: string) => {
  try {
    return typeof document !== 'undefined' && 'fonts' in document && document.fonts.check(query);
  } catch {
    return null;
  }
};

const BAD_FONT_RE = /(comicshannsmono|comic\\s?sans|comic|fangsong|stfangsong|仿宋)/i;

const readCssVar = (name: string) => {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  } catch {
    return '';
  }
};

const buildNodePath = (el: Element) => {
  const parts: string[] = [];
  let cur: Element | null = el;
  while (cur && parts.length < 6) {
    const tag = cur.tagName.toLowerCase();
    const id = (cur as HTMLElement).id ? `#${(cur as HTMLElement).id}` : '';
    const clsRaw = (cur as HTMLElement).className || '';
    const cls = String(clsRaw)
      .split(/\\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((c) => `.${c}`)
      .join('');

    let nth = '';
    const parent = cur.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter((x) => x.tagName === cur!.tagName);
      if (siblings.length > 1) {
        const idx = siblings.indexOf(cur) + 1;
        nth = `:nth-of-type(${idx})`;
      }
    }

    parts.unshift(`${tag}${id}${cls}${nth}`);
    cur = cur.parentElement;
  }
  return parts.join(' > ');
};

const scanDomForBadFonts = (): FontAuditResult => {
  const all = Array.from(document.querySelectorAll('body *'));
  const samples: FontAuditBadNode[] = [];
  let matched = 0;

  for (const el of all) {
    const text = (el.textContent || '').replace(/\\s+/g, ' ').trim();
    if (!text) continue;
    const ff = getComputedStyle(el as Element).fontFamily || '';
    if (!BAD_FONT_RE.test(ff)) continue;
    matched += 1;
    if (samples.length < 80) {
      samples.push({
        path: buildNodePath(el),
        text: text.slice(0, 40),
        fontFamily: ff,
        className: (el as HTMLElement).className || '',
        inlineStyle: (el as HTMLElement).getAttribute('style') || '',
      });
    }
  }

  const cssVars = {
    '--font-zh': readCssVar('--font-zh'),
    '--font-en': readCssVar('--font-en'),
    '--font-mono': readCssVar('--font-mono'),
    '--font-sans': readCssVar('--font-sans'),
    '--theme-font-en': readCssVar('--theme-font-en'),
    '--theme-font': readCssVar('--theme-font'),
  };

  const fontsCheck = {
    '12px "Noto Sans SC ZH"': checkFont('12px "Noto Sans SC ZH"'),
    '12px "JetBrains Mono Variable"': checkFont('12px "JetBrains Mono Variable"'),
    '12px "JetBrains Mono"': checkFont('12px "JetBrains Mono"'),
  };

  return {
    scannedAt: new Date().toISOString(),
    totalElements: all.length,
    matchedElements: matched,
    samples,
    cssVars,
    fontsCheck,
  };
};

const DebugFonts: React.FC = () => {
  const [snapshot, setSnapshot] = useState<FontSnapshot | null>(null);
  const [audit, setAudit] = useState<FontAuditResult | null>(null);
  const [auditError, setAuditError] = useState<string>('');

  const sampleId = useMemo(
    () => ({
      zhTitle: 'debug-zh-title',
      zhBody: 'debug-zh-body',
      enTitle: 'debug-en-title',
      enBody: 'debug-en-body',
    }),
    [],
  );

  const updateSnapshot = () => {
    const zhTitle = document.getElementById(sampleId.zhTitle) as HTMLElement | null;
    const zhBody = document.getElementById(sampleId.zhBody) as HTMLElement | null;
    const enTitle = document.getElementById(sampleId.enTitle) as HTMLElement | null;
    const enBody = document.getElementById(sampleId.enBody) as HTMLElement | null;
    const zhTitleFont = readFont(zhTitle);
    const zhBodyFont = readFont(zhBody);
    const enTitleFont = readFont(enTitle);
    const enBodyFont = readFont(enBody);

    const stylesheet = document.querySelector<HTMLLinkElement>('link[data-mt-font-stylesheet="zh"]');
    const preload = document.querySelector<HTMLLinkElement>('link[data-mt-font-preload="zh"]');
    const preconnect = document.querySelector<HTMLLinkElement>('link[data-mt-font-preconnect="zh"]');
    const wrapperStyle = document.getElementById('mt-fontfaces-zh-cjk-only') as HTMLStyleElement | null;
    const fontOrigin = resolveFontOrigin();

    setSnapshot({
      zhTitleFamily: zhTitleFont.family,
      zhTitleWeight: zhTitleFont.weight,
      zhBodyFamily: zhBodyFont.family,
      zhBodyWeight: zhBodyFont.weight,
      enTitleFamily: enTitleFont.family,
      enTitleWeight: enTitleFont.weight,
      enBodyFamily: enBodyFont.family,
      enBodyWeight: enBodyFont.weight,
      zhLoaded700: checkFont(`700 16px "${ZH_FONT_FAMILY}"`),
      zhLoaded400: checkFont(`400 16px "${ZH_FONT_FAMILY}"`),
      enLoaded700: checkFont(`700 16px "JetBrains Mono"`),
      enLoaded400: checkFont(`400 16px "JetBrains Mono"`),
      htmlLang: document.documentElement.getAttribute('lang') || '',
      injectedStylesheetHref: stylesheet?.href || null,
      injectedPreloadHref: preload?.href || null,
      injectedPreconnectHref: preconnect?.href || null,
      wrapperStylePresent: Boolean(wrapperStyle),
      wrapperStyleHasAbsoluteUrl: Boolean(
        wrapperStyle?.textContent &&
          (wrapperStyle.textContent.includes(`url(${fontOrigin}/`) ||
            wrapperStyle.textContent.includes(`url('${fontOrigin}/`) ||
            wrapperStyle.textContent.includes(`url("${fontOrigin}/`)),
      ),
    });
  };

  useEffect(() => {
    updateSnapshot();

    let cancelled = false;
    const onReady = async () => {
      if (!('fonts' in document)) return;
      try {
        await document.fonts.ready;
      } catch {
        // ignore
      }
      if (!cancelled) updateSnapshot();
    };
    onReady();

    const onResize = () => updateSnapshot();
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleHtmlLang = () => {
    const current = document.documentElement.getAttribute('lang') || 'zh-CN';
    const next = current.toLowerCase().startsWith('zh') ? 'en' : 'zh-CN';
    document.documentElement.setAttribute('lang', next);
    updateSnapshot();
  };

  const runAudit = () => {
    setAuditError('');
    try {
      const result = scanDomForBadFonts();
      setAudit(result);
      try {
        const root = window as Window & { __ADMIN_FONT_AUDIT_LAST__?: unknown };
        root.__ADMIN_FONT_AUDIT_LAST__ = result;
      } catch {
        // ignore
      }
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : String(err));
    }
  };

  const copyAudit = async () => {
    if (!audit) return;
    const text = JSON.stringify(audit, null, 2);
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="admin-theme h-full overflow-auto p-6 bg-canvas text-fg">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-black tracking-tight">Font Debug / 字体自检</h1>
            <button
              className="px-3 py-1.5 rounded-xl border border-border bg-surface2/30 hover:bg-surface2/60 transition-colors font-mono text-xs"
              onClick={toggleHtmlLang}
              type="button"
            >
              Toggle html lang
            </button>
          </div>
          <p className="text-sm text-muted mt-2">
            目标：中文使用 <span className="text-primary font-semibold">Noto Sans SC</span>（自托管），英文保持原字体栈不变。
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-sm font-black tracking-widest uppercase text-primary mb-1">DOM Font Audit</h2>
              <p className="text-xs text-muted">
                扫描所有渲染节点的 computed <span className="font-mono">font-family</span>，抓取包含 Comic/FangSong/仿宋 等回退链路的元素。
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={runAudit}
                className="px-3 py-1.5 rounded-xl border border-border bg-fg/6 hover:bg-fg/8 transition-colors text-xs font-semibold"
              >
                Run Scan
              </button>
              <button
                type="button"
                onClick={() => void copyAudit()}
                disabled={!audit}
                className="px-3 py-1.5 rounded-xl border border-border bg-fg/6 hover:bg-fg/8 transition-colors text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Copy JSON
              </button>
            </div>
          </div>

          {auditError ? <div className="mt-3 text-xs text-danger font-mono">{auditError}</div> : null}

          {!audit ? (
            <div className="mt-4 text-xs text-muted font-mono">
              尚未运行扫描。点击 <span className="text-fg">Run Scan</span> 获取 offending 节点列表与 CSS vars。
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono">
                <div className="text-muted">
                  total elements: <span className="text-fg font-semibold">{audit.totalElements}</span>
                </div>
                <div className={audit.matchedElements === 0 ? 'text-success' : 'text-warning'}>
                  offending: <span className="font-semibold">{audit.matchedElements}</span>
                </div>
                <div className="text-muted">samples: {audit.samples.length}</div>
                <div className="text-muted">scannedAt: {audit.scannedAt}</div>
              </div>

              <div className="rounded-xl border border-border bg-surface2/40 p-3">
                <div className="text-[11px] text-muted font-mono mb-2">CSS Vars</div>
                <pre className="text-[11px] leading-relaxed font-mono whitespace-pre-wrap">{JSON.stringify(audit.cssVars, null, 2)}</pre>
              </div>

              <div className="rounded-xl border border-border bg-surface2/40 p-3">
                <div className="text-[11px] text-muted font-mono mb-2">document.fonts.check</div>
                <pre className="text-[11px] leading-relaxed font-mono whitespace-pre-wrap">{JSON.stringify(audit.fontsCheck, null, 2)}</pre>
              </div>

              <div className="rounded-xl border border-border bg-surface2/40 p-3">
                <div className="text-[11px] text-muted font-mono mb-2">Offending Samples (first 80)</div>
                <pre className="text-[11px] leading-relaxed font-mono whitespace-pre-wrap">{JSON.stringify(audit.samples, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-black tracking-widest uppercase text-primary mb-4">
            Samples
          </h2>

          <div className="space-y-4">
            <div>
              <div id={sampleId.zhTitle} className="text-2xl font-bold">
                中文标题（700）- 你好，世界
              </div>
              <div id={sampleId.zhBody} className="text-base font-normal mt-2">
                中文正文（400）：这是一段用于验证中文字体加载与权重显示的文本。123 ABC xyz。
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div id={sampleId.enTitle} className="text-2xl font-bold font-mono">
                English Title (700) - Hello World
              </div>
              <div id={sampleId.enBody} className="text-base font-normal font-mono mt-2">
                English body (400): The quick brown fox jumps over the lazy dog. 12345.
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-black tracking-widest uppercase text-primary mb-4">
            Computed Styles
          </h2>
          <p className="text-xs text-muted mb-3 font-mono">
            FONT_CSS_ZH: {FONT_CSS_ZH}
            {' | '}
            FONT_ORIGIN: {resolveFontOrigin()}
            {' | '}
            FONT_CSS_EN: {FONT_CSS_EN}
          </p>

          {!snapshot ? (
            <div className="text-sm text-muted">Loading…</div>
          ) : (
            <div className="font-mono text-xs whitespace-pre-wrap leading-relaxed">
              {JSON.stringify(snapshot, null, 2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugFonts;
