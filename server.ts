import express from 'express';
import path from 'path';
import { GoogleGenAI, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Converts 16-bit linear PCM audio to WAV buffer with standard 44-byte header
 */
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const chunkSize = 36 + dataSize;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // TTS Endpoint: using gemini-3.1-flash-tts-preview
  app.post('/api/ai/tts', async (req, res) => {
    try {
      const { text, voice } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text prompt is required.' });
      }

      const ai = getGeminiClient();
      const validVoice = voice || 'Kore'; // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: text.trim() }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: validVoice },
            },
          },
        },
      });

      const base64Pcm = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Pcm) {
        return res.status(500).json({ error: 'No audio data returned by TTS model.' });
      }

      const pcmBuffer = Buffer.from(base64Pcm, 'base64');
      const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
      const base64Wav = wavBuffer.toString('base64');

      res.json({
        audioUrl: `data:audio/wav;base64,${base64Wav}`,
        voice: validVoice,
      });
    } catch (err: any) {
      console.error('TTS API error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate speech.' });
    }
  });

  // Image Generation Endpoint: using gemini-3-pro-image-preview with 1K, 2K, 4K affordance
  app.post('/api/ai/image', async (req, res) => {
    try {
      const { prompt, imageSize = '1K', aspectRatio = '9:16' } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required.' });
      }

      const ai = getGeminiClient();
      const validSize = ['1K', '2K', '4K'].includes(imageSize) ? imageSize : '1K';
      const validAspect = ['9:16', '1:1', '16:9', '3:4', '4:3'].includes(aspectRatio) ? aspectRatio : '9:16';

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: {
            parts: [{ text: prompt.trim() }],
          },
          config: {
            imageConfig: {
              aspectRatio: validAspect,
              imageSize: validSize,
            },
          },
        });
      } catch (proError) {
        console.warn('gemini-3-pro-image-preview fallback to gemini-3.1-flash-image:', proError);
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image',
          contents: {
            parts: [{ text: prompt.trim() }],
          },
          config: {
            imageConfig: {
              aspectRatio: validAspect,
              imageSize: validSize,
            },
          },
        });
      }

      let imageUrl = '';
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!imageUrl) {
        return res.status(500).json({ error: 'No image data returned from model.' });
      }

      res.json({ imageUrl, imageSize: validSize, aspectRatio: validAspect });
    } catch (err: any) {
      console.error('Image Generation API error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate image.' });
    }
  });

  // Chatbot Endpoint: using gemini-3.5-flash / gemini-3.1-pro-preview / gemini-3.1-flash-lite
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { messages, role = 'copilot', model = 'gemini-3.5-flash' } = req.body;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages history is required.' });
      }

      const ai = getGeminiClient();

      let systemInstruction = 'You are an energetic, fun, and savvy YouTube Shorts AI Co-Pilot. You help viewers dissect shorts, suggest ideas, explain topics, and share witty reactions in concise, punchy sentences.';
      if (role === 'analyst') {
        systemInstruction = 'You are an insightful Video Critic and Media Analyst for YouTube Shorts. Break down cinematography, storytelling hooks, pacing, sound design, and retention tactics with clarity and sharp analysis.';
      } else if (role === 'creator') {
        systemInstruction = 'You are an expert Shorts Creator & Growth Strategist. Give creators actionable advice on hooks, hashtags, thumbnail concepts, algorithmic virality, and engagement.';
      }

      // Allowed models based on task complexity
      let selectedModel = 'gemini-3.5-flash';
      if (model === 'gemini-3.1-pro-preview' || role === 'analyst') {
        selectedModel = 'gemini-3.1-pro-preview';
      } else if (model === 'gemini-3.1-flash-lite') {
        selectedModel = 'gemini-3.1-flash-lite';
      }

      const formattedContents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.8,
        },
      });

      const replyText = response.text || "I couldn't process that. Try asking something else!";
      res.json({ reply: replyText, model: selectedModel, role });
    } catch (err: any) {
      console.error('Chat API error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate chat response.' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`YouTube Shorts server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
