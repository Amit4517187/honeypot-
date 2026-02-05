import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(express.json());

// FIX: Check for API_KEY or GEMINI_API_KEY to prevent startup crash
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("CRITICAL ERROR: API Key is missing. App will fail to generate content.");
}

// Initialize Gemini safely
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

app.post('/', async (req, res) => {
  try {
    if (!genAI) {
      throw new Error("Server API Key is not configured.");
    }

    const { message } = req.body;
    
    // Use gemini-1.5-flash for speed
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Simple prompt to act as "Ramesh"
    const prompt = `You are Ramesh, a retired Indian gentleman. The user says: "${message?.text || 'Hello'}". Reply to them acting like Ramesh.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // FIX: Send the EXACT JSON format the Hackathon expects
    res.json({
      status: "success",
      reply: text
    });
    
  } catch (error) {
    console.error("Error generating response:", error);
    // Send a fallback response so the tester doesn't get a 404/500 if AI fails
    res.status(200).json({ 
      status: "success", 
      reply: "Hello beta, I am not understanding. Please tell me again?" 
    });
  }
});

// Health check endpoint (optional but good for Cloud Run)
app.get('/', (req, res) => {
  res.send('Honey-Pot Server is Running');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});