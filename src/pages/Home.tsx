import { Link } from "react-router-dom";
import { useWords } from "../lib/useWords";
import { useSessions } from "../lib/useSessions";
import { useAuth } from "../lib/AuthContext";
import { Play, FileText, Zap, Flame, Target, Sparkles, BookOpen } from "lucide-react";
import { motion } from "motion/react";
import { toDate } from "../lib/utils";

export default function Home() {
  const { user } = useAuth();
  const { words } = useWords();
  const { sessions: allSessions } = useSessions();
  
  const wordsCount = words ? words.length : 0;
  const sessions = allSessions || [];
  
  // Calculate Streak
  let streak = 0;
  const today = new Date().toDateString();
  const sortedSessions = [...sessions].sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime());
  
  if (sortedSessions.length > 0) {
    let lastDateObj = toDate(sortedSessions[0].date);
    if (lastDateObj.toDateString() === today || lastDateObj.toDateString() === new Date(Date.now() - 86400000).toDateString()) {
      streak = 1;
      let checkDate = new Date(lastDateObj.getFullYear(), lastDateObj.getMonth(), lastDateObj.getDate());
      for (let i = 1; i < sortedSessions.length; i++) {
        const sDate = toDate(sortedSessions[i].date);
        const normalizedSDate = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate());
        const diff = (checkDate.getTime() - normalizedSDate.getTime()) / 86400000;
        if (diff === 1) {
          streak++;
          checkDate = normalizedSDate;
        } else if (diff > 1) {
          break;
        }
      }
    }
  }

  const totalCorrect = sessions.reduce((acc, s) => acc + s.correctAnswers, 0);
  const totalQuestions = sessions.reduce((acc, s) => acc + s.totalQuestions, 0);
  const globalAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  
  return (
    <div className="flex flex-col gap-8">
      <header className="relative pt-8 pb-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1 mb-6 border border-white/10 bg-white/5 rounded-full text-xs font-semibold uppercase tracking-wider text-cyan-400">
           <Sparkles className="w-3.5 h-3.5" /> 次世代の英語学習
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-6xl font-extrabold tracking-tighter bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent mb-4">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-lg">単語帳</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-400 max-w-lg text-lg leading-relaxed">
          AIと同期して、語彙力と語学力を飛躍的に向上させましょう。
        </motion.p>
      </header>

      {user ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="space-y-6">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-8 flex flex-col justify-between min-h-[220px] relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-10 transition-all duration-700 group-hover:scale-110 group-hover:rotate-12">
                <Target className="w-48 h-48" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                   <BookOpen className="w-4 h-4 text-cyan-400" /> データコア
                </h2>
                <div className="mt-2 flex items-baseline gap-2">
                   <p className="text-6xl font-mono text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] tracking-tighter">{wordsCount}</p>
                   <span className="text-slate-500 font-bold uppercase tracking-widest text-sm">単語</span>
                </div>
              </div>
              <Link to="/words" className="text-sm text-cyan-400 flex items-center gap-1 mt-6 hover:text-cyan-300 w-fit font-bold tracking-wide group-hover:translate-x-2 transition-transform">
                単語を管理 <FileText className="w-4 h-4 inline" />
              </Link>
            </div>
            
            <div className="glass-panel p-8 bg-gradient-to-br from-blue-900/20 to-cyan-900/10 border-cyan-500/20 flex flex-col justify-between min-h-[220px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full group-hover:bg-cyan-400/20 transition-colors duration-500" />
              <div className="relative z-10">
                <h2 className="text-lg font-bold text-cyan-50 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" /> アクティブリコール
                </h2>
                <p className="text-sm text-cyan-100/60 mt-3 leading-relaxed">
                   AIがあなたのデータから最適な問題を自動生成します。ニューラルパスを活性化しましょう。
                </p>
              </div>
              <div className="relative z-10 mt-6 pt-4 border-t border-white/5">
                <Link to="/quiz" className="btn-neon w-full">
                  トレーニング開始 <Play className="w-4 h-4 ml-1" fill="currentColor" />
                </Link>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-6">
            <div className="glass-panel p-6 border-orange-500/20 flex flex-col items-center justify-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent" />
               <Flame className="w-8 h-8 text-orange-400 mb-3 drop-shadow-[0_0_12px_rgba(249,115,22,0.6)] group-hover:scale-125 transition-transform duration-500" />
               <h3 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1">連続学習</h3>
               <div className="flex items-baseline gap-1">
                 <p className="text-4xl font-mono text-orange-100">{streak}</p>
                 <span className="text-xs text-orange-500/80 font-bold uppercase tracking-wider">日</span>
               </div>
            </div>
            <div className="glass-panel p-6 border-emerald-500/20 flex flex-col items-center justify-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent" />
               <Target className="w-8 h-8 text-emerald-400 mb-3 drop-shadow-[0_0_12px_rgba(16,185,129,0.6)] group-hover:scale-125 transition-transform duration-500" />
               <h3 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1">平均正答率</h3>
               <div className="flex items-baseline gap-1">
                 <p className="text-4xl font-mono text-emerald-100">{globalAccuracy}</p>
                 <span className="text-xs text-emerald-500/80 font-bold uppercase tracking-wider">%</span>
               </div>
            </div>
          </section>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 mt-8 glass-panel border-white/5 relative overflow-hidden">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none" />
           <Target className="w-16 h-16 text-cyan-400/50 mx-auto mb-6" />
           <h2 className="text-2xl md:text-3xl font-extrabold mb-4 tracking-tight text-white relative z-10">プロファイルを初期化</h2>
           <p className="text-slate-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed relative z-10">Googleアカウントで安全にログインし、複数デバイス間で単語や学習データを同期しましょう。</p>
           <p className="text-xs font-mono text-cyan-500/50 uppercase tracking-widest relative z-10">ヘッダーから連携 &uarr;</p>
        </motion.div>
      )}
    </div>
  );
}
