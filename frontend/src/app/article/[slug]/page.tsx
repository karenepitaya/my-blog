import { fetchJSON } from "@/lib/api";
import DefaultTheme from "@/themes/default";

export default async function ArticlePage({ params }: any) {
  const { slug } = params;

  // 自动渲染 HTML（后端默认返回 HTML + TOC）
  const article = await fetchJSON(`/articles/slug/${slug}`);

  return <DefaultTheme.ArticleLayout article={article} />;
}

