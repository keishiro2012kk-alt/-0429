import { useState, useEffect } from "react";
import { db, type StudySession } from "./db";

export function useSessions() {
  const [sessions, setSessions] = useState<(StudySession & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    const all = await db.sessions.orderBy("date").reverse().toArray();
    setSessions(all.map(s => ({ ...s, id: String(s.id) })));
    setLoading(false);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const addSession = async (sessionData: Omit<StudySession, "id">) => {
    await db.sessions.add({ ...sessionData, date: new Date() });
    await loadSessions();
  };

  return { sessions, loading, addSession };
}
