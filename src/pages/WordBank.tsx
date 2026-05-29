import { useState } from "react";
import { type Word } from "../lib/db";
import { useWords } from "../lib/useWords";
import { useAuth } from "../lib/AuthContext";
import { Upload, Plus, Trash2, Search, Loader2, Volume2, Star, X, Download, HardDriveDownload, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { cn } from "../lib/utils";
import { speak } from "../lib/speech";

export default function WordBank() {
  const { user } = useAuth();
  const { words: allWords, loading, addWord, bulkAddWords, updateWord, deleteWord, deleteBySource } = useWords();
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [filterFav, setFilterFav] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [collapsedSources, setCollapsedSources] = useState<Set<string>>(new Set());
  const [addForm, setAddForm] = useState({ word: "", translation: "", pos: "noun", example: "", exampleTranslation: "" });

  const filteredWords = allWords.filter(w => {
    let matches = true;
    if (search) {
      const lowerSearch = search.toLowerCase();
      matches = w.word.toLowerCase().includes(lowerSearch) || w.translation.includes(lowerSearch);
    }
    if (filterFav && !w.isFavorite) matches = false;
    return matches;
  });

  // PDFソースごとにグループ化
  const grouped: { source: string; words: typeof filteredWords }[] = [];
  const sourceMap = new Map<string, typeof filteredWords>();
  for (const w of filteredWords) {
    const src = w.source || "手動追加";
    if (!sourceMap.has(src)) sourceMap.set(src, []);
    sourceMap.get(src)!.push(w);
  }
  for (const [source, words] of sourceMap) {
    grouped.push({ source, words });
  }

  const toggleCollapse = (source: string) => {
    setCollapsedSources(prev => {
      const next = new Set(prev);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });
  };

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
      } catch (err) {
        alert("データのパースに失敗しました。無効なファイルです。");
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
      const res = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = errData?.error?.message || errData?.error || "PDFの解析に失敗しました";
        // 503エラーの場合はわかりやすいメッセージに
        if (errData?.error?.code === 503 || String(msg).includes("503") || String(msg).includes("high demand")) {
          throw new Error("Gemini AIが混雑しています。少し待ってからもう一度お試しください。");
        }
        throw new Error(String(msg));
      }

      const data = await res.json();
      const newWords = data.map((item: any) => ({
        word: item.word,
        pos: item.pos || "noun",
        translation: item.translation,
        example: item.example || "",
        exampleTranslation: item.exampleTranslation || "",
        level: "medium",
        addedAt: new Date(),
        correctCount: 0,
        incorrectCount: 0,
        isFavorite: false,
        source: fileName,
      }));

      await bulkAddWords(newWords);
      alert(`「${fileName}」から${newWords.length}件の単語を追加しました！`);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id?: string) => {
    if (id) await deleteWord(id);
  };

  const handleDeleteSource = async (source: string) => {
    if (confirm(`「${source}」の単語をすべて削除しますか？`)) {
      await deleteBySource(source);
    }
  };

  if (uploading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#060B19]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-t-blue-400 animate-spin" style={{animationDirection: "reverse", animationDuration: "0.8s"}} />
          </div>
          <div className="text-center">
            <p className="text-cyan-400 font-bold text-lg tracking-widest animate-pulse">PDFを解析中...</p>
            <p className="text-slate-500 text-sm mt-2">AIが単語を抽出しています。しばらくお待ちください。</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <h2 className="text-2xl font-bold">単語帳</h2>
        <p className="text-slate-400">ログインして単語データを管理しましょう。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="mb-4">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">データコア</h1>
        <p className="text-slate-400 mt-2 text-sm max-w-lg">登録された単語のデータベースです。PDFごとに管理できます。</p>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <label className={cn("flex-1 text-center cursor-pointer relative px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl font-bold uppercase tracking-widest text-xs text-white shadow-[0_10px_30px_-10px_rgba(37,99,235,0.5)] hover:scale-[1.02] transition-transform border-none outline-none flex justify-center items-center", uploading && "opacity-50 pointer-events-none transform-none hover:scale-100 hover:shadow-none")}>
          {uploading ? <Loader2 className="w-5 h-5 inline-block mr-2 animate-spin" /> : <Upload className="w-5 h-5 inline-block mr-2" />}
          {uploading ? " PDFを解析中..." : " PDF読取開始 (OCR対応)"}
          <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
        </label>

        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <label className="flex-1 text-center cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl p-4 text-xs font-bold text-slate-300 tracking-widest flex items-center justify-center transition-colors">
            <HardDriveDownload className="w-4 h-4 mr-2" />
            バックアップ読込
            <input type="file" accept="application/json" className="hidden" onChange={importData} />
          </label>
          <button onClick={exportData} className="flex-1 text-center bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl p-4 text-xs font-bold text-slate-300 tracking-widest flex items-center justify-center transition-colors">
            <Download className="w-4 h-4 mr-2" />
            保存 (JSON)
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mt-2">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="検索..."
            className="input-glass pl-14 font-mono text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className={cn("px-4 py-4 rounded-2xl border transition-all text-xs font-bold tracking-widest flex items-center justify-center gap-2 flex-1 md:flex-none", filterFav ? "bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]" : "bg-black/40 border-white/10 text-slate-400 hover:bg-white/5")} onClick={() => setFilterFav(!filterFav)}>
            <Star className={cn("w-4 h-4", filterFav && "fill-current")} /> お気に入り
          </button>
          <button className="px-4 py-4 rounded-2xl border border-cyan-500/50 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-all flex-1 md:flex-none" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" /> 手持追加
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400" /></div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          データがありません。PDFをアップロードして始めてください。
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(({ source, words }) => (
            <div key={source} className="glass-panel overflow-hidden">
              {/* グループヘッダー */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <button
                  className="flex items-center gap-3 flex-1 text-left"
                  onClick={() => toggleCollapse(source)}
                >
                  <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-bold text-slate-200 text-sm truncate">{source}</span>
                  <span className="text-xs text-slate-500 shrink-0">{words.length}件</span>
                  {collapsedSources.has(source)
                    ? <ChevronDown className="w-4 h-4 text-slate-500 ml-auto shrink-0" />
                    : <ChevronUp className="w-4 h-4 text-slate-500 ml-auto shrink-0" />
                  }
                </button>
                <button
                  onClick={() => handleDeleteSource(source)}
                  className="ml-4 p-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition shrink-0"
                  title="このPDFの単語をすべて削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* 単語リスト */}
              {!collapsedSources.has(source) && (
                <ul className="flex flex-col divide-y divide-white/5">
                  {words.map((w) => (
                    <li key={w.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold text-slate-100">{w.word}</span>
                          <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 bg-white/5 border border-white/10 rounded-full text-slate-400 shadow-inner">{w.pos}</span>
                        </div>
                        <p className="text-slate-300 mt-2">{w.translation}</p>
                        <div className="mt-3 text-sm text-slate-400 bg-black/40 border border-white/5 rounded-xl p-4 shadow-inner relative group">
                          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 border-b border-white/5 pb-2 mb-2">例文 / Example</p>
                          <div className="flex items-start gap-2">
                            <p className="italic text-cyan-400 mb-1 flex-1">{w.example}</p>
                            <button onClick={() => speak(w.example)} className="opacity-0 group-hover:opacity-100 p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition backdrop-blur-md">
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p>{w.exampleTranslation}</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
                        <button onClick={() => speak(w.word)} className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition backdrop-blur-md">
                          <Volume2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => updateWord(w.id!, { isFavorite: !w.isFavorite })} className={cn("p-3 rounded-xl transition border backdrop-blur-md", w.isFavorite ? "border-purple-500/50 bg-purple-500/20 text-purple-400" : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")}>
                          <Star className={cn("w-5 h-5", w.isFavorite && "fill-current")} />
                        </button>
                        <button onClick={() => handleDelete(w.id as string)} className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition backdrop-blur-md">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 border-cyan-500/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold tracking-tight text-white">単語を手動追加</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition"><X className="w-6 h-6" /></button>
            </div>
            <input className="input-glass text-sm py-3" placeholder="英単語 (例: apple)" value={addForm.word} onChange={(e) => setAddForm({ ...addForm, word: e.target.value })} />
            <input className="input-glass text-sm py-3" placeholder="日本語訳 (例: りんご)" value={addForm.translation} onChange={(e) => setAddForm({ ...addForm, translation: e.target.value })} />
            <input className="input-glass text-sm py-3" placeholder="品詞 (例: noun)" value={addForm.pos} onChange={(e) => setAddForm({ ...addForm, pos: e.target.value })} />
            <textarea className="input-glass text-sm py-3 h-24 resize-none" placeholder="例文 (例: I ate an apple.)" value={addForm.example} onChange={(e) => setAddForm({ ...addForm, example: e.target.value })} />
            <textarea className="input-glass text-sm py-3 h-24 resize-none" placeholder="例文の訳 (例: 私はりんごを食べた。)" value={addForm.exampleTranslation} onChange={(e) => setAddForm({ ...addForm, exampleTranslation: e.target.value })} />
            <button className="btn-neon w-full justify-center mt-2" onClick={handleAddSubmit}>追加する</button>
          </div>
        </div>
      )}
    </div>
  );
}
