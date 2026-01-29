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

const DebugFonts: React.FC = () => {
  const [snapshot, setSnapshot] = useState<FontSnapshot | null>(null);

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
            wrapperStyle.textContent.includes(`url(\"${fontOrigin}/`)),
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
