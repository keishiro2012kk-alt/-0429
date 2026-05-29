"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const genai_1 = require("@google/genai");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
let ai = null;
function getAI() {
    if (!ai) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not set.");
        }
        ai = new genai_1.GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: {
                headers: {
                    'User-Agent': 'aistudio-build',
                }
            }
        });
    }
    return ai;
}
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
});
app.post("/api/parse-pdf", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
    }
    try {
        const base64EncodeString = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype || "application/pdf";
        const response = await getAI().models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    inlineData: {
                        mimeType,
                        data: base64EncodeString
                    }
                },
                "Extract all important English learning vocabulary from this document. Respond with a JSON array of objects. Each object should have 'word' (the english word or phrase), 'pos' (part of speech), 'translation' (Japanese translation), and 'example' (an English example sentence), and 'exampleTranslation' (Japanese translation of the example)."
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: genai_1.Type.ARRAY,
                    items: {
                        type: genai_1.Type.OBJECT,
                        properties: {
                            word: { type: genai_1.Type.STRING },
                            pos: { type: genai_1.Type.STRING, description: "Part of speech (e.g. noun, verb, adjective)" },
                            translation: { type: genai_1.Type.STRING },
                            example: { type: genai_1.Type.STRING },
                            exampleTranslation: { type: genai_1.Type.STRING }
                        },
                        required: ["word", "pos", "translation", "example", "exampleTranslation"]
                    }
                }
            }
        });
        try {
            const json = JSON.parse(response.text || "[]");
            res.json(json);
        }
        catch (e) {
            console.error("JSON Parse Error:", e);
            res.json([]);
        }
    }
    catch (error) {
        console.error("PDF Parsing error:", error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});
app.post("/api/generate-quiz", async (req, res) => {
    const { mode, data, count = 10 } = req.body;
    let prompt = "";
    if (mode === "grammar") {
        prompt = `Create ${count} typing-based English quiz questions focusing on the grammar topic: "${data}". Format as "fill_in_blank". Make questionText the Japanese translation, and subText the English sentence containing (     ) where the answer belongs. User must type the answer. Return a JSON array.`;
    }
    else {
        const words = data.map((w) => w.word).join(", ");
        prompt = `Create ${count} typing-based English quiz questions using these words: ${words}. Mix different types of questions (en->ja, ja->en, fill_in_blank, ordering). User must type the answer. Return a JSON array.`;
    }
    try {
        const response = await getAI().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: genai_1.Type.ARRAY,
                    items: {
                        type: genai_1.Type.OBJECT,
                        properties: {
                            type: { type: genai_1.Type.STRING, description: "One of: en_to_ja, ja_to_en, fill_in_blank, ordering, grammar" },
                            questionText: { type: genai_1.Type.STRING, description: "The main text or Japanese translation." },
                            subText: { type: genai_1.Type.STRING, description: "For fill_in_blank, the English sentence with (     ). Optional." },
                            correctAnswer: { type: genai_1.Type.STRING, description: "The exact string the user needs to type" },
                            hint: { type: genai_1.Type.STRING, description: "A small hint keep empty if not needed" },
                        },
                        required: ["type", "questionText", "correctAnswer"]
                    }
                }
            }
        });
        try {
            const json = JSON.parse(response.text || "[]");
            res.json(json);
        }
        catch (e) {
            res.json([]);
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post("/api/chat", async (req, res) => {
    const { messages, stats } = req.body;
    const systemInstruction = `You are a futuristic, encouraging AI study assistant natively integrated into "LingoAI". 
User stats: ${JSON.stringify(stats)}. 
Provide short, punchy, neon-cyberpunk flavored encouragement and highly actionable study advice directly in Japanese.`;
    try {
        const chat = getAI().chats.create({
            model: "gemini-2.5-flash",
            config: { systemInstruction }
        });
        if (messages && messages.length > 0) {
            const promptContext = messages.map((m) => `${m.role}: ${m.text}`).join("\n");
            const response = await chat.sendMessage({ message: promptContext + "\n\nRespond to the last user message." });
            res.json({ reply: response.text });
        }
        else {
            res.json({ reply: "データを受信できませんでした。" });
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post("/api/grammar-check", async (req, res) => {
    try {
        const { text } = req.body;
        const systemInstruction = `You are a strict but helpful native English teacher. 
The user will give you a sentence. You must correct any grammatical mistakes and make it sound natural.
Explain the corrections in Japanese.`;
        const result = await getAI().models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Check this sentence: "${text}"`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: genai_1.Type.OBJECT,
                    properties: {
                        corrected: { type: genai_1.Type.STRING, description: "The corrected, natural English sentence" },
                        explanation: { type: genai_1.Type.STRING, description: "Detailed explanation in Japanese describing what was requested, why it was wrong, and nuance" },
                    },
                    required: ["corrected", "explanation"]
                },
                temperature: 0.2
            }
        });
        res.json(JSON.parse(result.text || "{}"));
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});
app.post("/api/reading-practice", async (req, res) => {
    try {
        const { words } = req.body;
        const wordList = words.map((w) => w.word).join(", ");
        const systemInstruction = `You are an English reading comprehension generator. 
Create a short, engaging story or article (about 150-200 words) that naturally includes all of the following English words: ${wordList}.
Also generate 3 reading comprehension questions about the passage.`;
        const result = await getAI().models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Generate a reading passage and 3 comprehension questions, plus their answers.",
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: genai_1.Type.OBJECT,
                    properties: {
                        title: { type: genai_1.Type.STRING, description: "Title of the passage" },
                        passage: { type: genai_1.Type.STRING, description: "The English passage containing the target words" },
                        translation: { type: genai_1.Type.STRING, description: "The Japanese translation of the entire passage" },
                        questions: {
                            type: genai_1.Type.ARRAY,
                            items: {
                                type: genai_1.Type.OBJECT,
                                properties: {
                                    question: { type: genai_1.Type.STRING, description: "Reading comprehension question in English" },
                                    options: {
                                        type: genai_1.Type.ARRAY,
                                        items: { type: genai_1.Type.STRING }
                                    },
                                    correctAnswer: { type: genai_1.Type.STRING, description: "The exact correct option from the options array" },
                                    explanation: { type: genai_1.Type.STRING, description: "Explanation of the correct answer in Japanese" }
                                },
                                required: ["question", "options", "correctAnswer", "explanation"]
                            }
                        }
                    },
                    required: ["title", "passage", "translation", "questions"]
                },
            }
        });
        res.json(JSON.parse(result.text || "{}"));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post("/api/general-chat", async (req, res) => {
    try {
        const { messages } = req.body;
        const systemInstruction = `You are a friendly, encouraging native English tutor named Lingo.
Your primary role is to help the user practice English conversation or answer their questions about grammar/vocabulary.
If the user asks a question in Japanese, answer in Japanese but provide English examples.
If the user speaks in English, reply in natural, easy-to-understand English.
Correct their English naturally in the conversation if they make obvious mistakes.`;
        const chat = getAI().chats.create({
            model: "gemini-2.5-flash",
            config: { systemInstruction }
        });
        const promptContext = messages.map((m) => `${m.role}: ${m.text}`).join("\n");
        const response = await chat.sendMessage({ message: promptContext + "\n\nProvide the next natural response as the AI Tutor." });
        res.json({ reply: response.text });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map