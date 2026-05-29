import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useWords } from "../lib/useWords";
import { useSessions } from "../lib/useSessions";
import { Loader2, ArrowRight, CheckCircle2, XCircle, Mic } from "lucide-react";
import { cn } from "../lib/utils";
import { speak } from "../lib/speech";

interface Question {
  id?: string;
  type: string;
  questionText: string;
  subText?: string;
  correctAnswer: string;
  correctCount?: number;
  incorrectCount?: number;
}

export default function ActiveQuiz() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { words: allWords, loading: wordsLoading, updateWord } = useWords();
  const { addSession } = useSessions();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState<"pending" | "correct" | "incorrect">("pending");
  const [correctCount, setCorrectCount] = useState(0);
  const [listening, setListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wordsLoading) return;

    let words = [...(allWords || [])];

    // 単語選択モード
    if (state?.mode === "select" && state?.selectedWordIds?.length > 0) {
      const idSet = new Set(state.selectedWordIds as string[]);
      words = words.filter(w => idSet.has(w.id as string));
    } else {
      // PDFソースフィルター
      if (state?.selectedSource && state.selectedSource !== "all") {
        words = words.filter(w => (w.source || "手動追加") === state.selectedSource);
      }

      // モードフィルター
      if (state?.mode === "favorites") {
        words = words.filter(w => w.isFavorite);
      } else if (state?.mode === "weakness") {
        words = words.filter(w => w.incorrectCount > 0).sort((a, b) => b.incorrectCount - a.incorrectCount);
      }
    }

    if (words.length === 0) {
      const msg = state?.mode === "favorites" ? "No favorite words registered."
        : state?.mode === "weakness" ? "No words answered incorrectly yet. Great job!"
        : state?.mode === "select" ? "Selected words not found."
        : "No word data. Please upload a PDF first.";
      setError(msg);
      setLoading(false);
      return;
    }

    // 問題生成
    const generated: Question[] = words.map(w => {
      let blanked = w.example.replace(new RegExp(`\\b${w.word}\\b`, "gi"), "(      )");
      if (blanked === w.example) {
        blanked = w.example.replace(new RegExp(w.word, "gi"), "(      )");
      }
      return {
        id: w.id as string,
        type: "fill_in_blank",
        questionText: blanked,
        subText: w.exampleTranslation || w.translation,
        correctAnswer: w.word,
        correctCount: w.correctCount,
        incorrectCount: w.incorrectCount,
      };
    });

    generated.sort(() => Math.random() - 0.5);
    const count = (state?.questionCount === "all" || state?.mode === "select")
      ? generated.length
      : (state?.questionCount || 10);
    setQuestions(generated.slice(0, Math.min(count, generated.length)));
    setLoading(false);
  }, [allWords, wordsLoading, state]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback !== "pending" || !inputValue.trim()) return;

    const correct = questions[currentIndex].correctAnswer.toLowerCase().trim();
    const provided = inputValue.toLowerCase().trim();

    if (provided === correct) {
      setFeedback("correct");
      setCorrectCount(c => c + 1);
      if (questions[currentIndex]?.id) {
        updateWord(questions[currentIndex].id!, { correctCount: (questions[currentIndex].correctCount || 0) + 1 });
      }
    } else {
      setFeedback("incorrect");
      if (questions[currentIndex]?.id) {
        updateWord(questions[currentIndex].id!, { incorrectCount: (questions[currentIndex].incorrectCount || 0) + 1 });
      }
    }
    speak(questions[currentIndex].correctAnswer);
  };

  const nextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setInputValue("");
      setFeedback("pending");
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      await addSession({
        date: new Date(),
        topic: "words",
        correctAnswers: correctCount,
        totalQuestions: questions.length,
        durationMinutes: 5,
      });
      navigate("/stats");
    }
  };

  const startListening = () => {
    if (!("SpeechRecognition" in window) && !("webkitSpeechRecognition" in window)) {
      alert("Speech recognition is not supported in your browser. (Chrome recommended)");
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (e: any) => {
      setInputValue(e.results[0][0].transcript.toLowerCase().replace(/[^a-z0-9 ]/g, ""));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
  };

  if (loading || wordsLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
      <p className="font-bold text-cyan-400 tracking-widest animate-pulse">Preparing questions...</p>
    </div>
  );

  if (error) return (
    <div className="glass-panel p-6 border-red-500/30 text-center">
      <p className="text-red-400">{error}</p>
      <button onClick={() => navigate("/quiz")} className="btn-neon mt-6">Back</button>
    </div>
  );

  const q = questions[currentIndex];
  if (!q) return null;

  const remaining = feedback !== "pending"
    ? questions.length - currentIndex - 1
    : questions.length - currentIndex;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight">Quiz</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 tracking-widest">
            {remaining} left
          </span>
          <div className="text-sm font-mono text-slate-400">
            {currentIndex + 1} / {questions.length}
          </div>
        </div>
      </header>

      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-cyan-400 transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="glass-panel p-8 relative overflow-hidden flex flex-col items-center text-center">
        {feedback === "correct" && <div className="absolute inset-0 bg-green-500/10 pointer-events-none"><div className="w-full absolute bottom-0 h-1 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]"></div></div>}
        {feedback === "incorrect" && <div className="absolute inset-0 bg-red-500/10 pointer-events-none"><div className="w-full absolute bottom-0 h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div></div>}

        <span className="text-xs font-bold tracking-widest text-slate-500 mb-6 border border-white/5 px-3 py-1 rounded-full bg-black/40">
          Fill in the blank
        </span>

        {/* Japanese hint small above */}
        {q.subText && <p className="text-sm text-slate-400 mb-4">{q.subText}</p>}
        {/* English blanked sentence as main question */}
        <h2 className="text-2xl font-light text-cyan-400 mb-6 tracking-wide leading-relaxed">{q.questionText}</h2>

        <form onSubmit={handleSubmit} className="w-full max-w-sm relative mt-4">
          <input
            ref={inputRef}
            type="text"
            className={cn("input-glass text-center text-xl font-mono tracking-wider",
              feedback === "correct" && "border-green-400/50 text-green-400",
              feedback === "incorrect" && "border-red-400/50 text-red-400"
            )}
            placeholder="Type your answer..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={feedback !== "pending"}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {feedback === "pending" && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button type="button" onClick={startListening} className={cn("p-2 rounded-lg transition text-gray-400 hover:text-white hover:bg-white/10", listening && "text-red-400 bg-red-400/20 animate-pulse")}>
                <Mic className="w-5 h-5" />
              </button>
              <button type="submit" className="p-2 hover:bg-white/10 rounded-lg text-cyan-400 transition">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </form>

        {feedback !== "pending" && (
          <div className="mt-8 flex flex-col items-center gap-4 w-full max-w-sm animate-in slide-in-from-bottom-4 duration-300">
            {feedback === "correct" ? (
              <div className="flex items-center gap-2 text-green-400 font-bold"><CheckCircle2 className="w-6 h-6" /> Correct!</div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-red-400 font-bold"><XCircle className="w-6 h-6" /> Incorrect</div>
                <div className="text-sm text-slate-300">Answer: <span className="text-cyan-400 font-bold text-lg ml-2">{q.correctAnswer}</span></div>
              </div>
            )}
            <button onClick={nextQuestion} className="btn-neon w-full mt-4 flex items-center justify-center gap-2">
              {currentIndex < questions.length - 1 ? <>Next <ArrowRight className="w-5 h-5" /></> : "See Results"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
