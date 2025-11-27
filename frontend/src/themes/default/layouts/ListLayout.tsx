import Link from "next/link";

export default function ListLayout({ articles }: { articles: any[] }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">最新文章</h1>

      <ul className="space-y-6">
        {articles.map((a) => (
          <li
            key={a.slug}
            className="border-b pb-4 border-gray-200 hover:bg-gray-50 p-4 rounded-lg transition"
          >
            <Link href={`/article/${a.slug}`}>
              <h2 className="text-xl font-semibold">{a.title}</h2>
            </Link>

            {a.summary && (
              <p className="text-gray-600 mt-1 line-clamp-2">{a.summary}</p>
            )}

            <div className="text-sm text-gray-500 mt-2">
              {new Date(a.createdAt).toLocaleDateString()}
              {a.category && (
                <span>
                  {" "}
                  ·{" "}
                  <Link
                    href={`/category/${a.category.slug}`}
                    className="hover:text-black"
                  >
                    {a.category.name}
                  </Link>
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

