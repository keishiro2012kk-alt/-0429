import { useState } from "react";
import { BookOpen, Loader2, ArrowRight, CheckCircle2, ChevronRight, Check } from "lucide-react";
import { useWords } from "../lib/useWords";
import { useAuth } from "../lib/AuthContext";
import { cn } from "../lib/utils";
import { aiFetch } from "../lib/aiClient";

interface ReadingData {
  title: string;
  passage: string;
  translation: string;
  questions: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
}

export default function ReadingPractice() {
  const { user } = useAuth();
  const { words, loading: wordsLoading } = useWords();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReadingData | null>(null);
  const [error, setError] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const generateReading = async () => {
    if (!words || words.length === 0) {
      setError("単語データがありません。単語帳に単語を登録してください。");
      return;
    }
    
    // Pick up to 10 random words to use in the story
    const shuffled = [...words].sort(() => 0.5 - Math.random());
    const selectedWords = shuffled.slice(0, 10);

    setLoading(true);
    setError("");
    setData(null);
    setAnswers({});
    setSubmitted(false);
    setShowTranslation(false);

    try {
      const result = await aiFetch("/api/reading-practice", {
        words: selectedWords,
        wordList: selectedWords.map(w => w.word).join(', ')
      });
      // Try to parse the result if it came from the client fallback
      let parsedData = result;
      if (result.content) {
        try {
          const contentStr = result.content.replace(/```json/g, '').replace(/```/g, '').trim();
          parsedData = JSON.parse(contentStr);
        } catch (e) {
          throw new Error("AIの返答形式が不正です。もう一度お試しください。");
        }
      }
      setData(parsedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (qIndex: number, option: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const checkAnswers = () => {
    if (Object.keys(answers).length < (data?.questions.length || 0)) {
       alert("すべての問題に回答してください。");
       return;
    }
    setSubmitted(true);
  };

  let score = 0;
  if (submitted && data) {
    data.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) score++;
    });
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
         <h2 className="text-2xl font-bold">読解練習</h2>
         <p className="text-slate-400">ログインすると、あなたの単語から長文を作成できます。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex justify-between items-end">
        <div>
           <h1 className="text-2xl font-bold tracking-tight">読解練習</h1>
           <p className="text-sm text-slate-400 mt-1">あなたの単語帳から、AIが長文と問題を作成します。</p>
        </div>
      </header>

      {!data && !loading && (
        <div className="glass-panel p-8 text-center flex flex-col items-center justify-center gap-6">
          <BookOpen className="w-16 h-16 text-cyan-400/50" />
          <p className="text-slate-300">現在の単語データ: {wordsLoading ? <Loader2 className="w-4 h-4 inline animate-spin" /> : words?.length || 0}件</p>
          {error && <p className="text-red-400">{error}</p>}
          <button 
            onClick={generateReading}
            disabled={!words || words.length === 0 || wordsLoading}
            className="btn-neon flex items-center justify-center gap-2 px-8 py-4 text-sm disabled:opacity-50"
          >
             長文問題を生成する
             <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
          <p className="text-cyan-400 font-mono tracking-widest text-sm animate-pulse">GENERATING PASSAGE...</p>
        </div>
      )}

      {data && (
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 sm:p-8 flex flex-col gap-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-2xl font-bold text-white leading-tight">{data.title}</h2>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-lg leading-relaxed text-slate-200 whitespace-pre-wrap font-serif">
                {data.passage}
              </p>
            </div>

            <button 
              onClick={() => setShowTranslation(!showTranslation)}
              className="text-cyan-400 text-sm hover:underline self-start mt-4"
            >
              {showTranslation ? "日本語訳を隠す" : "日本語訳を見る"}
            </button>

            {showTranslation && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl mt-2 animate-in fade-in">
                <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{data.translation}</p>
              </div>
            )}
          </div>

          <div className="glass-panel p-6 sm:p-8 flex flex-col gap-8">
            <h3 className="text-xl font-bold text-cyan-400 border-b border-cyan-500/20 pb-4">Comprehension Questions</h3>
            
            {data.questions.map((q, i) => {
              const isCorrect = answers[i] === q.correctAnswer;
              
              return (
                <div key={i} className="flex flex-col gap-4 bg-black/20 p-6 rounded-2xl border border-white/5">
                  <p className="font-bold text-lg flex gap-3">
                    <span className="text-cyan-500 font-mono">Q{i + 1}.</span>
                    <span className="text-slate-200">{q.question}</span>
                  </p>
                  
                  <div className="flex flex-col gap-2 mt-2">
                    {q.options.map((opt, j) => {
                      const isSelected = answers[i] === opt;
                      const isCorrectAns = q.correctAnswer === opt;
                      let bgClass = "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300";
                      
                      if (submitted) {
                         if (isCorrectAns) {
                           bgClass = "bg-emerald-500/20 border-emerald-500/50 text-emerald-200";
                         } else if (isSelected && !isCorrectAns) {
                           bgClass = "bg-red-500/20 border-red-500/50 text-red-200";
                         } else {
                           bgClass = "bg-white/5 border-white/10 opacity-50";
                         }
                      } else if (isSelected) {
                         bgClass = "bg-cyan-500/20 border-cyan-500/50 text-cyan-200";
                      }

                      return (
                        <button
                          key={j}
                          disabled={submitted}
                          onClick={() => handleOptionSelect(i, opt)}
                          className={cn(
                            "text-left p-4 rounded-xl border transition-all flex items-center gap-3",
                            bgClass
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center shrink-0",
                            isSelected || (submitted && isCorrectAns) ? "border-current" : "border-slate-500"
                          )}>
                             {(isSelected || (submitted && isCorrectAns)) && <div className="w-2.5 h-2.5 bg-current rounded-full" />}
                          </div>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {submitted && (
                     <div className={cn("mt-4 p-4 rounded-xl border flex flex-col gap-2 animate-in fade-in slide-in-from-top-2", isCorrect ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20")}>
                        <div className="flex items-center gap-2 font-bold">
                           {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <CheckCircle2 className="w-5 h-5 text-red-400" />}
                           <span className={isCorrect ? "text-emerald-400" : "text-red-400"}>{isCorrect ? "正解！" : "不正解..."}</span>
                        </div>
                        <p className="text-sm text-slate-300 mt-1 leading-relaxed"><span className="font-bold text-white">解説: </span>{q.explanation}</p>
                     </div>
                  )}
                </div>
              );
            })}

            {!submitted ? (
              <button 
                onClick={checkAnswers}
                className="btn-neon self-center w-full sm:w-1/2 py-4 mt-4"
              >
                答え合わせをする
              </button>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 mt-6">
                 <div className="text-center p-6 border border-white/10 rounded-2xl w-full sm:w-1/2 flex flex-col bg-gradient-to-br from-white/5 to-transparent">
                   <h4 className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-2">スコア</h4>
                   <p className="text-5xl font-mono text-white">
                      {score}<span className="text-xl text-slate-500">/{data.questions.length}</span>
                   </p>
                 </div>
                 <button 
                   onClick={generateReading}
                   className="btn-neon self-center w-full sm:w-1/2 py-4 flex justify-center items-center gap-2"
                 >
                   次の問題を生成する
                   <ArrowRight className="w-4 h-4" />
                 </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

