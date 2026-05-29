import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, CheckSquare, Square, Search } from "lucide-react";
import { useWords } from "../lib/useWords";
import { cn } from "../lib/utils";

export default function QuizConfig() {
  const { words: allWords } = useWords();
  const [mode, setMode] = useState<"words" | "favorites" | "weakness" | "select">("words");
  const [questionCount, setQuestionCount] = useState<number | "all">(10);
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // PDFソース一覧
  const sources = Array.from(new Set(allWords.map(w => w.source || "手動追加")));

  // 選択モード時の表示単語
  const displayWords = useMemo(() => {
    if (!search.trim()) return allWords;
    const q = search.toLowerCase();
    return allWords.filter(w =>
      w.word.toLowerCase().includes(q) || w.translation.includes(q)
    );
  }, [allWords, search]);

  const toggleWord = (id: string) => {
    setSelectedWordIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedWordIds(new Set(displayWords.map(w => w.id as string)));
  };

  const clearAll = () => setSelectedWordIds(new Set());

  const startQuiz = () => {
    navigate("/quiz/active", {
      state: {
        mode,
        questionCount,
        selectedSource,
        selectedWordIds: mode === "select" ? Array.from(selectedWordIds) : undefined,
      }
    });
  };

  const countOptions: (number | "all")[] = [5, 10, 15, 20, "all"];

  const canStart = mode === "select" ? selectedWordIds.size > 0 : true;

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
          <div className="grid grid-cols-2 gap-3">
            <button
              className={cn("py-4 px-4 rounded-xl border transition-all text-xs font-bold tracking-widest uppercase text-center", mode === "words" ? "border-cyan-500 bg-cyan-500/10 text-white shadow-[0_0_15px_rgba(34,211,238,0.2)]" : "border-white/10 text-slate-400 hover:bg-white/5")}
              onClick={() => setMode("words")}
            >
              単語帳から
            </button>
            <button
              className={cn("py-4 px-4 rounded-xl border transition-all text-xs font-bold tracking-widest text-center", mode === "favorites" ? "border-yellow-500 bg-yellow-500/10 text-white" : "border-white/10 text-slate-400 hover:bg-white/5")}
              onClick={() => setMode("favorites")}
            >
              お気に入り
            </button>
            <button
              className={cn("py-4 px-4 rounded-xl border transition-all text-xs font-bold tracking-widest text-center", mode === "weakness" ? "border-red-500 bg-red-500/10 text-white" : "border-white/10 text-slate-400 hover:bg-white/5")}
              onClick={() => setMode("weakness")}
            >
              弱点克服
            </button>
            <button
              className={cn("py-4 px-4 rounded-xl border transition-all text-xs font-bold tracking-widest text-center", mode === "select" ? "border-purple-500 bg-purple-500/10 text-white" : "border-white/10 text-slate-400 hover:bg-white/5")}
              onClick={() => setMode("select")}
            >
              単語を選ぶ
            </button>
          </div>
        </div>

        {/* 単語選択モード */}
        {mode === "select" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">
                {selectedWordIds.size}件選択中 / 全{allWords.length}件
              </span>
              <div className="flex gap-2">
                <button
                  className="text-xs px-3 py-1 rounded-lg border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 transition"
                  onClick={selectAll}
                >
                  全選択
                </button>
                <button
                  className="text-xs px-3 py-1 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 transition"
                  onClick={clearAll}
                >
                  クリア
                </button>
              </div>
            </div>

            {/* 検索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                className="input-glass pl-9 text-sm"
                placeholder="単語・訳語で絞り込み..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* 単語リスト */}
            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
              {displayWords.length === 0 && (
                <p className="text-center text-slate-500 text-sm py-4">単語が見つかりません</p>
              )}
              {displayWords.map(w => {
                const id = w.id as string;
                const checked = selectedWordIds.has(id);
                return (
                  <button
                    key={id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left",
                      checked
                        ? "border-purple-500/50 bg-purple-500/10"
                        : "border-white/5 hover:bg-white/5"
                    )}
                    onClick={() => toggleWord(id)}
                  >
                    {checked
                      ? <CheckSquare className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      : <Square className="w-4 h-4 text-slate-600 flex-shrink-0" />
                    }
                    <span className="font-bold text-sm text-white">{w.word}</span>
                    <span className="text-slate-400 text-xs ml-1 truncate">{w.translation}</span>
                    {w.source && (
                      <span className="ml-auto text-[10px] text-slate-600 flex-shrink-0">{w.source}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PDFソース選択（単語帳モードのみ） */}
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

        {/* 問題数（単語選択モード以外） */}
        {mode !== "select" && (
          <div>
            <h2 className="text-sm font-bold text-cyan-400 mb-3">問題数</h2>
            <div className="flex gap-2 flex-wrap">
              {countOptions.map(n => (
                <button
                  key={n}
                  className={cn(
                    "flex-1 min-w-[3rem] py-3 rounded-xl border transition-all text-sm font-bold",
                    questionCount === n
                      ? "border-cyan-500 bg-cyan-500/10 text-white"
                      : "border-white/10 text-slate-400 hover:bg-white/5"
                  )}
                  onClick={() => setQuestionCount(n)}
                >
                  {n === "all" ? "全問" : `${n}問`}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={startQuiz}
          disabled={!canStart}
          className={cn(
            "btn-neon w-full flex justify-center items-center gap-2 mt-2",
            !canStart && "opacity-40 cursor-not-allowed"
          )}
        >
          <Brain className="w-5 h-5" />
          {mode === "select"
            ? `選択した${selectedWordIds.size}件で学習する`
            : "学習を開始する"}
        </button>
      </div>
    </div>
  );
}
