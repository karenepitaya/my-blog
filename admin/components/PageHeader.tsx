import React, { useMemo } from 'react';

const MOTTOS = [
  '代码如诗，运行如歌。每一行逻辑都是通往未来的指令。',
  '简单的代码往往蕴含着最深奥的思想。',
  '缺陷只是尚未被发现的特性，调试是与机器的灵魂对话。',
  '优秀的程序员编写人类能理解的代码，平庸的程序员只写机器能执行的代码。',
  '保持渴望，保持谦卑。',
  '软件开发就像在黑暗中建造大教堂，完成时灯才会亮起。',
  '最好的文档就是清晰的代码结构本身。',
  '你好，世界。今天又是充满逻辑的一天。',
  '技术是工具，创造力才是灵魂。',
  '不要为了过度设计而牺牲运行效率。',
  '生命太短，不能只运行无聊的代码。',
  '所有复杂系统都来自对简单系统的演化。',
];

interface PageHeaderProps {
  title: string;
  motto?: string;
  action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, motto, action }) => {
  const dailyMotto = useMemo(() => {
    return motto || MOTTOS[Math.floor(Math.random() * MOTTOS.length)];
  }, [motto]);

  return (
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-white tracking-tight">
          {title}
        </h1>
        {dailyMotto ? (
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            {dailyMotto}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 flex items-center">{action}</div> : null}
    </header>
  );
};

export default PageHeader;
