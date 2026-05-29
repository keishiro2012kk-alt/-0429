import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, CheckSquare, Square, Search, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useWords } from "../lib/useWords";
import { cn } from "../lib/utils";

export default function QuizConfig() {
  const { words: allWords } = useWords();
  const [mode, setMode] = useState<"words" | "favorites" | "weakness" | "select">("words");
  const [questionCount, setQuestionCount] = useState<number | "all">(10);
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  // PDFソース一覧
  const sources = useMemo(() => Array.from(new Set(allWords.map(w => w.source || "手動追加"))), [allWords]);

  // 単語選択モード: 検索でフィルター後、PDFごとにグループ化
  const groupedWords = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = q
      ? allWords.filter(w => w.word.toLowerCase().includes(q) || w.translation.includes(q))
      : allWords;

    const map = new Map<string, typeof allWords>();
    for (const w of filtered) {
      const src = w.source || "手動追加";
      if (!map.has(src)) map.set(src, []);
      map.get(src)!.push(w);
    }
    return Array.from(map.entries()).map(([source, words]) => ({ source, words }));
  }, [allWords, search]);

  const toggleWord = (id: string) => {
    setSelectedWordIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleGroup = (source: string) => {
    const ids = allWords.filter(w => (w.source || "手動追加") === source).map(w => w.id as string);
    const allSelected = ids.every(id => selectedWordIds.has(id));
    setSelectedWordIds(prev => {
      const next = new Set(prev);
      if (allSelected) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  };

  const toggleCollapse = (source: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(source) ? next.delete(source) : next.add(source);
      return next;
    });
  };

  const isGroupAllSelected = (source: string) => {
    const ids = allWords.filter(w => (w.source || "手動追加") === source).map(w => w.id as string);
    return ids.length > 0 && ids.every(id => selectedWordIds.has(id));
  };

  const isGroupPartialSelected = (source: string) => {
    const ids = allWords.filter(w => (w.source || "手動追加") === source).map(w => w.id as string);
    return ids.some(id => selectedWordIds.has(id)) && !isGroupAllSelected(source);
  };

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
          <h2 className="text-xs font-bold text-cyan-400 mb-3 tracking-widest uppercase">出題範囲</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "words", label: "単語帳から", color: "cyan" },
              { key: "favorites", label: "お気に入り", color: "yellow" },
              { key: "weakness", label: "弱点克服", color: "red" },
              { key: "select", label: "単語を選ぶ", color: "purple" },
            ].map(({ key, label, color }) => (
              <button
                key={key}
                className={cn(
                  "py-4 px-4 rounded-xl border transition-all text-xs font-bold tracking-widest text-center",
                  mode === key
                    ? `border-${color}-500 bg-${color}-500/10 text-white shadow-[0_0_15px_rgba(var(--tw-shadow-color),0.2)]`
                    : "border-white/10 text-slate-400 hover:bg-white/5",
                  mode === key && color === "cyan" && "border-cyan-500 bg-cyan-500/10",
                  mode === key && color === "yellow" && "border-yellow-500 bg-yellow-500/10",
                  mode === key && color === "red" && "border-red-500 bg-red-500/10",
                  mode === key && color === "purple" && "border-purple-500 bg-purple-500/10",
                )}
                onClick={() => setMode(key as any)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 単語選択モード */}
        {mode === "select" && (
          <div className="flex flex-col gap-3">
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                <span className="text-white font-bold">{selectedWordIds.size}</span> 件選択中 / 全 {allWords.length} 件
              </span>
              <button
                className="text-xs px-3 py-1 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 transition"
                onClick={() => setSelectedWordIds(new Set())}
              >
                クリア
              </button>
            </div>

            {/* 検索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                className="input-glass pl-9 text-sm py-2.5"
                placeholder="単語・訳語で絞り込み..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* PDFごとのグループ */}
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
              {groupedWords.length === 0 && (
                <p className="text-center text-slate-500 text-sm py-4">単語が見つかりません</p>
              )}
              {groupedWords.map(({ source, words }) => {
                const allSel = isGroupAllSelected(source);
                const partial = isGroupPartialSelected(source);
                const collapsed = collapsedGroups.has(source);
                return (
                  <div key={source} className="rounded-xl border border-white/10 overflow-hidden">
                    {/* グループヘッダー */}
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-2.5 cursor-pointer transition",
                      allSel ? "bg-purple-500/15" : partial ? "bg-purple-500/8" : "bg-white/5 hover:bg-white/8"
                    )}>
                      {/* グループ一括チェック */}
                      <button
                        className="flex-shrink-0"
                        onClick={() => toggleGroup(source)}
                      >
                        {allSel
                          ? <CheckSquare className="w-4 h-4 text-purple-400" />
                          : partial
                            ? <div className="w-4 h-4 rounded border-2 border-purple-400 bg-purple-400/30" />
                            : <Square className="w-4 h-4 text-slate-600" />
                        }
                      </button>
                      {/* ファイルアイコン＋名前 */}
                      <button
                        className="flex items-center gap-2 flex-1 text-left min-w-0"
                        onClick={() => toggleCollapse(source)}
                      >
                        <FileText className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-200 truncate">{source}</span>
                        <span className="text-[10px] text-slate-500 flex-shrink-0">{words.length}件</span>
                        {collapsed
                          ? <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-auto flex-shrink-0" />
                          : <ChevronUp className="w-3.5 h-3.5 text-slate-500 ml-auto flex-shrink-0" />
                        }
                      </button>
                    </div>

                    {/* 単語リスト */}
                    {!collapsed && (
                      <div className="flex flex-col divide-y divide-white/5">
                        {words.map(w => {
                          const id = w.id as string;
                          const checked = selectedWordIds.has(id);
                          return (
                            <button
                              key={id}
                              className={cn(
                                "flex items-center gap-3 px-4 py-2.5 transition text-left",
                                checked ? "bg-purple-500/10" : "hover:bg-white/5"
                              )}
                              onClick={() => toggleWord(id)}
                            >
                              {checked
                                ? <CheckSquare className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                : <Square className="w-4 h-4 text-slate-600 flex-shrink-0" />
                              }
                              <span className="font-bold text-sm text-white">{w.word}</span>
                              <span className="text-slate-400 text-xs truncate">{w.translation}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PDFソース選択（単語帳モードのみ） */}
        {mode === "words" && sources.length > 1 && (
          <div>
            <h2 className="text-xs font-bold text-cyan-400 mb-3 tracking-widest uppercase">PDFを選ぶ</h2>
            <div className="flex flex-col gap-2">
              <button
                className={cn("py-3 px-4 rounded-xl border transition-all text-xs font-bold text-left flex justify-between", selectedSource === "all" ? "border-cyan-500 bg-cyan-500/10 text-white" : "border-white/10 text-slate-400 hover:bg-white/5")}
                onClick={() => setSelectedSource("all")}
              >
                <span>すべて</span><span className="text-slate-500">{allWords.length}件</span>
              </button>
              {sources.map(src => (
                <button
                  key={src}
                  className={cn("py-3 px-4 rounded-xl border transition-all text-xs font-bold text-left flex justify-between", selectedSource === src ? "border-cyan-500 bg-cyan-500/10 text-white" : "border-white/10 text-slate-400 hover:bg-white/5")}
                  onClick={() => setSelectedSource(src)}
                >
                  <span className="truncate flex-1 mr-2">{src}</span>
                  <span className="text-slate-500 flex-shrink-0">{allWords.filter(w => (w.source || "手動追加") === src).length}件</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 問題数（単語選択モード以外） */}
        {mode !== "select" && (
          <div>
            <h2 className="text-xs font-bold text-cyan-400 mb-3 tracking-widest uppercase">問題数</h2>
            <div className="flex gap-2">
              {countOptions.map(n => (
                <button
                  key={n}
                  className={cn(
                    "flex-1 py-3 rounded-xl border transition-all text-sm font-bold",
                    questionCount === n ? "border-cyan-500 bg-cyan-500/10 text-white" : "border-white/10 text-slate-400 hover:bg-white/5"
                  )}
                  onClick={() => setQuestionCount(n)}
                >
                  {n === "all" ? "全問" : `${n}`}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={startQuiz}
          disabled={!canStart}
          className={cn("btn-neon w-full flex justify-center items-center gap-2 mt-2", !canStart && "opacity-40 cursor-not-allowed")}
        >
          <Brain className="w-5 h-5" />
          {mode === "select"
            ? `選択した ${selectedWordIds.size} 件で学習する`
            : "学習を開始する"}
        </button>
      </div>
    </div>
  );
}
