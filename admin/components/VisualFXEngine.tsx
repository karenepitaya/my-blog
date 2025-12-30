
import React, { useEffect, useRef } from 'react';
import { VisualEffectMode } from '../types';

/**
 * VisualFXEngine - 全局特效调度中心
 * 
 * 模块化原理：
 * 1. 统一管理 Canvas 生命周期（挂载、卸载、窗口缩放）。
 * 2. 采用策略模式，根据 mode 切换不同的渲染算法。
 * 3. 使用 requestAnimationFrame 保证 60FPS 的丝滑体验。
 */

interface VisualFXEngineProps {
  mode: VisualEffectMode;
  enabled: boolean;
}

const VisualFXEngine: React.FC<VisualFXEngineProps> = ({ mode, enabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let state: any = { particles: [], columns: [], offset: 0 };

    const getCanvasFont = () => {
      const styles = getComputedStyle(document.documentElement);
      const face = styles.getPropertyValue('--theme-font').trim() || 'monospace';
      const weight = styles.getPropertyValue('--theme-font-weight').trim();
      return `${weight ? `${weight} ` : ''}15px ${face}`;
    };

    // --- 特效逻辑模块化定义 ---

    const Effects = {
      [VisualEffectMode.SNOW_FALL]: {
        init: () => {
          const count = Math.floor((canvas.width * canvas.height) / 10000);
          state.particles = Array.from({ length: count }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 2 + 1,
            s: Math.random() * 0.5 + 0.2
          }));
        },
        render: () => {
          ctx.fillStyle = "rgba(248, 248, 242, 0.5)";
          ctx.beginPath();
          state.particles.forEach((p: any) => {
            ctx.moveTo(p.x, p.y);
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            p.y += p.s;
            if (p.y > canvas.height) p.y = -5;
          });
          ctx.fill();
        }
      },

      [VisualEffectMode.MATRIX_RAIN]: {
        init: () => {
          const cols = Math.floor(canvas.width / 20);
          state.columns = Array.from({ length: cols }, () => Math.random() * canvas.height);
        },
        render: () => {
          ctx.fillStyle = "rgba(40, 42, 54, 0.05)"; // 拖尾效果
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#50fa7b";
          ctx.font = getCanvasFont();
          state.columns.forEach((y: number, x: number) => {
            const text = String.fromCharCode(0x30A0 + Math.random() * 96);
            ctx.fillText(text, x * 20, y);
            state.columns[x] = y > canvas.height + Math.random() * 1000 ? 0 : y + 20;
          });
        }
      },

      [VisualEffectMode.NEON_AMBIENT]: {
        init: () => { state.offset = 0; },
        render: () => {
          state.offset += 0.005;
          const grad = ctx.createRadialGradient(
            canvas.width / 2 + Math.sin(state.offset) * 100,
            canvas.height / 2 + Math.cos(state.offset) * 100,
            0,
            canvas.width / 2,
            canvas.height / 2,
            canvas.width
          );
          grad.addColorStop(0, "rgba(189, 147, 249, 0.15)");
          grad.addColorStop(1, "rgba(40, 42, 54, 0)");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      },

      [VisualEffectMode.TERMINAL_GRID]: {
        init: () => {},
        render: () => {
          ctx.strokeStyle = "rgba(68, 71, 90, 0.15)";
          ctx.lineWidth = 1;
          const size = 50;
          for (let x = 0; x <= canvas.width; x += size) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
          }
          for (let y = 0; y <= canvas.height; y += size) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
          }
        }
      },

      [VisualEffectMode.HEART_PARTICLES]: {
        init: () => {
          const count = 30;
          state.particles = Array.from({ length: count }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            s: Math.random() * 1 + 0.5,
            o: Math.random() * 0.5 + 0.2,
            fs: Math.random() * 15 + 10
          }));
        },
        render: () => {
          state.particles.forEach((p: any) => {
            ctx.globalAlpha = p.o;
            ctx.fillStyle = "#ff79c6";
            ctx.font = `${p.fs}px serif`;
            ctx.fillText("♥", p.x, p.y);
            p.y -= p.s;
            if (p.y < -20) p.y = canvas.height + 20;
          });
          ctx.globalAlpha = 1.0;
        }
      },

      [VisualEffectMode.SCAN_LINES]: {
        init: () => {},
        render: () => {
          ctx.fillStyle = "rgba(18, 18, 18, 0.1)";
          for (let i = 0; i < canvas.height; i += 4) {
            ctx.fillRect(0, i, canvas.width, 1);
          }
        }
      }
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      Effects[mode].init();
    };

    const animate = () => {
      // 只有 Matrix 模式不清除画布以实现拖尾，其他模式清除
      if (mode !== VisualEffectMode.MATRIX_RAIN) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      Effects[mode].render();
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode, enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1] opacity-60"
    />
  );
};

export default VisualFXEngine;
