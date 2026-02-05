import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(express.json());

// Using standard API_KEY env variable
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    // Using flash model for fast responses
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Simple prompt to act as "Ramesh"
    const prompt = `You are Ramesh, a retired Indian gentleman. Respond to this: ${message.text}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    res.json({
      status: "success",
      reply: response.text()
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});