import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain } from "lucide-react";
import { useWords } from "../lib/useWords";
import { cn } from "../lib/utils";

export default function QuizConfig() {
  const { words: allWords } = useWords();
  const [mode, setMode] = useState<"words" | "favorites" | "weakness">("words");
  const [questionCount, setQuestionCount] = useState(10);
  const navigate = useNavigate();

  // PDFソース一覧を取得
  const sources = Array.from(new Set(allWords.map(w => w.source || "手動追加")));
  const [selectedSource, setSelectedSource] = useState<string>("all");

  const startQuiz = () => {
    navigate("/quiz/active", { state: { mode, questionCount, selectedSource } });
  };

  const countOptions = [5, 10, 15, 20];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">学習設定</h1>
        <p className="text-gray-400 mt-1">テストのパラメータを設定します。</p>
      </header>

      <div className="glass-panel p-6 flex flex-col gap-6">

        {/* 出題範囲 */}
        <div>
          <h2 className="text-sm font-bold text-cyan-400 mb-3">出題範囲</h2>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                className={cn("flex-1 py-4 px-4 rounded-xl border transition-all text-xs font-bold tracking-widest uppercase text-center", mode === "words" ? "border-cyan-500 bg-cyan-500/10 text-white shadow-[0_0_15px_rgba(34,211,238,0.2)]" : "border-white/10 text-slate-400 hover:bg-white/5")}
                onClick={() => setMode("words")}
              >
                単語帳から
              </button>
              <button
                className={cn("flex-1 py-4 px-4 rounded-xl border transition-all text-xs font-bold tracking-widest text-center", mode === "favorites" ? "border-yellow-500 bg-yellow-500/10 text-white" : "border-white/10 text-slate-400 hover:bg-white/5")}
                onClick={() => setMode("favorites")}
              >
                お気に入り
              </button>
              <button
                className={cn("flex-1 py-4 px-4 rounded-xl border transition-all text-xs font-bold tracking-widest text-center", mode === "weakness" ? "border-red-500 bg-red-500/10 text-white" : "border-white/10 text-slate-400 hover:bg-white/5")}
                onClick={() => setMode("weakness")}
              >
                弱点克服
              </button>
            </div>
          </div>
        </div>

        {/* PDFソース選択 */}
        {mode === "words" && sources.length > 1 && (
          <div>
            <h2 className="text-sm font-bold text-cyan-400 mb-3">PDFを選ぶ</h2>
            <div className="flex flex-col gap-2">
              <button
                className={cn("py-3 px-4 rounded-xl border transition-all text-xs font-bold text-left", selectedSource === "all" ? "border-cyan-500 bg-cyan-500/10 text-white" : "border-white/10 text-slate-400 hover:bg-white/5")}
                onClick={() => setSelectedSource("all")}
              >
                すべて ({allWords.length}件)
              </button>
              {sources.map(src => (
                <button
                  key={src}
                  className={cn("py-3 px-4 rounded-xl border transition-all text-xs font-bold text-left", selectedSource === src ? "border-cyan-500 bg-cyan-500/10 text-white" : "border-white/10 text-slate-400 hover:bg-white/5")}
                  onClick={() => setSelectedSource(src)}
                >
                  {src} ({allWords.filter(w => (w.source || "手動追加") === src).length}件)
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 問題数 */}
        <div>
          <h2 className="text-sm font-bold text-cyan-400 mb-3">問題数</h2>
          <div className="flex gap-3">
            {countOptions.map(n => (
              <button
                key={n}
                className={cn("flex-1 py-3 rounded-xl border transition-all text-sm font-bold", questionCount === n ? "border-cyan-500 bg-cyan-500/10 text-white" : "border-white/10 text-slate-400 hover:bg-white/5")}
                onClick={() => setQuestionCount(n)}
              >
                {n}問
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={startQuiz}
          className="btn-neon w-full flex justify-center items-center gap-2 mt-2"
        >
          <Brain className="w-5 h-5" /> 学習を開始する
        </button>
      </div>
    </div>
  );
}
