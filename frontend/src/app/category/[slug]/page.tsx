import { fetchJSON } from "@/lib/api";
import DefaultTheme from "@/themes/default";

export default async function CategoryPage({ params }: any) {
  const { slug } = params;

  // 根据分类 slug 获取文章列表
  const data = await fetchJSON(`/articles/list?categorySlug=${slug}`);

  return (
    <DefaultTheme.ListLayout articles={data.articles} />
  );
}

