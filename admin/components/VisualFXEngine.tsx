
import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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
  intensity?: number;
}

const VisualFXEngine: React.FC<VisualFXEngineProps> = ({ mode, enabled, intensity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const location = useLocation();
  const lowPowerMode = location.pathname.startsWith('/tags');

  useEffect(() => {
    if (!enabled || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const normalizedIntensity = Number.isFinite(Number(intensity))
      ? Math.min(1, Math.max(0.1, Number(intensity)))
      : 0.8;

    let animationFrameId: number;
    let isMounted = true;
    let state: any = { particles: [], columns: [], offset: 0 };
    const baseInterval = lowPowerMode ? 1000 / 24 : 1000 / 60;
    const perfState = { lastTick: 0, interval: baseInterval, slowStreak: 0, fastStreak: 0 };
    const pausedRef = { current: document.hidden };
    const density = (lowPowerMode ? 0.6 : 1) * normalizedIntensity;

    const getCanvasFont = (size = 15) => {
      const styles = getComputedStyle(document.documentElement);
      const face = styles.getPropertyValue('--theme-font').trim() || 'monospace';
      const weight = styles.getPropertyValue('--theme-font-weight').trim();
      return `${weight ? `${weight} ` : ''}${size}px ${face}`;
    };

    // --- 特效逻辑模块化定义 ---

    const Effects = {
      [VisualEffectMode.SNOW_FALL]: {
        init: () => {
          const count = Math.max(8, Math.floor((canvas.width * canvas.height) / 12000 * (0.55 + density)));
          state.particles = Array.from({ length: count }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 2 + 1,
            s: (Math.random() * 0.6 + 0.15) * (0.6 + normalizedIntensity),
          }));
        },
        render: () => {
          ctx.fillStyle = `rgba(248, 248, 242, ${0.15 + 0.5 * normalizedIntensity})`;
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
          const spacing = 18 / Math.max(0.35, density);
          const cols = Math.max(8, Math.floor(canvas.width / spacing));
          state.columnSpacing = spacing;
          state.columns = Array.from({ length: cols }, () => Math.random() * canvas.height);
        },
        render: () => {
          ctx.fillStyle = `rgba(40, 42, 54, ${0.03 + 0.06 * (1 - normalizedIntensity)})`; // 拖尾效果
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#50fa7b";
          ctx.font = getCanvasFont();
          state.columns.forEach((y: number, x: number) => {
            const text = String.fromCharCode(0x30A0 + Math.random() * 96);
            ctx.fillText(text, x * state.columnSpacing, y);
            const step = 14 + 22 * normalizedIntensity;
            state.columns[x] = y > canvas.height + Math.random() * 1000 ? 0 : y + step;
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
          grad.addColorStop(0, `rgba(189, 147, 249, ${0.06 + 0.16 * normalizedIntensity})`);
          grad.addColorStop(1, "rgba(40, 42, 54, 0)");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      },

      [VisualEffectMode.TERMINAL_GRID]: {
        init: () => {},
        render: () => {
          ctx.strokeStyle = `rgba(68, 71, 90, ${0.06 + 0.14 * normalizedIntensity})`;
          ctx.lineWidth = 1;
          const size = lowPowerMode ? 80 : 50;
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
          const count = Math.max(10, Math.floor(12 + 28 * density));
          state.particles = Array.from({ length: count }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            s: (Math.random() * 1.1 + 0.35) * (0.65 + normalizedIntensity),
            o: (Math.random() * 0.4 + 0.15) * (0.7 + 0.6 * normalizedIntensity),
            fs: Math.random() * (density < 1 ? 10 : 15) + 8
          }));
        },
        render: () => {
          state.particles.forEach((p: any) => {
            ctx.globalAlpha = p.o;
            ctx.fillStyle = "#ff79c6";
            ctx.font = getCanvasFont(p.fs);
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
          ctx.fillStyle = `rgba(18, 18, 18, ${0.06 + 0.12 * normalizedIntensity})`;
          const gap = lowPowerMode ? 6 : 4;
          for (let i = 0; i < canvas.height; i += gap) {
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

    const updateInterval = (renderCost: number) => {
      const slowThreshold = lowPowerMode ? 18 : 22;
      const fastThreshold = lowPowerMode ? 8 : 12;

      if (renderCost > slowThreshold) {
        perfState.slowStreak += 1;
        perfState.fastStreak = 0;
      } else if (renderCost < fastThreshold) {
        perfState.fastStreak += 1;
        perfState.slowStreak = 0;
      } else {
        perfState.fastStreak = 0;
        perfState.slowStreak = 0;
      }

      if (perfState.slowStreak > 10 && perfState.interval < 1000 / 30) {
        perfState.interval = 1000 / 30;
      }
      if (perfState.fastStreak > 20) {
        perfState.interval = baseInterval;
      }
    };

    const handleVisibility = () => {
      pausedRef.current = document.hidden;
      if (!pausedRef.current) {
        perfState.lastTick = 0;
      }
    };

    const handleBlur = () => { pausedRef.current = true; };
    const handleFocus = () => {
      pausedRef.current = false;
      perfState.lastTick = 0;
    };

    const animate = (now: number) => {
      if (!isMounted) return;
      if (pausedRef.current) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      if (perfState.lastTick && now - perfState.lastTick < perfState.interval) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      perfState.lastTick = now;
      const frameStart = performance.now();
      // 只有 Matrix 模式不清除画布以实现拖尾，其他模式清除
      if (mode !== VisualEffectMode.MATRIX_RAIN) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      Effects[mode].render();
      updateInterval(performance.now() - frameStart);
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    handleResize();
    animate(performance.now());

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode, enabled, intensity, lowPowerMode]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1] opacity-60"
    />
  );
};

export default VisualFXEngine;
