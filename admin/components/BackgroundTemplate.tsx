
import React, { useEffect, useRef } from 'react';

/**
 * BackgroundTemplate - 极简背景特效开发模板 (中文指南)
 * 
 * 1. 结构: 这个文件包含了创建 Canvas 特效所需的所有脚手架。
 * 2. 响应式: 自动处理窗口大小调整 (Resize)。
 * 3. 性能: 使用 requestAnimationFrame 实现 60FPS 满帧动画。
 * 4. 使用方法: 直接复制此文件，修改 initLogic 和 drawLogic 即可。
 */

interface Props {
  color?: string;
  speed?: number;
}

const BackgroundTemplate: React.FC<Props> = ({ color = "#bd93f9", speed = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    // --- 1. 定义你的数据模型 (例如粒子、波浪数据) ---
    let particles: {x: number, y: number, vx: number, vy: number}[] = [];

    // --- 2. 初始化逻辑 (在加载或窗口缩放时调用) ---
    const initLogic = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // 生成初始数据
      particles = Array.from({ length: 50 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed
      }));
    };

    // --- 3. 核心绘图逻辑 (每一帧都会运行) ---
    const drawLogic = () => {
      // A. 清理上一帧
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // B. 绘制与更新
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.3;
      
      particles.forEach(p => {
        // 绘制
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // 更新坐标
        p.x += p.vx;
        p.y += p.vy;

        // 边界碰撞检测
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
    };

    // 运行引擎
    const loop = () => {
      drawLogic();
      animationFrameId = requestAnimationFrame(loop);
    };

    window.addEventListener('resize', initLogic);
    initLogic();
    loop();

    return () => {
      window.removeEventListener('resize', initLogic);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color, speed]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.4 }}
    />
  );
};

export default BackgroundTemplate;
