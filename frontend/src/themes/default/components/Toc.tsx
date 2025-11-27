"use client";

import React from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function Toc({ toc }: { toc: TocItem[] }) {
  if (!toc || toc.length === 0) return null;

  return (
    <aside className="border-l pl-4 space-y-1 text-sm text-gray-600">
      <h2 className="font-semibold mb-2">目录</h2>
      <ul className="space-y-1">
        {toc.map((item, i) => (
          <li key={i} className={`ml-${(item.level - 1) * 4}`}>
            <a
              href={`#${item.id}`}
              className="hover:text-black transition-colors"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

