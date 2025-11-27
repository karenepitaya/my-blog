import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchArticleBySlug } from "@/app/lib/api";
import styles from "../article.module.css";

const formatDate = (date?: string) =>
  date ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(date)) : "";

export const metadata = {
  title: "文章详情 | My Blog",
};

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const article = await fetchArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-10 lg:py-16">
        <div className={`${styles.banner} rounded-3xl p-[1px] shadow-xl shadow-sky-500/10`}>
          <div className={`rounded-3xl bg-slate-900/80 p-8 sm:p-10 ${styles.bannerContent}`}>
            <Link href="/" className="text-sm text-sky-200 transition hover:text-sky-100">
              ← 返回列表
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300/80">
              {article.category?.name ? (
                <span className="rounded-full bg-sky-400/10 px-3 py-1 font-medium text-sky-100">
                  {article.category.name}
                </span>
              ) : null}
              {article.author?.username ? (
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 font-medium text-emerald-100">
                  作者 · {article.author.username}
                </span>
              ) : null}
              <span className="rounded-full bg-slate-800/60 px-3 py-1">
                更新于 {formatDate(article.updatedAt || article.createdAt)}
              </span>
            </div>
            <h1 className="mt-6 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
              {article.title}
            </h1>
            {article.summary ? (
              <p className="mt-3 text-base text-slate-200/80">{article.summary}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[2fr,1fr]">
          <article
            className={`rounded-3xl border border-slate-800/60 bg-slate-900/60 p-8 shadow-lg ${styles.articleBody}`}
            dangerouslySetInnerHTML={{ __html: article.contentHTML || "<p>暂无内容</p>" }}
          />

          <aside className="space-y-6">
            {article.toc && article.toc.length > 0 ? (
              <div className={`rounded-2xl bg-slate-900/60 p-6 shadow-lg ${styles.tocBorder}`}>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">目录</p>
                <div className="mt-3 space-y-1 text-sm">
                  {article.toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`${styles.tocItem}`}
                      style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                    >
                      {item.text}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-lg">
              <p className="text-sm font-semibold text-white">写作提示</p>
              <p className="mt-2 text-sm text-slate-300/80">
                后端支持 Markdown 存储，阅读页自动转换为 HTML，并提供 TOC 锚点链接。保持标题层级清晰，能让读者快速浏览全文。
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.25em] text-slate-500">实时数据</p>
              <p className="text-sm text-slate-200">来自 Express API：/api/articles/slug/:slug</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
