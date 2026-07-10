import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { GoogleGenAI } from '@google/genai';

const router = Router();

const apiKey = process.env.GEMINI_API_KEY;

// Helper to initialize GoogleGenAI safely
function getAIClient() {
  if (!apiKey) {
    console.warn('[Gemini API Warning]: GEMINI_API_KEY is not defined. Using mock fallback responses.');
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// System Instruction Builder
async function buildSystemInstruction() {
  let catalogSummary = 'No products registered yet.';
  try {
    const products = await prisma.product.findMany({ include: { category: true } });
    catalogSummary = products
      .map(
        (p) =>
          `- ID: ${p.id}, Name: ${p.name}, Price: $${p.price}, Stock: ${p.stock}, Category: ${
            p.category?.name || 'Hydration'
          }, Description: ${p.description}`
      )
      .join('\n');
  } catch (err) {
    console.error('Error fetching product catalog for AI system prompt:', err);
  }

  return `You are the premium official HydraFlow AI Assistant.
You can ONLY answer questions related to HydraFlow bottles, brand, products, insulation, warranty, features, and specs.
If the user asks about anything unrelated to HydraFlow (e.g., generic coding, history, other products, weather), you must politely refuse to answer and guide them back to HydraFlow products.

Here is the current active product catalog:
${catalogSummary}

Warranty details: Lifetime computational thermal container warranty. Customers register serial codes on their dashboard.
Insulation details: Double-wall vacuum stainless steel structure keeping hot drinks hot for 12 hours and cold drinks cold for 24 hours.

Be helpful, elegant, concise, and polite. Always keep responses focused on HydraFlow.`;
}

// 1. POST /api/ai/chat
router.post('/ai/chat', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body; // array of { role: 'user' | 'model', content: string }
    if (!messages || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'Message thread is required.' });
    }

    const lastMessage = messages[messages.length - 1].content;
    const instruction = await buildSystemInstruction();
    const aiClient = getAIClient();

    if (!aiClient) {
      // Rule-based elegant mock fallback if API key is not present
      let mockReply = 'Welcome to HydraFlow Assistant. We specialize in premium thermal hydration. How can I assist you with our catalog today?';
      const lowercaseMsg = lastMessage.toLowerCase();
      
      if (lowercaseMsg.includes('hiking') || lowercaseMsg.includes('climb')) {
        mockReply = 'For hiking, we highly recommend our HydraFlow Explorer or Smart Bottle. They feature durable double-wall vacuum insulation to keep your water ice-cold for 24 hours on the trail.';
      } else if (lowercaseMsg.includes('warranty') || lowercaseMsg.includes('guarantee')) {
        mockReply = 'HydraFlow offers a lifetime computational warranty on all thermal containers. You can register your bottle serial number directly in your customer dashboard under the Warranty tab.';
      } else if (lowercaseMsg.includes('compare') || lowercaseMsg.includes('difference')) {
        mockReply = 'Our Smart Bottle includes built-in thermal computational sensors, whereas our Travel Bottle features a lightweight leak-proof cap designed for ease of transit. Both offer premium vacuum insulation.';
      } else if (lowercaseMsg.includes('gym') || lowercaseMsg.includes('sport')) {
        mockReply = 'Our HydraFlow Sports Bottle is excellent for the gym, featuring a fast-flow spout and sweat-proof outer finish.';
      } else if (lowercaseMsg.includes('insulation') || lowercaseMsg.includes('hot') || lowercaseMsg.includes('cold')) {
        mockReply = 'All HydraFlow containers use premium double-wall copper-plated vacuum insulation, keeping cold beverages cold for 24 hours and hot liquids hot for 12 hours.';
      }

      return res.status(200).json({ success: true, data: { text: mockReply } });
    }

    // Call Gemini API using new official SDK
    const response = await aiClient.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: messages.map((m: any) => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      config: {
        systemInstruction: instruction,
        temperature: 0.2,
      },
    });

    res.status(200).json({ success: true, data: { text: response.text || '' } });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ success: false, message: 'Server AI error.' });
  }
});

// 2. POST /api/ai/recommend
router.post('/ai/recommend', async (req: Request, res: Response) => {
  try {
    const { useCase } = req.body;
    const instruction = await buildSystemInstruction();
    const aiClient = getAIClient();

    if (!aiClient) {
      return res.status(200).json({
        success: true,
        data: {
          recommendation: `Based on your use case (${useCase || 'Daily Hydration'}), we recommend the HydraFlow Pro Series due to its temperature retention capabilities.`,
        },
      });
    }

    const response = await aiClient.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Suggest the best HydraFlow bottle from our catalog for this use case: "${useCase}". List 1 primary recommendation and describe why it is suited.`,
      config: {
        systemInstruction: instruction,
      },
    });

    res.status(200).json({ success: true, data: { recommendation: response.text || '' } });
  } catch (error) {
    console.error('AI recommend error:', error);
    res.status(500).json({ success: false, message: 'Server AI error.' });
  }
});

// 3. POST /api/ai/compare
router.post('/ai/compare', async (req: Request, res: Response) => {
  try {
    const { product1, product2 } = req.body;
    const instruction = await buildSystemInstruction();
    const aiClient = getAIClient();

    if (!aiClient) {
      return res.status(200).json({
        success: true,
        data: {
          comparison: `Comparing ${product1 || 'Smart Bottle'} vs ${product2 || 'Travel Bottle'}: The Smart Bottle features temperature sensors, while the Travel Bottle highlights high capacity and lightweight design. Both share double-wall insulation.`,
        },
      });
    }

    const response = await aiClient.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Provide a structured comparison between: "${product1}" and "${product2}". Break down into Price, Unique features, and best suited audience.`,
      config: {
        systemInstruction: instruction,
      },
    });

    res.status(200).json({ success: true, data: { comparison: response.text || '' } });
  } catch (error) {
    console.error('AI compare error:', error);
    res.status(500).json({ success: false, message: 'Server AI error.' });
  }
});

// 4. POST /api/ai/product-description
router.post('/ai/product-description', async (req: Request, res: Response) => {
  try {
    const { productName, attributes } = req.body;
    const aiClient = getAIClient();

    if (!aiClient) {
      return res.status(200).json({
        success: true,
        data: {
          description: `Introducing the premium ${productName || 'HydraFlow Bottle'}. Built with attributes: ${attributes || 'copper insulation'}. Designed for pure luxury and performance.`,
        },
      });
    }

    const response = await aiClient.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Generate a premium, Apple-style product description for a bottle named "${productName}" with these attributes: "${attributes}". Keep it luxury, editorial, and compelling.`,
    });

    res.status(200).json({ success: true, data: { description: response.text || '' } });
  } catch (error) {
    console.error('AI description error:', error);
    res.status(500).json({ success: false, message: 'Server AI error.' });
  }
});

export default router;
