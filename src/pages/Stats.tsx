import { useSessions } from "../lib/useSessions";
import { useAuth } from "../lib/AuthContext";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Target, Clock, Trophy, MessageSquare, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";

export default function Stats() {
  const { user } = useAuth();
  const { sessions: allSessions, loading } = useSessions();
  
  // Need to clone and reverse for chronical sorting (assuming original hook sorts by date desc)
  const sessions = allSessions ? [...allSessions].reverse() : [];
  
  // Format data for Recharts
  const chartData = sessions.map((s, i) => ({
    name: 'セッション ' + (i + 1),
    accuracy: Math.round((s.correctAnswers / s.totalQuestions) * 100) || 0
  }));

  const globalAccuracy = sessions.length > 0 
    ? Math.round((sessions.reduce((acc, s) => acc + s.correctAnswers, 0) / sessions.reduce((acc, s) => acc + s.totalQuestions, 0)) * 100)
    : 0;

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsgs = [...messages, { role: "user", text: chatInput }];
    setMessages(newMsgs);
    setChatInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: newMsgs, 
          stats: { sessionsPlayed: sessions.length, accuracy: globalAccuracy } 
        })
      });
      const data = await res.json();
      setMessages([...newMsgs, { role: "model", text: data.reply }]);
    } catch (err) {
      setMessages([...newMsgs, { role: "model", text: "接続エラーが発生しました。再試行してください。" }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
         <h2 className="text-2xl font-bold">学習統計</h2>
         <p className="text-slate-400">ログインすると、学習の進捗データが確認できます。</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>
    );
  }

  return (
    <div className="flex flex-col gap-6 relative">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">学習統計</h1>
        <p className="text-slate-400 mt-1">学習の進捗と分析データを確認します。</p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 flex flex-col items-center justify-center text-center">
          <Target className="w-8 h-8 text-cyan-400 mb-2 opacity-80" />
          <h3 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">正答率</h3>
          <p className="text-3xl justify-center font-mono mt-1 text-cyan-400">{globalAccuracy}%</p>
        </div>
        <div className="glass-panel p-4 flex flex-col items-center justify-center text-center">
          <Trophy className="w-8 h-8 text-purple-400 mb-2 opacity-80" />
          <h3 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">学習回数</h3>
          <p className="text-3xl justify-center font-mono mt-1 text-purple-400">{sessions.length}</p>
        </div>
        <div className="glass-panel p-4 flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1">
          <Clock className="w-8 h-8 text-emerald-400 mb-2 opacity-80" />
          <h3 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">学習時間 (分)</h3>
          <p className="text-3xl justify-center font-mono mt-1 text-emerald-400">
            {sessions.reduce((acc, s) => acc + s.durationMinutes, 0)}
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 h-[300px] flex flex-col relative overflow-hidden">
        <h3 className="font-bold text-[10px] text-slate-500 tracking-widest mb-4 z-10">正答率の推移</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" className="z-10">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(2, 6, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                itemStyle={{ color: '#22d3ee', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="accuracy" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorAcc)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
            <span className="text-sm">データが不足しています。</span>
            <span className="text-xs">テストを完了するとグラフが表示されます。</span>
          </div>
        )}
      </div>

      {/* AI Chat Support Toggle */}
      <button 
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-24 right-4 z-50 p-4 bg-neon-purple/20 border border-neon-purple text-neon-purple rounded-full shadow-[0_0_20px_rgba(188,19,254,0.3)] hover:scale-105 transition-transform"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* AI Chat Panel */}
      <div className={cn("fixed bottom-40 right-4 w-80 max-w-[calc(100vw-2rem)] glass-panel overflow-hidden transition-all duration-300 z-50 flex flex-col shadow-2xl shadow-neon-purple/20", chatOpen ? "h-[450px] opacity-100 translate-y-0" : "h-0 opacity-0 translate-y-10 pointer-events-none")}>
        <div className="bg-white/5 border-b border-white/10 p-4 flex items-center gap-2">
           <Sparkles className="w-5 h-5 text-neon-purple" />
           <h3 className="font-bold text-sm tracking-wider">AI Lingo Assistant</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="text-gray-400 text-sm italic">
              AIアシスタントに学習のアドバイスをもらおう！
            </div>
          )}
          {messages.map((m, i) => (
             <div key={i} className={cn("max-w-[85%] rounded-xl p-3 text-sm", m.role === "user" ? "bg-white/10 self-end" : "bg-neon-purple/20 border border-neon-purple/30 self-start")}>
               {m.text}
             </div>
          ))}
          {isTyping && (
             <div className="bg-neon-purple/10 border border-neon-purple/20 self-start rounded-xl p-3 text-sm flex gap-2 items-center text-neon-purple">
               <Loader2 className="w-4 h-4 animate-spin"/> 解析中...
             </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="p-3 border-t border-white/10">
          <input 
            type="text" 
            placeholder="AIに質問する..." 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-purple transition-colors"
          />
        </form>
      </div>

    </div>
  );
}

