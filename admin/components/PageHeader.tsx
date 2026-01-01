
import React, { useMemo } from 'react';

const MOTTOS = [
  "代码如诗，运行如歌。每一行逻辑都是通往未来的指令。",
  "简单的代码往往蕴含着最深奥的思想。",
  "缺陷只是尚未被发现的特性，调试是与机器的灵魂对话。",
  "优秀的程序员编写人类能理解的代码，平庸的程序员只写机器能执行的代码。",
  "保持渴望，保持谦卑。",
  "软件开发就像是在黑暗中建造大教堂，只有完成后灯才会亮起。",
  "最好的文档就是清晰的代码结构本身。",
  "你好，世界。今天又是充满逻辑的一天。",
  "技术是工具，创造力才是灵魂。",
  "不要为了过度设计而牺牲了运行效率。",
  "生命太短，不能只运行无聊的代码。",
  "所有的复杂系统都是从简单的系统演化而来的。"
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
    <header className="flex flex-col md:flex-row md:justify-between md:items-end border-b-2 border-[#44475a] pb-6 lg:pb-8 mb-8 lg:mb-12 gap-4 lg:gap-6">
      <div className="flex-1">
        <h2 className="text-2xl md:text-4xl xl:text-5xl font-black tracking-tighter text-[#f8f8f2] italic uppercase leading-[1.1]">{title}</h2>
        <div className="flex items-start gap-3 mt-4 lg:mt-6">
          <span className="text-[#bd93f9] font-black text-xl lg:text-2xl shrink-0">$</span>
          <p className="text-sm md:text-base lg:text-lg xl:text-xl text-[#6272a4] font-mono italic animate-in fade-in slide-in-from-left-4 duration-1000 leading-relaxed max-w-3xl">
            {dailyMotto}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-[#44475a]/30 pt-4 md:border-0 md:pt-0 shrink-0 md:items-end md:text-right">
        {action && <div className="flex justify-end">{action}</div>}
        <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:gap-2">
          <p className="text-[10px] lg:text-xs text-[#50fa7b] font-mono uppercase tracking-[0.2em] font-black bg-[#50fa7b]/10 px-3 py-1 rounded-full inline-block border border-[#50fa7b]/20">系统稳定</p>
          <p className="text-[10px] lg:text-xs text-[#6272a4] font-mono font-bold">
            <span className="opacity-50 uppercase mr-2">时间</span>
            {new Date().toLocaleDateString('zh-CN')} 
            <span className="mx-2 opacity-30">|</span>
            {new Date().toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit'})}
          </p>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
