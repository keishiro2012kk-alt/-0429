import { useState } from "react";
import { Loader2, Sparkles, ChevronRight, CheckCircle2, XCircle, RotateCw, Plus, X } from "lucide-react";
import { cn } from "../lib/utils";

interface GrammarQuestion {
  question: string;
  choices: string[];
  answer: number; // 0-3
  explanation: string;
}

type Screen = "config" | "quiz" | "result";

const PRESET_TOPICS = [
  "現在完了形", "関係代名詞", "仮定法過去", "受動態", "不定詞・動名詞",
  "比較表現", "話法・間接話法", "分詞構文", "助動詞", "時制の一致",
];

export default function GrammarQuiz() {
  const [screen, setScreen] = useState<Screen>("config");
  const [topics, setTopics] = useState<string[]>([]);
  const [inputTopic, setInputTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [error, setError] = useState("");

  const addTopic = (t: string) => {
    const trimmed = t.trim();
    if (trimmed && !topics.includes(trimmed)) setTopics(prev => [...prev, trimmed]);
    setInputTopic("");
  };

  const removeTopic = (t: string) => setTopics(prev => prev.filter(x => x !== t));

  const generateQuestions = async () => {
    if (topics.length === 0) { setError("文法範囲を1つ以上追加してください"); return; }
    setError("");
    setGenerating(true);

    try {
      const res = await fetch("/api/grammar-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics, count: questionCount, difficulty }),
      });
      if (!res.ok) throw new Error(await res.text());
      const parsed: GrammarQuestion[] = await res.json();
      setQuestions(parsed);
      setCurrentIndex(0);
      setSelected(null);
      setAnswers([]);
      setScreen("quiz");
    } catch (e) {
      setError("問題の生成に失敗しました。もう一度お試しください。");
    } finally {
      setGenerating(false);
    }
  };

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setAnswers(prev => [...prev, idx === questions[currentIndex].answer]);
  };

  const next = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelected(null);
    } else {
      setScreen("result");
    }
  };

  const restart = () => {
    setScreen("config");
    setQuestions([]);
    setAnswers([]);
    setSelected(null);
    setCurrentIndex(0);
  };

  const q = questions[currentIndex];
  const score = answers.filter(Boolean).length;

  // ── CONFIG ──
  if (screen === "config") return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">文法問題</h1>
        <p className="text-slate-400 mt-1">範囲を設定するとAIが問題を生成します</p>
      </header>

      <div className="glass-panel p-6 flex flex-col gap-6">

        {/* 文法範囲 */}
        <div>
          <h2 className="text-xs font-bold text-cyan-400 mb-3 tracking-widest uppercase">文法範囲を選ぶ</h2>
          {/* プリセット */}
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESET_TOPICS.map(t => {
              const active = topics.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => active ? removeTopic(t) : addTopic(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                    active
                      ? "border-cyan-500 bg-cyan-500/15 text-cyan-300"
                      : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                  )}
                >
                  {active ? "✓ " : ""}{t}
                </button>
              );
            })}
          </div>
          {/* 自由入力 */}
          <div className="flex gap-2">
            <input
              className="input-glass text-sm py-2.5 flex-1"
              placeholder="例: 関係副詞、強調構文..."
              value={inputTopic}
              onChange={e => setInputTopic(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTopic(inputTopic); }}}
            />
            <button
              onClick={() => addTopic(inputTopic)}
              className="px-4 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* 選択済みタグ */}
          {topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {topics.map(t => (
                <span key={t} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                  {t}
                  <button onClick={() => removeTopic(t)} className="text-cyan-400 hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 難易度 */}
        <div>
          <h2 className="text-xs font-bold text-cyan-400 mb-3 tracking-widest uppercase">難易度</h2>
          <div className="flex gap-2">
            {([["easy", "基礎"], ["medium", "標準"], ["hard", "難関"]] as const).map(([key, label]) => (
              <button key={key} onClick={() => setDifficulty(key)}
                className={cn("flex-1 py-3 rounded-xl border transition text-sm font-bold",
                  difficulty === key ? "border-cyan-500 bg-cyan-500/10 text-white" : "border-white/10 text-slate-400 hover:bg-white/5")}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 問題数 */}
        <div>
          <h2 className="text-xs font-bold text-cyan-400 mb-3 tracking-widest uppercase">問題数</h2>
          <div className="flex gap-2">
            {[5, 10, 15, 20].map(n => (
              <button key={n} onClick={() => setQuestionCount(n)}
                className={cn("flex-1 py-3 rounded-xl border transition text-sm font-bold",
                  questionCount === n ? "border-cyan-500 bg-cyan-500/10 text-white" : "border-white/10 text-slate-400 hover:bg-white/5")}>
                {n}問
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={generateQuestions}
          disabled={generating || topics.length === 0}
          className={cn("btn-neon w-full flex justify-center items-center gap-2", (generating || topics.length === 0) && "opacity-40 cursor-not-allowed")}
        >
          {generating ? <><Loader2 className="w-5 h-5 animate-spin" />問題を生成中...</> : <><Sparkles className="w-5 h-5" />AIで問題を生成する</>}
        </button>
      </div>
    </div>
  );

  // ── QUIZ ──
  if (screen === "quiz" && q) {
    const remaining = selected !== null ? questions.length - currentIndex - 1 : questions.length - currentIndex;
    return (
      <div className="flex flex-col gap-6">
        <header className="flex justify-between items-center">
          <h1 className="text-xl font-bold">文法問題</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">{remaining} left</span>
            <span className="text-sm font-mono text-slate-400">{currentIndex + 1} / {questions.length}</span>
          </div>
        </header>

        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-400 transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
        </div>

        <div className={cn("glass-panel p-6 relative overflow-hidden",
          selected !== null && selected === q.answer && "border-green-500/30",
          selected !== null && selected !== q.answer && "border-red-500/30"
        )}>
          {selected !== null && selected === q.answer && <div className="absolute inset-0 bg-green-500/5 pointer-events-none" />}
          {selected !== null && selected !== q.answer && <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />}

          <span className="text-xs font-bold tracking-widest text-slate-500 border border-white/5 px-3 py-1 rounded-full bg-black/40">
            文法 · {topics.slice(0, 2).join(" · ")}{topics.length > 2 ? " ..." : ""}
          </span>

          <p className="text-lg font-bold text-slate-100 mt-4 mb-6 leading-relaxed">{q.question}</p>

          <div className="flex flex-col gap-3">
            {q.choices.map((choice, i) => {
              const isCorrect = i === q.answer;
              const isSelected = i === selected;
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={selected !== null}
                  className={cn(
                    "w-full text-left px-4 py-3.5 rounded-xl border transition-all font-medium text-sm flex items-center gap-3",
                    selected === null && "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-slate-300",
                    selected !== null && !isCorrect && !isSelected && "border-white/5 bg-white/3 text-slate-500",
                    selected !== null && isCorrect && "border-green-500/50 bg-green-500/15 text-green-300",
                    selected !== null && isSelected && !isCorrect && "border-red-500/50 bg-red-500/15 text-red-300",
                  )}
                >
                  <span className={cn(
                    "w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0",
                    selected === null && "border-white/20 text-slate-400",
                    selected !== null && isCorrect && "border-green-400 bg-green-400/20 text-green-300",
                    selected !== null && isSelected && !isCorrect && "border-red-400 bg-red-400/20 text-red-300",
                    selected !== null && !isCorrect && !isSelected && "border-white/10 text-slate-600",
                  )}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {choice}
                  {selected !== null && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto" />}
                  {selected !== null && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 ml-auto" />}
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/10 text-sm text-slate-300 animate-in slide-in-from-bottom-2 duration-300">
              <p className="text-xs font-bold text-cyan-400 mb-1 uppercase tracking-widest">解説</p>
              <p>{q.explanation}</p>
            </div>
          )}
        </div>

        {selected !== null && (
          <button onClick={next} className="btn-neon w-full flex justify-center items-center gap-2 animate-in slide-in-from-bottom-2 duration-300">
            {currentIndex < questions.length - 1 ? <>次の問題 <ChevronRight className="w-5 h-5" /></> : "結果を見る"}
          </button>
        )}
      </div>
    );
  }

  // ── RESULT ──
  if (screen === "result") {
    const pct = Math.round((score / questions.length) * 100);
    const grade = pct >= 90 ? "S" : pct >= 75 ? "A" : pct >= 60 ? "B" : pct >= 40 ? "C" : "D";
    const gradeColor = { S: "text-yellow-400", A: "text-green-400", B: "text-cyan-400", C: "text-orange-400", D: "text-red-400" }[grade];
    return (
      <div className="flex flex-col gap-6">
        <header><h1 className="text-3xl font-bold">結果</h1></header>
        <div className="glass-panel p-8 flex flex-col items-center gap-4">
          <span className={cn("text-7xl font-black", gradeColor)}>{grade}</span>
          <p className="text-2xl font-bold">{score} <span className="text-slate-400 text-lg font-normal">/ {questions.length} 正解</span></p>
          <p className="text-slate-400">{pct}%</p>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mt-2">
            <div className={cn("h-full rounded-full transition-all duration-1000", pct >= 75 ? "bg-green-400" : pct >= 50 ? "bg-cyan-400" : "bg-red-400")}
              style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* 復習リスト */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-slate-400">問題の復習</h2>
          {questions.map((q, i) => (
            <div key={i} className={cn("glass-panel p-4 border-l-4", answers[i] ? "border-l-green-500/50" : "border-l-red-500/50")}>
              <div className="flex items-start gap-2 mb-2">
                {answers[i] ? <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />}
                <p className="text-sm text-slate-200">{q.question}</p>
              </div>
              <p className="text-xs text-cyan-400 ml-6">✓ {q.choices[q.answer]}</p>
              <p className="text-xs text-slate-400 ml-6 mt-1">{q.explanation}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={restart} className="flex-1 btn-neon flex justify-center items-center gap-2">
            <RotateCw className="w-4 h-4" /> もう一度設定
          </button>
          <button onClick={() => { setAnswers([]); setCurrentIndex(0); setSelected(null); setScreen("quiz"); }}
            className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl text-sm font-bold text-slate-300 transition flex justify-center items-center gap-2">
            同じ問題を再挑戦
          </button>
        </div>
      </div>
    );
  }

  return null;
}
