import { useState } from "react";
import { Bot, Loader2, Send } from "lucide-react";
import { cn } from "../lib/utils";
import { aiFetch } from "../lib/aiClient";

export default function AIChecker() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ corrected: string; explanation: string } | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await aiFetch("/api/grammar-check", { text });
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">AI 英文添削</h1>
      </header>

      <div className="glass-panel p-6 flex flex-col gap-4">
        <p className="text-sm text-slate-400">
          作成した英文を入力してください。AIが文法や表現をチェックして自然な英語に修正します。
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            className="input-glass w-full h-32 resize-none p-4"
            placeholder="例: I am going to shopping to buy some apple."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" disabled={!text.trim() || loading} className="btn-neon self-end flex items-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            添削する
          </button>
        </form>

        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>

      {result && (
        <div className="glass-panel p-6 mt-4 animate-in fade-in slide-in-from-bottom-4 border-cyan-500/30">
          <h3 className="text-lg font-bold text-cyan-400 mb-2 flex items-center gap-2">
             <Bot className="w-5 h-5" /> 修正案
          </h3>
          <p className="text-xl font-mono text-white mb-6 p-4 bg-black/40 rounded-xl border border-white/10">
             {result.corrected}
          </p>
          <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">解説</h3>
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
             {result.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
