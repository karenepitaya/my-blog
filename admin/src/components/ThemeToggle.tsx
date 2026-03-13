import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex h-10 w-20 items-center rounded-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/60 dark:border-zinc-700/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] p-1 cursor-pointer transition-colors duration-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-white/20"
      aria-label="切换主题"
    >
      {/* Background Icons (inactive states) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 -translate-y-1/2 left-[20px] -translate-x-1/2">
          <Sun className={`h-4 w-4 transition-all duration-500 ${isDark ? 'text-zinc-400/80 scale-100' : 'opacity-0 scale-50'}`} />
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 left-[60px] -translate-x-1/2">
          <Moon className={`h-4 w-4 transition-all duration-500 ${isDark ? 'opacity-0 scale-50' : 'text-zinc-500/80 scale-100'}`} />
        </div>
      </div>

      {/* Sliding thumb */}
      <motion.div
        className="absolute h-8 w-8 rounded-full bg-white dark:bg-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.15)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)] border border-zinc-200/50 dark:border-zinc-700/50 flex items-center justify-center overflow-hidden z-10"
        initial={false}
        animate={{ x: isDark ? 40 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <motion.div
          initial={false}
          animate={{ 
            scale: isDark ? 0 : 1, 
            opacity: isDark ? 0 : 1,
            rotate: isDark ? -90 : 0 
          }}
          transition={{ duration: 0.3 }}
          className="absolute"
        >
          <Sun className="h-4 w-4 text-amber-500" />
        </motion.div>
        <motion.div
          initial={false}
          animate={{ 
            scale: isDark ? 1 : 0, 
            opacity: isDark ? 1 : 0,
            rotate: isDark ? 0 : 90 
          }}
          transition={{ duration: 0.3 }}
          className="absolute"
        >
          <Moon className="h-4 w-4 text-indigo-400" />
        </motion.div>
      </motion.div>
    </motion.button>
  );
}
