import { fetchJSON } from "@/lib/api";
import DefaultTheme from "@/themes/default";

export default async function HomePage() {
  // 获取文章列表（只取发布状态）
  const data = await fetchJSON("/articles/list?status=published");

  return (
    <DefaultTheme.ListLayout articles={data.articles} />
  );
}

