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

// Highly Conversational Simulation Reply Generator
function generateSimulationReply(message: string): string {
  const lowercaseMsg = message.toLowerCase();

  if (lowercaseMsg.includes('hiking') || lowercaseMsg.includes('climb') || lowercaseMsg.includes('outdoor') || lowercaseMsg.includes('trail')) {
    return 'For hiking and outdoor trails, we recommend our HydraFlow Explorer or Smart Bottle. They feature durable double-wall vacuum insulation to keep your water ice-cold for 24 hours and a rugged sweat-proof grip.';
  }
  
  if (lowercaseMsg.includes('warranty') || lowercaseMsg.includes('guarantee') || lowercaseMsg.includes('replacement')) {
    return 'All HydraFlow computational containers come with a lifetime thermal warranty. You can register your bottle serial code directly in your customer dashboard under the Warranty tab for lifetime activation.';
  }
  
  if (lowercaseMsg.includes('insulation') || lowercaseMsg.includes('hot') || lowercaseMsg.includes('cold') || lowercaseMsg.includes('temp') || lowercaseMsg.includes('retention')) {
    return 'Our bottles are engineered with premium double-wall copper-plated vacuum insulation, keeping cold drinks cold for 24 hours and hot drinks hot for 12 hours without external condensation.';
  }
  
  if (lowercaseMsg.includes('gym') || lowercaseMsg.includes('sport') || lowercaseMsg.includes('workout') || lowercaseMsg.includes('fitness') || lowercaseMsg.includes('exercise')) {
    return 'For fitness and gym use, the HydraFlow Sports Bottle is ideal. It comes with a fast-flow leakproof spout, ergonomic carry handle, and fits perfectly in standard cup holders.';
  }
  
  if (lowercaseMsg.includes('compare') || lowercaseMsg.includes('difference') || lowercaseMsg.includes('vs')) {
    return 'Our Smart Bottle contains integrated temperature sensors, while our Travel Bottle is lightweight and features a leakproof cap designed for long transits. Both offer our signature double-wall insulation.';
  }
  
  if (lowercaseMsg.includes('color') || lowercaseMsg.includes('finish') || lowercaseMsg.includes('style') || lowercaseMsg.includes('choose')) {
    return 'HydraFlow offers a curated luxury palette: Aurora Blue, Carbon Black, Steel Gray, Emerald Green, and Obsidian. Each features a premium powder coat that prevents sweat and scratches.';
  }
  
  if (lowercaseMsg.includes('smart') || lowercaseMsg.includes('sensor') || lowercaseMsg.includes('tech')) {
    return 'The HydraFlow Smart Bottle features built-in computational thermal sensors that monitor liquid temperature. It is our most advanced container for modern daily hydration.';
  }

  if (lowercaseMsg.includes('what can you do') || lowercaseMsg.includes('help') || lowercaseMsg.includes('features')) {
    return 'I can recommend the perfect HydraFlow bottle for your activities (hiking, gym, travel), explain our lifetime warranty coverage, detail our double-wall copper vacuum insulation technology, or compare different bottle specs!';
  }

  // General default fallback
  return 'I am the HydraFlow AI Assistant. Ask me about our premium computational containers (Smart, Explorer, or Sports series), lifetime warranty registration, or double-wall vacuum insulation features!';
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
  const { messages } = req.body;
  if (!messages || messages.length === 0) {
    return res.status(400).json({ success: false, message: 'Message thread is required.' });
  }

  const lastMessage = messages[messages.length - 1].content;

  try {
    const instruction = await buildSystemInstruction();
    const aiClient = getAIClient();

    if (!aiClient) {
      const mockReply = generateSimulationReply(lastMessage);
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
    console.error('AI chat error (falling back to simulation):', error);
    const mockReply = generateSimulationReply(lastMessage);
    res.status(200).json({ success: true, data: { text: mockReply } });
  }
});

// 2. POST /api/ai/recommend
router.post('/ai/recommend', async (req: Request, res: Response) => {
  const { useCase } = req.body;
  try {
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
    console.error('AI recommend error (falling back to simulation):', error);
    res.status(200).json({
      success: true,
      data: {
        recommendation: `Based on your use case (${useCase || 'Daily Hydration'}), we recommend the HydraFlow Pro Series due to its temperature retention capabilities.`,
      },
    });
  }
});

// 3. POST /api/ai/compare
router.post('/ai/compare', async (req: Request, res: Response) => {
  const { product1, product2 } = req.body;
  try {
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
    console.error('AI compare error (falling back to simulation):', error);
    res.status(200).json({
      success: true,
      data: {
        comparison: `Comparing ${product1 || 'Smart Bottle'} vs ${product2 || 'Travel Bottle'}: The Smart Bottle features temperature sensors, while the Travel Bottle highlights high capacity and lightweight design. Both share double-wall insulation.`,
      },
    });
  }
});

// 4. POST /api/ai/product-description
router.post('/ai/product-description', async (req: Request, res: Response) => {
  const { productName, attributes } = req.body;
  try {
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
    console.error('AI description error (falling back to simulation):', error);
    res.status(200).json({
      success: true,
      data: {
        description: `Introducing the premium ${productName || 'HydraFlow Bottle'}. Built with attributes: ${attributes || 'copper insulation'}. Designed for pure luxury and performance.`,
      },
    });
  }
});

export default router;
