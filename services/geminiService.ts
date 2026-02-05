import { GoogleGenAI, Type } from "@google/genai";
import { Message, Intelligence } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SCAM_DETECTION_MODEL = "gemini-3-flash-preview";
const AGENT_MODEL = "gemini-3-flash-preview";
const EXTRACTION_MODEL = "gemini-3-flash-preview";

// Helper to clean JSON string if model adds markdown formatting
const cleanJson = (text: string) => {
  return text.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
};

const formatHistory = (history: Message[]) => {
  return history.map((m) => {
    const time = new Date(m.timestamp).toLocaleTimeString();
    return `[${time}] ${m.sender}: ${m.text}`;
  }).join("\n");
};

/**
 * Analyzes a message to determine if it is a scam.
 */
export const detectScamIntent = async (
  currentMessage: string,
  history: Message[]
): Promise<{ isScam: boolean; confidence: number; reason: string }> => {
  try {
    const historyText = formatHistory(history);
    const prompt = `
      You are an expert cybersecurity analyst. Analyze the following incoming message and conversation history for scam intent (phishing, fraud, social engineering).
      
      Conversation History:
      ${historyText}
      
      Incoming Message: "${currentMessage}"
      
      Return a JSON object with:
      - isScam: boolean
      - confidence: number (0-100)
      - reason: string (brief explanation)
    `;

    const response = await ai.models.generateContent({
      model: SCAM_DETECTION_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isScam: { type: Type.BOOLEAN },
            confidence: { type: Type.NUMBER },
            reason: { type: Type.STRING },
          },
          required: ["isScam", "confidence", "reason"],
        },
      },
    });

    if (response.text) {
        return JSON.parse(cleanJson(response.text));
    }
    throw new Error("Empty response from scam detection");
  } catch (error) {
    console.error("Scam detection error:", error);
    return { isScam: false, confidence: 0, reason: "Error in analysis or API connectivity." };
  }
};

/**
 * Generates a response from the Agentic Honey-Pot persona.
 */
export const generateAgentReply = async (
  currentMessage: string,
  history: Message[]
): Promise<string> => {
  try {
    const historyText = formatHistory(history);
    
    // System instruction for the persona
    const systemInstruction = `
      You are an Agentic Honey-Pot designed to waste a scammer's time and extract their payment details (UPI, Bank Account) or malicious links.
      
      Persona: "Ramesh", a retired Indian gentleman (60+ years old). You are polite, slightly confused by modern technology, and worried about your pension/savings. You speak Indian English (using terms like "kindly", "please do the needful", "beta", "my son handles this usually"). 
      
      Objectives:
      1. Keep the conversation going (stall).
      2. Do NOT reveal you are an AI.
      3. Subtly guide them to share their UPI ID, Bank Account Number, or a Link so you can "verify" or "send money".
      4. Respond in a natural, human-like way. Short to medium length.
    `;

    const prompt = `
      Conversation History:
      ${historyText}
      
      Scammer says: "${currentMessage}"
      
      Generate the next reply as Ramesh.
    `;

    const response = await ai.models.generateContent({
      model: AGENT_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "...";
  } catch (error) {
    console.error("Agent reply error:", error);
    return "Hello? I am not understanding. Please explain clearly.";
  }
};

/**
 * Extracts intelligence from the conversation history.
 */
export const extractIntelligence = async (
  history: Message[]
): Promise<{ intelligence: Intelligence; notes: string }> => {
  try {
    const historyText = formatHistory(history);
    const prompt = `
      Analyze the entire conversation below between a scammer and a user/agent.
      Extract all actionable intelligence used by the scammer.
      
      Conversation:
      ${historyText}
      
      Return a JSON object with:
      - bankAccounts: array of strings (patterns resembling account numbers)
      - upiIds: array of strings (e.g., name@bank)
      - phishingLinks: array of strings (http/https links)
      - phoneNumbers: array of strings
      - suspiciousKeywords: array of strings (e.g., "urgent", "block", "kyc")
      - agentNotes: string (A summary of the scammer's tactics and behavior)
    `;

    const response = await ai.models.generateContent({
      model: EXTRACTION_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bankAccounts: { type: Type.ARRAY, items: { type: Type.STRING } },
            upiIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            phishingLinks: { type: Type.ARRAY, items: { type: Type.STRING } },
            phoneNumbers: { type: Type.ARRAY, items: { type: Type.STRING } },
            suspiciousKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            agentNotes: { type: Type.STRING },
          },
        },
      },
    });

    if (response.text) {
        const data = JSON.parse(cleanJson(response.text));
        return {
            intelligence: {
                bankAccounts: data.bankAccounts || [],
                upiIds: data.upiIds || [],
                phishingLinks: data.phishingLinks || [],
                phoneNumbers: data.phoneNumbers || [],
                suspiciousKeywords: data.suspiciousKeywords || [],
            },
            notes: data.agentNotes || "No notes generated.",
        };
    }
    throw new Error("Empty response from extraction");
  } catch (error) {
    console.error("Intelligence extraction error:", error);
    return {
        intelligence: {
            bankAccounts: [],
            upiIds: [],
            phishingLinks: [],
            phoneNumbers: [],
            suspiciousKeywords: [],
        },
        notes: "Extraction failed.",
    };
  }
};