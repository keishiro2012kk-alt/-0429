import { useState, useCallback, useMemo } from "react";
import { useWords } from "../lib/useWords";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, RotateCw, Volume2, Star, Loader2, FileText } from "lucide-react";
import { speak } from "../lib/speech";
import { cn } from "../lib/utils";

export default function Flashcards() {
  const { words: allWords, loading, updateWord } = useWords();
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const sources = useMemo(() => Array.from(new Set((allWords || []).map(w => w.source || "手動追加"))), [allWords]);
  const currentSource = activeSource ?? sources[0] ?? null;
  const words = useMemo(() => (allWords || []).filter(w => (w.source || "手動追加") === currentSource), [allWords, currentSource]);

  const switchSource = (src: string) => {
    setActiveSource(src);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const goNext = useCallback(() => {
    if (words.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % words.length);
  }, [words.length]);

  const goPrev = useCallback(() => {
    if (words.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + words.length) % words.length);
  }, [words.length]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>;

  if (!allWords || allWords.length === 0) {
    return <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500"><p>単語帳にデータがありません。PDFをアップロードしてください。</p></div>;
  }

  const word = words[currentIndex];

  return (
    <div className="flex flex-col gap-5 items-center">
      <header className="w-full text-left">
        <h1 className="text-3xl font-bold tracking-tight">単語帳</h1>
        <p className="text-slate-400 mt-1">カードをタップして裏返す</p>
      </header>

      {/* PDFタブ */}
      <div className="w-full flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {sources.map(src => {
          const count = (allWords || []).filter(w => (w.source || "手動追加") === src).length;
          const isActive = src === currentSource;
          return (
            <button
              key={src}
              onClick={() => switchSource(src)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold whitespace-nowrap transition-all flex-shrink-0",
                isActive
                  ? "border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.15)]"
                  : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
              )}
            >
              <FileText className="w-3 h-3 flex-shrink-0" />
              <span className="max-w-[120px] truncate">{src}</span>
              <span className={cn("px-1.5 py-0.5 rounded-full text-[10px]", isActive ? "bg-cyan-500/20 text-cyan-300" : "bg-white/10 text-slate-500")}>{count}</span>
            </button>
          );
        })}
      </div>

      {words.length === 0 ? (
        <div className="text-slate-500 text-sm py-10">このPDFに単語がありません</div>
      ) : (
        <>
          {/* 進捗 */}
          <div className="w-full max-w-sm flex justify-between items-center text-xs font-bold text-slate-500 font-mono px-1">
            <span>{currentSource}</span>
            <span className="text-cyan-400">{currentIndex + 1} <span className="text-slate-500">/ {words.length}</span></span>
          </div>
          <div className="w-full max-w-sm h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }} />
          </div>

          {/* カード */}
          <div
            key={`${currentSource}-${currentIndex}`}
            className="relative w-full max-w-sm h-96 cursor-pointer group"
            style={{ perspective: "1000px" }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <motion.div
              className="w-full h-full relative"
              style={{ transformStyle: "preserve-3d" }}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 260, damping: 25 }}
            >
              {/* 表: 日本語 */}
              <div
                className="absolute inset-0 glass-panel flex flex-col items-center justify-center p-8 text-center border-t border-white/20 shadow-2xl group-hover:border-cyan-500/30 transition-all"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="absolute top-4 right-4">
                  <button onClick={e => { e.stopPropagation(); updateWord(word.id!, { isFavorite: !word.isFavorite }); }}
                    className={cn("p-2 rounded-full border transition-colors", word.isFavorite ? "border-purple-500/50 bg-purple-500/20 text-purple-400" : "border-white/10 bg-black/40 text-slate-400 hover:bg-white/10")}>
                    <Star className={cn("w-5 h-5", word.isFavorite && "fill-current")} />
                  </button>
                </div>
                <span className="text-xs uppercase font-bold tracking-widest px-3 py-1 bg-white/5 border border-white/10 rounded-full text-slate-400 mb-6">{word.pos}</span>
                <h2 className="text-3xl font-bold text-slate-100">{word.translation}</h2>
                {word.exampleTranslation && <p className="text-sm text-slate-400 mt-4 italic">{word.exampleTranslation}</p>}
                <div className="mt-10 text-slate-500 flex items-center gap-2">
                  <RotateCw className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-widest">タップして反転</span>
                </div>
              </div>

              {/* 裏: 英語 */}
              <div
                className="absolute inset-0 glass-panel flex flex-col items-center justify-center p-8 text-center border-t border-cyan-500/50 shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <div className="absolute top-4 right-4">
                  <button onClick={e => { e.stopPropagation(); speak(word.word); }}
                    className="p-2 bg-black/40 border border-white/10 rounded-full text-cyan-400 hover:bg-white/10 transition-colors">
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
                <h2 className="text-4xl font-bold text-cyan-400 mb-4">{word.word}</h2>
                <div className="text-sm text-left bg-black/40 border border-white/5 rounded-xl p-4 w-full mt-4">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 border-b border-white/5 pb-2 mb-2">Example</p>
                  <p className="italic text-cyan-400 mb-2">{word.example}</p>
                  <p className="text-slate-300 text-xs">{word.exampleTranslation}</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex gap-4 mt-4 w-full max-w-sm">
            <button onClick={goPrev} className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl transition text-slate-300 flex justify-center">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={goNext} className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl transition text-slate-300 flex justify-center">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
