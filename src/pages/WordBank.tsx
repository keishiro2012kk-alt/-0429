import { useState } from "react";
import { type Word } from "../lib/db";
import { useWords } from "../lib/useWords";
import { useAuth } from "../lib/AuthContext";
import { Upload, Plus, Trash2, Search, Loader2, Volume2, Star, X, Download, HardDriveDownload, FileText } from "lucide-react";
import { cn } from "../lib/utils";
import { speak } from "../lib/speech";

export default function WordBank() {
  const { user } = useAuth();
  const { words: allWords, loading, addWord, bulkAddWords, updateWord, deleteWord, deleteBySource } = useWords();
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [filterFav, setFilterFav] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ word: "", translation: "", pos: "noun", example: "", exampleTranslation: "" });

  // ソース一覧
  const sources = Array.from(new Set(allWords.map(w => w.source || "手動追加")));

  // 初回: activeSourceが未設定なら先頭を選ぶ
  const currentSource = activeSource ?? sources[0] ?? null;

  const filteredWords = allWords.filter(w => {
    if ((w.source || "手動追加") !== currentSource) return false;
    if (filterFav && !w.isFavorite) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!w.word.toLowerCase().includes(q) && !w.translation.includes(q)) return false;
    }
    return true;
  });

  const handleAddSubmit = async () => {
    if (!addForm.word || !addForm.translation) return;
    await addWord({
      ...addForm,
      level: "medium",
      addedAt: new Date(),
      correctCount: 0,
      incorrectCount: 0,
      isFavorite: false,
      source: "手動追加",
    });
    setShowAddModal(false);
    setAddForm({ word: "", translation: "", pos: "noun", example: "", exampleTranslation: "" });
  };

  const exportData = async () => {
    if (!allWords || allWords.length === 0) return;
    const blob = new Blob([JSON.stringify(allWords, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lingoai-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          const toAdd = json.map(item => {
            const { id, userId, ...rest } = item;
            return { ...rest, addedAt: rest.addedAt ? new Date(rest.addedAt) : new Date() };
          });
          await bulkAddWords(toAdd);
          alert("データの復元に成功しました！");
        }
      } catch {
        alert("データのパースに失敗しました。");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const fileName = file.name;
    try {
      const res = await fetch("/api/parse-pdf", { method: "POST", body: formData });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = errData?.error?.message || errData?.error || "PDFの解析に失敗しました";
        throw new Error(String(msg));
      }
      const data = await res.json();
      const newWords = data.map((item: any) => ({
        word: item.word, pos: item.pos || "noun", translation: item.translation,
        example: item.example || "", exampleTranslation: item.exampleTranslation || "",
        level: "medium", addedAt: new Date(), correctCount: 0, incorrectCount: 0,
        isFavorite: false, source: fileName,
      }));
      await bulkAddWords(newWords);
      setActiveSource(fileName);
      alert(`「${fileName}」から${newWords.length}件の単語を追加しました！`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (uploading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#060B19]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-t-blue-400 animate-spin" style={{animationDirection:"reverse",animationDuration:"0.8s"}} />
          </div>
          <p className="text-cyan-400 font-bold text-lg tracking-widest animate-pulse">PDFを解析中...</p>
          <p className="text-slate-500 text-sm">AIが単語を抽出しています。</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <p className="text-slate-400">ログインして単語データを管理しましょう。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">単語帳</h1>
        <p className="text-slate-400 mt-1 text-sm">PDFごとに管理できます。</p>
      </header>

      {/* アクションボタン */}
      <div className="flex flex-col sm:flex-row gap-3">
        <label className={cn("flex-1 cursor-pointer px-5 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl font-bold uppercase tracking-widest text-xs text-white shadow-[0_10px_30px_-10px_rgba(37,99,235,0.5)] hover:opacity-90 transition flex justify-center items-center gap-2", uploading && "opacity-50 pointer-events-none")}>
          <Upload className="w-4 h-4" /> PDF読取
          <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
        </label>
        <label className="flex-1 cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-300 tracking-widest flex items-center justify-center gap-2 transition">
          <HardDriveDownload className="w-4 h-4" /> バックアップ読込
          <input type="file" accept="application/json" className="hidden" onChange={importData} />
        </label>
        <button onClick={exportData} className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-300 tracking-widest flex items-center justify-center gap-2 transition">
          <Download className="w-4 h-4" /> 保存 (JSON)
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400" /></div>
      ) : sources.length === 0 ? (
        <div className="text-center py-10 text-gray-500">データがありません。PDFをアップロードして始めてください。</div>
      ) : (
        <>
          {/* PDFタブ */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {sources.map(src => {
              const count = allWords.filter(w => (w.source || "手動追加") === src).length;
              const isActive = src === currentSource;
              return (
                <button
                  key={src}
                  onClick={() => { setActiveSource(src); setSearch(""); setFilterFav(false); }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold whitespace-nowrap transition-all flex-shrink-0",
                    isActive
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                      : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                  )}
                >
                  <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="max-w-[140px] truncate">{src}</span>
                  <span className={cn("px-1.5 py-0.5 rounded-full text-[10px]", isActive ? "bg-cyan-500/20 text-cyan-300" : "bg-white/10 text-slate-500")}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* 検索・フィルター・追加 */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="検索..." className="input-glass pl-10 text-sm py-3" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button
              className={cn("px-4 rounded-xl border transition text-xs font-bold flex items-center gap-1.5", filterFav ? "border-purple-500 bg-purple-500/20 text-purple-400" : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")}
              onClick={() => setFilterFav(!filterFav)}
            >
              <Star className={cn("w-4 h-4", filterFav && "fill-current")} />
            </button>
            <button
              className="px-4 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs font-bold flex items-center gap-1.5 transition"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4" />
            </button>
            {currentSource && currentSource !== "手動追加" && (
              <button
                onClick={() => { if (confirm(`「${currentSource}」の単語をすべて削除しますか？`)) deleteBySource(currentSource); }}
                className="px-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 単語リスト */}
          <div className="glass-panel overflow-hidden">
            {filteredWords.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">該当する単語がありません</div>
            ) : (
              <ul className="flex flex-col divide-y divide-white/5">
                {filteredWords.map(w => (
                  <li key={w.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-slate-100">{w.word}</span>
                        <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 bg-white/5 border border-white/10 rounded-full text-slate-400">{w.pos}</span>
                      </div>
                      <p className="text-slate-300 mt-1">{w.translation}</p>
                      <div className="mt-2 text-sm bg-black/40 border border-white/5 rounded-xl p-3 relative group">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">Example</p>
                        <div className="flex items-start gap-2">
                          <p className="italic text-cyan-400 flex-1">{w.example}</p>
                          <button onClick={() => speak(w.example)} className="opacity-0 group-hover:opacity-100 p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition">
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-slate-400 text-xs mt-1">{w.exampleTranslation}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => speak(w.word)} className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition"><Volume2 className="w-4 h-4" /></button>
                      <button onClick={() => updateWord(w.id!, { isFavorite: !w.isFavorite })} className={cn("p-2.5 rounded-xl border transition", w.isFavorite ? "border-purple-500/50 bg-purple-500/20 text-purple-400" : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")}>
                        <Star className={cn("w-4 h-4", w.isFavorite && "fill-current")} />
                      </button>
                      <button onClick={() => deleteWord(w.id as string)} className="p-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md p-6 flex flex-col gap-4 border-cyan-500/30">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">単語を手動追加</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <input className="input-glass text-sm py-3" placeholder="英単語 (例: apple)" value={addForm.word} onChange={e => setAddForm({...addForm, word: e.target.value})} />
            <input className="input-glass text-sm py-3" placeholder="日本語訳 (例: りんご)" value={addForm.translation} onChange={e => setAddForm({...addForm, translation: e.target.value})} />
            <input className="input-glass text-sm py-3" placeholder="品詞 (例: noun)" value={addForm.pos} onChange={e => setAddForm({...addForm, pos: e.target.value})} />
            <textarea className="input-glass text-sm py-3 h-20 resize-none" placeholder="例文" value={addForm.example} onChange={e => setAddForm({...addForm, example: e.target.value})} />
            <textarea className="input-glass text-sm py-3 h-20 resize-none" placeholder="例文の訳" value={addForm.exampleTranslation} onChange={e => setAddForm({...addForm, exampleTranslation: e.target.value})} />
            <button className="btn-neon w-full justify-center mt-2" onClick={handleAddSubmit}>追加する</button>
          </div>
        </div>
      )}
    </div>
  );
}
