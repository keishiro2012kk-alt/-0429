import { GoogleGenAI } from '@google/genai';

const API_KEY_STORAGE_KEY = 'gemini_api_key_fallback';

export function getStoredApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}

export function promptForApiKey(): string | null {
  const key = prompt('バックエンドのAI機能にアクセスできませんでした。\nブラウザで直接AIを実行するため、Gemini APIキーを入力してください：\n(Google AI Studioから無料で取得できます)');
  if (key && key.trim()) {
    localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    return key.trim();
  }
  return null;
}

export function clearApiKey() {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

export async function aiFetch(endpoint: string, payload: any): Promise<any> {
  // Try backend first if no API key is forcefully set
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      return await res.json();
    }
    
    // If backend is not found (404), fallback to client side
    if (res.status !== 404) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }
  } catch (err: any) {
    if (err.message !== "Failed to fetch" && !err.message.includes("404")) {
      throw err;
    }
  }

  // Fallback to client side processing
  console.warn("Backend not available, falling back to client-side AI.");
  
  let apiKey = getStoredApiKey() || promptForApiKey();
  if (!apiKey) {
    throw new Error("AIを使用するには、Gemini APIキーが必要です。");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    if (endpoint === '/api/grammar-check') {
      const systemInstruction = `You are a helpful English teacher. 
The user will give you a sentence. You must correct any grammatical mistakes and make it sound natural.
Explain the corrections in Japanese.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Check this sentence: "${payload.text}"`,
        config: { systemInstruction }
      });
      
      const responseText = response.text || "";
      const correctedMatch = responseText.match(/\*\*Corrected:\*\*\s*(.+)/i) || responseText.match(/Corrected:\s*(.+)/i);
      const explanationMatch = responseText.match(/\*\*Explanation:\*\*\s*([\s\S]+)/i) || responseText.match(/Explanation:\s*([\s\S]+)/i);

      let corrected = payload.text;
      let explanation = responseText;

      if (correctedMatch) {
         corrected = correctedMatch[1].trim();
      } else {
         const lines = responseText.split('\n');
         if (lines.length > 0) corrected = lines[0].replace(/['"]/g, '').trim();
      }
      
      if (explanationMatch) explanation = explanationMatch[1].trim();

      return { corrected, explanation };
    }
    
    if (endpoint === '/api/general-chat') {
      const systemInstruction = `You are an English tutor for a Japanese speaker.
Keep your answers brief, encouraging, and easy to understand.
If the user speaks in Japanese, reply in simple English and explain if necessary.
If the user speaks in English, reply in natural, easy-to-understand English.
Correct their English naturally in the conversation if they make obvious mistakes.`;

      // Simplified chat simulation without keeping exact history since GoogleGenAI client needs a proper ChatSession,
      // but for fallback we just send the whole history as prompt.
      const contents = payload.messages.map((m: any) => ({
         role: m.role === 'user' ? 'user' : 'model',
         parts: [{ text: m.text }]
      }));
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: { systemInstruction }
      });
      
      return { reply: response.text };
    }
    
    if (endpoint === '/api/reading-practice') {
      const systemInstruction = `You are an English teacher generating reading comprehension exercises.
Create a short, engaging story or article (about 150-200 words) that naturally includes all of the following English words: ${payload.wordList}.
Also generate 3 reading comprehension questions about the passage.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Generate a reading passage and 3 comprehension questions, plus their answers.",
        config: { systemInstruction }
      });
      
      return { content: response.text };
    }

    throw new Error("Unknown endpoint for fallback");
  } catch (err: any) {
    if (err.message.includes("API key not valid")) {
      clearApiKey();
      throw new Error("APIキーが無効です。もう一度お試しください。");
    }
    throw err;
  }
}
