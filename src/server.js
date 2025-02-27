import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to clean up the response text
function cleanupResponse(text) {
    // Remove asterisks and use natural emphasis
    text = text.replace(/\*\*(.*?)\*\*/g, '$1');
    
    // Clean up quotes
    text = text.replace(/['']CDP['']|['']how-to['']|['']unified customer profile['']|['']identity resolution['']|['']Data Cloud['']|['']Steps['']|['']Data Integration['']|['']Data Enhancement['']|['']Data Activation['']|['']Data Governance['']|['']Data Privacy['']|['']Data Security['']|['']Data Quality['']|['']Data Enrichment['']|['']Data Analytics['']|['']Data Visualization['']|['']Data Management['']|['']Data Orchestration['']|['']Data Transformation['']|['']Data Validation['']|['']Data Cleansing['']|['']Data Standardization['']|['']Data Normalization['']|['']Data Deduplication['']|['']Data Consolidation['']|['']Data Synchronization['']|['']Data Migration['']|['']Data Integration['']|['']Data Activation['']|['']Data Enhancement['']|['']Data Governance['']|['']Data Privacy['']|['']Data Security['']|['']Data Quality['']|['']Data Enrichment['']|['']Data Analytics['']|['']Data Visualization['']|['']Data Management['']|['']Data Orchestration['']|['']Data Transformation['']|['']Data Validation['']|['']Data Cleansing['']|['']Data Standardization['']|['']Data Normalization['']|['']Data Deduplication['']|['']Data Consolidation['']|['']Data Synchronization['']|['']Data Migration['']/, (match) => match.replace(/['']/g, ''));
    
    // Add proper formatting for key terms
    text = text.replace(/\b(Segment|mParticle|Lytics|Zeotap)\b/g, '<strong>$1</strong>');
    
    // Clean up extra spaces and line breaks
    text = text.replace(/\s+/g, ' ').trim();
    text = text.replace(/\n\s*\n/g, '\n');
    
    // Format numbered lists better
    text = text.replace(/(\d+\.\s)/g, '\n$1');
    
    return text;
}

// Helper function to generate context for the AI
const generateContext = () => {
  return `You are a helpful CDP (Customer Data Platform) expert assistant. You help users with questions about Segment, mParticle, Lytics, and Zeotap. 
  Focus on providing clear, step-by-step answers to how-to questions. If a question is not related to these CDPs, politely explain that you can only help with CDP-related queries.`;
};

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const chat = model.startChat({
      history: [],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });
    
    const prompt = `You are a helpful CDP (Customer Data Platform) expert assistant. Help users with questions about Segment, mParticle, Lytics, and Zeotap. Focus on providing clear, step-by-step answers to how-to questions. If a question is not related to these CDPs, politely explain that you can only help with CDP-related queries. Keep your responses natural and avoid using asterisks or other markdown formatting.

    User Question: ${message}
    
    Please provide a clear, step-by-step answer. If the question is about comparing CDPs, highlight the key differences.`;

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = cleanupResponse(response.text());

    res.json({ response: text });
  } catch (error) {
    console.error('Error processing chat request:', error);
    res.status(500).json({ error: 'Failed to process your request' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
