'use client';
import React, { useState, useEffect } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TocProps {
  toc: TocItem[];
}

const Toc: React.FC<TocProps> = ({ toc }) => {
  const [activeId, setActiveId] = useState<string>('');

  // 监听滚动事件，更新当前活跃的标题
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      const headings = toc.map((item) => document.getElementById(item.id)).filter(Boolean);
      
      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i];
        if (heading && heading.offsetTop <= scrollPosition) {
          setActiveId(heading.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [toc]);

  // 跳转到指定标题
  const scrollToHeading = (id: string) => {
    const heading = document.getElementById(id);
    if (heading) {
      heading.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">目录</h2>
      <nav className="text-sm space-y-1">
        {toc.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToHeading(item.id)}
            className={`block w-full text-left py-1 px-3 rounded-md transition-colors ${
              item.id === activeId
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            style={{ paddingLeft: `${(item.level - 1) * 16}px` }}
          >
            {item.text}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Toc;
