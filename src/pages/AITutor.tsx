import { useState, useRef, useEffect } from "react";
import { MessageSquare, Loader2, Send, Sparkles, Mic } from "lucide-react";
import { cn } from "../lib/utils";
import { aiFetch } from "../lib/aiClient";

export default function AITutor() {
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const newMsgs = [...messages, { role: "user", text: chatInput }];
    setMessages(newMsgs);
    setChatInput("");
    setIsTyping(true);

    try {
      const data = await aiFetch("/api/general-chat", { messages: newMsgs });
      setMessages([...newMsgs, { role: "model", text: data.reply }]);
    } catch (err: any) {
      console.error(err);
      setMessages([...newMsgs, { role: "model", text: `エラーが発生しました: ${err.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startListening = () => {
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      alert("お使いのブラウザは音声入力に対応していません。(Chrome/Safari推奨)");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; // Can be changed based on need
    recognition.interimResults = false;
    
    recognition.onstart = () => setListening(true);
    recognition.onresult = (e: any) => {
       const transcript = e.results[0][0].transcript;
       setChatInput(chatInput + " " + transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    
    recognition.start();
  };

  return (
    <div className="flex flex-col h-[75vh] max-h-full">
      <header className="mb-4 flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-neon-purple" />
        <h1 className="text-2xl font-bold tracking-tight">AI 英会話チューター</h1>
      </header>

      <div className="glass-panel flex flex-col flex-1 overflow-hidden relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 gap-4 opacity-70">
              <MessageSquare className="w-16 h-16 text-neon-purple" />
              <p>Hello! 英語で話しかけるか、文法について質問してください。</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div 
              key={i} 
              className={cn(
                "max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm sm:text-base leading-relaxed break-words", 
                m.role === "user" 
                  ? "bg-white/10 self-end text-right border border-white/5" 
                  : "bg-neon-purple/10 border border-neon-purple/30 self-start text-left"
              )}
            >
              {m.text}
            </div>
          ))}

          {isTyping && (
             <div className="bg-neon-purple/10 border border-neon-purple/20 self-start rounded-2xl p-4 text-sm flex gap-3 items-center text-neon-purple">
               <Loader2 className="w-5 h-5 animate-spin"/> AIが入力中...
             </div>
          )}
        </div>

        <div className="p-4 bg-black/40 border-t border-white/10 backdrop-blur-md">
          <form onSubmit={sendMessage} className="flex gap-2">
            <button 
                type="button" 
                onClick={startListening} 
                className={cn("p-4 rounded-xl transition flex items-center justify-center border border-white/10 shadow-sm", listening ? "text-red-400 bg-red-400/20 animate-pulse border-red-500/50" : "text-slate-400 hover:text-white bg-white/5 hover:bg-white/10" )}
            >
                <Mic className="w-5 h-5" />
            </button>
            <input 
              type="text" 
              placeholder="メッセージを入力..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/50 transition-all text-white placeholder:text-slate-500"
            />
            <button 
              type="submit"
              disabled={!chatInput.trim() || isTyping}
              className="p-4 bg-neon-purple text-white rounded-xl hover:bg-neon-purple/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-[0_0_15px_rgba(188,19,254,0.4)]"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
