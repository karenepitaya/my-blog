import Link from "next/link";
import {
  ArticleListItem,
  Category,
  fetchArticles,
  fetchCategories,
} from "@/app/lib/api";
import styles from "./page.module.css";

type PageProps = {
  searchParams?: {
    q?: string;
    categoryId?: string;
  };
};

const formatDate = (date?: string) =>
  date ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(date)) : "";

export const metadata = {
  title: "My Blog | 精选文章与最新创作",
  description: "体验现代化的博客前端，浏览文章、分类与详情页。",
};

async function loadArticles(keyword?: string, categoryId?: string) {
  try {
    return await fetchArticles({ keyword, categoryId, pageSize: 12 });
  } catch (error) {
    console.error("Failed to load articles", error);
    return null;
  }
}

async function loadCategories() {
  try {
    return await fetchCategories();
  } catch (error) {
    console.error("Failed to load categories", error);
    return [];
  }
}

export default async function Home({ searchParams }: PageProps) {
  const keyword = searchParams?.q ?? "";
  const categoryId = searchParams?.categoryId ?? "";

  const [articlesData, categories] = await Promise.all([
    loadArticles(keyword, categoryId),
    loadCategories(),
  ]);

  const articles: ArticleListItem[] = articlesData?.articles ?? [];
  const activeCategory: Category | undefined = categories.find((c) => c._id === categoryId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className={`${styles.hero} border-b border-slate-800/60`}>
        <div className={styles.glow} aria-hidden />
        <div className={`${styles.shell} mx-auto max-w-6xl px-6 py-14 lg:px-10 lg:py-16`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-sky-200/70">Powered by Express API</p>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
                一个现代化的博客前端，为你的每一篇创作提供舞台。
              </h1>
              <p className="text-lg text-slate-200/80">
                根据后端接口实时拉取文章、分类与详情，配合 Next 16 与 Tailwind 4 打造轻量、迅速、沉浸的阅读体验。
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300/80">
                <span className="rounded-full bg-slate-800/60 px-3 py-1">SSR + 无缓存实时数据</span>
                <span className="rounded-full bg-slate-800/60 px-3 py-1">模块化 CSS 渐变主题</span>
                <span className="rounded-full bg-slate-800/60 px-3 py-1">文章列表 / 搜索 / 详情</span>
              </div>
            </div>
            <form
              className="w-full max-w-lg rounded-2xl border border-slate-800 bg-white/5 p-3 shadow-xl backdrop-blur"
              action="/"
              method="get"
            >
              <div className="flex items-center gap-3">
                <input
                  name="q"
                  defaultValue={keyword}
                  placeholder="搜索文章标题或内容关键词"
                  className="w-full rounded-xl bg-slate-900/70 px-4 py-3 text-base text-slate-50 outline-none ring-1 ring-inset ring-slate-700 transition focus:ring-2 focus:ring-sky-400"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:-translate-y-0.5 hover:bg-sky-400"
                >
                  搜索
                </button>
              </div>
              {categoryId && activeCategory ? (
                <p className="mt-3 text-sm text-slate-300/80">
                  当前分类：<span className="font-medium text-white">{activeCategory.name}</span>
                  <Link className="ml-2 text-sky-300 hover:text-sky-200" href="/">
                    清除
                  </Link>
                </p>
              ) : null}
            </form>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-12 px-6 py-12 lg:px-10 lg:py-16">
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Categories</p>
              <h2 className={`text-2xl font-semibold text-white ${styles.sectionTitle}`}>
                精选分类
              </h2>
              <p className="text-sm text-slate-400">按分类筛选，快速锁定你想阅读的主题。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className={`rounded-full border px-4 py-2 text-sm transition hover:border-sky-300 hover:text-sky-200 ${
                  categoryId ? "border-slate-700 text-slate-200" : "border-sky-400/80 bg-sky-400/10 text-sky-100"
                }`}
              >
                全部
              </Link>
              {categories.map((category) => (
                <Link
                  key={category._id}
                  href={{
                    pathname: "/",
                    query: { ...(keyword ? { q: keyword } : {}), categoryId: category._id },
                  }}
                  className={`rounded-full border px-4 py-2 text-sm transition hover:border-sky-300 hover:text-sky-200 ${
                    category._id === categoryId
                      ? "border-sky-400/80 bg-sky-400/10 text-sky-100"
                      : "border-slate-700 text-slate-200"
                  }`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Latest</p>
              <h2 className={`text-2xl font-semibold text-white ${styles.sectionTitle}`}>
                最新文章
              </h2>
              <p className="text-sm text-slate-400">
                实时从 Express API 拉取，展示已发布或草稿中的最新内容。
              </p>
            </div>
            <span className="text-sm text-slate-400">{articles.length} 篇文章</span>
          </div>

          {articles.length === 0 ? (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-8 text-center text-slate-300">
              暂无文章，请先在后台创建。
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <article key={article._id} className={`${styles.card} rounded-2xl p-6 shadow-lg`}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className={`${styles.badgeRow}`}>
                      {article.category?.name ? (
                        <span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-100">
                          {article.category.name}
                        </span>
                      ) : null}
                      {article.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      {article.status ?? "草稿"}
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-white">
                    {article.title}
                  </h3>
                  <p className="mb-4 line-clamp-3 text-sm text-slate-300/80">
                    {article.summary || "这篇文章暂未添加摘要，但你可以点击查看完整内容。"}
                  </p>
                  <div className={`mb-4 flex items-center justify-between text-xs ${styles.meta}`}>
                    <span>
                      {article.author?.username ? `作者 · ${article.author.username}` : "匿名"}
                    </span>
                    <span>{formatDate(article.updatedAt || article.createdAt)}</span>
                  </div>
                  <Link
                    className="inline-flex items-center gap-2 text-sm font-semibold text-sky-200 transition hover:text-sky-100"
                    href={`/articles/${article.slug}`}
                  >
                    阅读更多
                    <span aria-hidden className="text-base">→</span>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

