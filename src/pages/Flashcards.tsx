import { useState } from "react";
import { useWords } from "../lib/useWords";
import { useAuth } from "../lib/AuthContext";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, RotateCw, Volume2, Star, Loader2 } from "lucide-react";
import { speak } from "../lib/speech";
import { cn } from "../lib/utils";

export default function Flashcards() {
  const { user } = useAuth();
  const { words: allWords, loading, updateWord } = useWords();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
         <h2 className="text-2xl font-bold">単語帳（フラッシュカード）</h2>
         <p className="text-slate-400">ログインしてフラッシュカードを活用しましょう。</p>
      </div>
    );
  }

  if (loading) {
     return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>;
  }

  // Fallback to empty array to avoid crash during load
  const words = allWords || [];

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
        <p>データがありません。単語一覧からPDFをアップロードしてください。</p>
      </div>
    );
  }

  const word = words[currentIndex % words.length] || words[0];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 150);
  };

  const handlePrev = () => {
     setIsFlipped(false);
     setTimeout(() => {
       setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
     }, 150);
  };

  return (
    <div className="flex flex-col gap-6 items-center">
      <header className="w-full text-left">
        <h1 className="text-3xl font-bold tracking-tight">単語帳（フラッシュカード）</h1>
        <p className="text-slate-400 mt-1">カードをタップして裏返します。</p>
      </header>

      <div className="w-full max-w-sm flex justify-between items-center text-xs font-bold text-slate-500 font-mono mb-2 px-2">
         <span>進捗状況</span>
         <span className="text-cyan-400">{currentIndex + 1} <span className="text-slate-500">/ {words.length}</span></span>
      </div>

      <div className="relative w-full max-w-sm h-96 perspective-1000 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
        <motion.div
          className="w-full h-full relative preserve-3d"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 25 }}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden glass-panel flex flex-col items-center justify-center p-8 text-center border-t border-white/20 shadow-2xl group-hover:border-cyan-500/50 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all">
             <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); speak(word.word); }} className="p-2 bg-black/40 border border-white/10 rounded-full text-cyan-400 hover:bg-white/10 transition-colors shadow-inner">
                   <Volume2 className="w-5 h-5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); updateWord(word.id!, { isFavorite: !word.isFavorite }); }} className={cn("p-2 rounded-full border transition-colors shadow-inner", word.isFavorite ? "border-purple-500/50 bg-purple-500/20 text-purple-400" : "border-white/10 bg-black/40 text-slate-400 hover:bg-white/10")}>
                   <Star className={cn("w-5 h-5", word.isFavorite && "fill-current")} />
                </button>
             </div>
             <span className="text-xs uppercase font-bold tracking-widest px-3 py-1 bg-white/5 border border-white/10 rounded-full text-slate-400 shadow-inner mb-6 z-10 pointer-events-none">
                {word.pos}
             </span>
             <h2 className="text-4xl font-bold text-slate-100">{word.word}</h2>
             <div className="mt-12 text-slate-500 flex items-center gap-2">
                <RotateCw className="w-4 h-4 animate-spin-slow" /> <span className="text-xs font-bold uppercase tracking-widest">タップで裏返す</span>
             </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden glass-panel flex flex-col items-center justify-center p-8 text-center border-t border-cyan-500/50 shadow-[0_0_30px_rgba(34,211,238,0.2)] [transform:rotateY(180deg)]">
             <h2 className="text-3xl font-bold text-cyan-400 mb-6">{word.translation}</h2>
             
             <div className="text-sm text-left bg-black/40 border border-white/5 rounded-xl p-4 shadow-inner w-full mt-4">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 border-b border-white/5 pb-2 mb-2">例文 / Example</p>
                <p className="italic text-cyan-400 mb-2">{word.example}</p>
                <p className="text-slate-300 text-xs">{word.exampleTranslation}</p>
             </div>
          </div>
        </motion.div>
      </div>

      <div className="flex gap-4 mt-6 w-full max-w-sm">
        <button onClick={handlePrev} className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-2xl transition-colors text-slate-300 flex justify-center items-center backdrop-blur-md">
           <ChevronLeft className="w-6 h-6" />
        </button>
        <button onClick={handleNext} className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-2xl transition-colors text-slate-300 flex justify-center items-center backdrop-blur-md">
           <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}

