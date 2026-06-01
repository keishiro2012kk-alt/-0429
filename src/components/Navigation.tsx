import { NavLink } from "react-router-dom";
import { Home, BookOpen, BrainCircuit, BarChart2, Layers, BookText, PenLine } from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";

const links = [
  { to: "/", label: "ホーム", icon: Home },
  { to: "/words", label: "一覧", icon: BookText },
  { to: "/cards", label: "単語帳", icon: Layers },
  { to: "/reading", label: "読解", icon: BookOpen },
  { to: "/quiz", label: "問題", icon: BrainCircuit },
  { to: "/grammar", label: "文法", icon: PenLine },
  { to: "/stats", label: "統計", icon: BarChart2 },
];

export function Navigation() {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-50 pointer-events-none flex justify-center">
      <div className="glass-panel py-2 px-2 flex items-center rounded-[2rem] bg-[#0A0F1F]/60 shadow-[0_20px_40px_-20px_rgba(34,211,238,0.15)] backdrop-blur-2xl border border-white/10 pointer-events-auto">
        <div className="flex items-center gap-1 sm:gap-2 px-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                cn(
                  "relative flex items-center px-4 py-3 sm:py-3.5 rounded-2xl transition-all duration-300 group",
                  isActive ? "text-cyan-400" : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-cyan-900/40 rounded-2xl border border-cyan-500/20 shadow-[inset_0_0_20px_rgba(34,211,238,0.1)]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <div className="relative z-10 flex items-center justify-center">
                    <link.icon className={cn("w-5 h-5 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                    <span className={cn(
                      "font-bold tracking-wider transition-all duration-300 overflow-hidden whitespace-nowrap",
                      isActive ? "text-cyan-100 max-w-[100px] ml-2 text-[11px] sm:text-xs opacity-100" : "max-w-0 opacity-0 ml-0 text-[0px]"
                    )}>
                      {link.label}
                    </span>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
