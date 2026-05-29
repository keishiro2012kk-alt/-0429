import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";

export default function QuizConfig() {
  const [mode, setMode] = useState<"words" | "grammar" | "favorites" | "weakness">("words");
  const [grammarTopic, setGrammarTopic] = useState("");
  const navigate = useNavigate();

  const startQuiz = () => {
    navigate("/quiz/active", { state: { mode, grammarTopic } });
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">学習設定</h1>
        <p className="text-gray-400 mt-1">テストのパラメータを設定します。</p>
      </header>

      <div className="glass-panel p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-bold text-cyan-400 mb-3">出題範囲</h2>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <button 
                className={cn("flex-1 py-4 px-4 rounded-xl border transition-all text-xs font-bold tracking-widest uppercase text-center", mode === "words" ? "border-cyan-500 bg-cyan-500/10 text-white shadow-[0_0_15px_rgba(34,211,238,0.2)]" : "border-white/10 text-slate-400 hover:bg-white/5")}
                onClick={() => setMode("words")}
              >
                単語帳から
              </button>
              <button 
                className={cn("flex-1 py-4 px-4 rounded-xl border transition-all text-xs font-bold tracking-widest uppercase text-center", mode === "grammar" ? "border-purple-500 bg-purple-500/10 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]" : "border-white/10 text-slate-400 hover:bg-white/5")}
                onClick={() => setMode("grammar")}
              >
                文法問題
              </button>
            </div>
            <div className="flex gap-4">
              <button 
                className={cn("flex-1 py-4 px-4 rounded-xl border transition-all text-xs font-bold tracking-widest text-center", mode === "favorites" ? "border-yellow-500 bg-yellow-500/10 text-white shadow-[0_0_15px_rgba(234,179,8,0.2)]" : "border-white/10 text-slate-400 hover:bg-white/5")}
                onClick={() => setMode("favorites")}
              >
                お気に入り
              </button>
              <button 
                className={cn("flex-1 py-4 px-4 rounded-xl border transition-all text-xs font-bold tracking-widest text-center", mode === "weakness" ? "border-red-500 bg-red-500/10 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "border-white/10 text-slate-400 hover:bg-white/5")}
                onClick={() => setMode("weakness")}
              >
                弱点克服
              </button>
            </div>
          </div>
        </div>

        {mode === "grammar" && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <h2 className="text-sm font-bold text-purple-400 mb-3">学習する文法</h2>
            <input 
              type="text" 
              placeholder="例: 現在完了形、不定詞、比較級 など"
              value={grammarTopic}
              onChange={(e) => setGrammarTopic(e.target.value)}
              className="input-glass border-neon-purple/50 focus:border-neon-purple focus:ring-neon-purple"
            />
          </div>
        )}

        <button 
          onClick={startQuiz}
          disabled={mode === "grammar" && !grammarTopic.trim()}
          className="btn-neon w-full flex justify-center items-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Brain className="w-5 h-5" /> 学習を開始する
        </button>
      </div>

      <div className="glass-panel p-6 bg-purple-500/5 border-purple-500/20">
        <h3 className="text-purple-400 font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5" /> AI 分析＆提案
        </h3>
        <p className="text-sm text-slate-300 mt-2">
          AIが過去の学習データを分析し、最適な問題を出題します。4択ではなくタイピング方式で回答することで、より強固な記憶定着を促します。
        </p>
      </div>
    </div>
  );
}
