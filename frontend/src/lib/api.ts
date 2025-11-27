const BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

export async function fetchJSON(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    // 前端为 SSG/SSR，需要明确 no-cache 避免 stale 内容
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }

  return res.json();
}

