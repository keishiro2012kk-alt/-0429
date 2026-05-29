import { useState, useEffect, useCallback } from "react";
import { db, type Word } from "./db";

export function useWords() {
  const [words, setWords] = useState<(Word & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWords = useCallback(async () => {
    try {
      const all = await db.words.orderBy("addedAt").toArray();
      setWords(all.map(w => ({ ...w, id: String(w.id) })));
    } catch (e) {
      console.error("Failed to load words:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  const addWord = async (wordData: Omit<Word, "id">) => {
    await db.words.add({ ...wordData, addedAt: new Date() });
    await loadWords();
  };

  const bulkAddWords = async (wordsData: Omit<Word, "id">[]) => {
    await db.words.bulkAdd(wordsData.map(w => ({ ...w, addedAt: new Date() })));
    await loadWords();
  };

  const updateWord = async (id: string, data: Partial<Word>) => {
    await db.words.update(Number(id), data);
    await loadWords();
  };

  const deleteWord = async (id: string) => {
    await db.words.delete(Number(id));
    await loadWords();
  };

  const deleteBySource = async (source: string) => {
    const all = await db.words.toArray();
    const ids = all
      .filter(w => (w.source || "手動追加") === source)
      .map(w => w.id!)
      .filter(Boolean);
    await db.words.bulkDelete(ids);
    await loadWords();
  };

  return { words, loading, addWord, bulkAddWords, updateWord, deleteWord, deleteBySource };
}
