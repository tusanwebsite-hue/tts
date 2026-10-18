import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { refinePersianText, buildTtsStylePrompt } from './src/utils/persianText.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Endpoint: Refine text using fast rule-based parser + optional Gemini 3.8 Flash
 */
app.post('/api/refine-text', async (req: Request, res: Response) => {
  try {
    const { text, mode = 'fluent_colloquial', useAi = true } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'متن ورودی معتبر نیست.' });
      return;
    }

    // 1. First run deterministic rule-based corrections
    const ruleResult = refinePersianText(text, { mode });

    // 2. If AI is available and requested, enrich with Gemini 3.8 Flash
    if (useAi && ai) {
      try {
        const prompt = `You are an expert Persian (Farsi) linguist, voiceover director, and copyeditor.
The user wants to convert the following Persian text into fluent, perfectly enunciated natural speech for an Instagram Reel / video tutorial about AI tools and VPNs.

Input raw Persian text:
"""
${text}
"""

Tasks:
1. Fix all typos, slips, and accidental repetitions (e.g., "تو تو" -> "تو", "هس" -> "هست", "شمام" -> "شما هم", "سرویسای" -> "سرویس‌های").
2. Ensure correct pronunciation for tech terms:
   - "جمینای" (Gemini)
   - "گوگل فلو" (Google Flow)
   - "وی پی ان" (VPN)
   - "فایرفاکس" (Firefox)
   - "آی‌پی" (IP)
3. Provide three versions:
   - "reelsVersion": Natural, energetic, fluid colloquial Persian (محاوره‌ای تمیز و بی‌نقص مخصوص ویدیو و ریلز).
   - "formalVersion": Formal, standard literary Persian (رسمی و گویندگی فاخر رادیویی).
   - "phoneticVersion": Text with Persian diacritics (اعراب‌گذاری مانند ِ ُ َ و تنوین) on tricky tech words to guide the voice actor or TTS engine.
4. List the exact corrections made and why.

Respond ONLY with valid JSON with this exact schema:
{
  "reelsVersion": string,
  "formalVersion": string,
  "phoneticVersion": string,
  "corrections": [
    {"original": string, "fixed": string, "explanation": string}
  ],
  "pronunciationTips": [
    {"term": string, "phoneticFa": string, "tip": string}
  ]
}`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const jsonStr = aiResponse.text?.trim() || '{}';
        const parsedAi = JSON.parse(jsonStr);

        let chosenRefined = ruleResult.refinedText;
        if (mode === 'fluent_colloquial' && parsedAi.reelsVersion) {
          chosenRefined = parsedAi.reelsVersion;
        } else if (mode === 'formal_broadcasting' && parsedAi.formalVersion) {
          chosenRefined = parsedAi.formalVersion;
        } else if (mode === 'phonetic_diacritics' && parsedAi.phoneticVersion) {
          chosenRefined = parsedAi.phoneticVersion;
        }

        res.json({
          success: true,
          refinedText: chosenRefined,
          reelsVersion: parsedAi.reelsVersion || ruleResult.refinedText,
          formalVersion: parsedAi.formalVersion || ruleResult.refinedText,
          phoneticVersion: parsedAi.phoneticVersion || ruleResult.refinedText,
          corrections: [
            ...(ruleResult.detectedIssues.map(i => ({
              original: i.original,
              fixed: i.fixed,
              explanation: i.reason,
            }))),
            ...(parsedAi.corrections || []),
          ],
          pronunciationTips: parsedAi.pronunciationTips || [
            { term: 'جمینای', phoneticFa: 'جِمینای (Gemini)', tip: 'تلفظ با کسره زیر جیم' },
            { term: 'گوگل فلو', phoneticFa: 'گوگِل فِلو (Google Flow)', tip: 'تلفظ روان واژگان انگلیسی' },
            { term: 'وی پی ان', phoneticFa: 'وی‌پی‌اِن (VPN)', tip: 'بیان واضح سه حرف اختصاری' },
            { term: 'فایرفاکس', phoneticFa: 'فایِرفاکس (Firefox)', tip: 'تلفظ روان نام مرورگر' },
          ],
          wordCount: ruleResult.wordCount,
          estimatedDurationSeconds: ruleResult.estimatedDurationSeconds,
          sentences: ruleResult.sentences,
        });
        return;
      } catch (aiErr) {
        console.warn('AI refinement fallback to rule-based parser:', aiErr);
      }
    }

    // Default fallback to rule-based results
    res.json({
      success: true,
      refinedText: ruleResult.refinedText,
      reelsVersion: ruleResult.refinedText,
      formalVersion: refinePersianText(text, { mode: 'formal_broadcasting' }).refinedText,
      phoneticVersion: refinePersianText(text, { mode: 'phonetic_diacritics' }).refinedText,
      corrections: ruleResult.detectedIssues.map(i => ({
        original: i.original,
        fixed: i.fixed,
        explanation: i.reason,
      })),
      pronunciationTips: [
        { term: 'جمینای', phoneticFa: 'جِمینای (Gemini)', tip: 'تلفظ با کسره زیر جیم' },
        { term: 'گوگل فلو', phoneticFa: 'گوگِل فِلو (Google Flow)', tip: 'تلفظ روان واژگان انگلیسی' },
        { term: 'وی پی ان', phoneticFa: 'وی‌پی‌اِن (VPN)', tip: 'بیان واضح با نیم‌فاصله' },
        { term: 'فایرفاکس', phoneticFa: 'فایِرفاکس (Firefox)', tip: 'تلفظ روان نام مرورگر' },
      ],
      wordCount: ruleResult.wordCount,
      estimatedDurationSeconds: ruleResult.estimatedDurationSeconds,
      sentences: ruleResult.sentences,
    });
  } catch (error: any) {
    console.error('Refine error:', error);
    res.status(500).json({ error: error.message || 'خطا در ویرایش و اعراب‌گذاری متن' });
  }
});

/**
 * Endpoint: TTS Speech generation using gemini-3.8-flash-tts
 */
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const {
      text,
      voice = 'Kore',
      style = 'reels_colloquial',
      customStylePrompt,
    } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({ error: 'لطفاً متن فارسی مورد نظر برای تولید صدا را وارد کنید.' });
      return;
    }

    if (!ai) {
      res.status(503).json({
        error: 'کلید دسترسی Gemini API در سرور یافت نشد. لطفاً متغیر GEMINI_API_KEY را تنظیم کنید.',
      });
      return;
    }

    const styleInstruction = customStylePrompt || buildTtsStylePrompt(style);

    // Call Gemini 3.8 Flash TTS
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.trim(),
              speechMetadata: {
                style: styleInstruction,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // Supported prebuilt voices: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find((p: any) => p.inlineData?.data);

    if (!audioPart || !audioPart.inlineData?.data) {
      // If gemini-3.8-flash-tts did not return audio directly, try fallback to gemini-3.8-flash-lite-tts
      console.warn('Trying fallback model gemini-3.8-flash-lite-tts...');
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text.trim(),
                speechMetadata: {
                  style: styleInstruction,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
            },
          },
        },
      });

      const fallbackPart = fallbackResponse.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
      if (fallbackPart && fallbackPart.inlineData?.data) {
        res.json({
          success: true,
          audioBase64: fallbackPart.inlineData.data,
          mimeType: fallbackPart.inlineData.mimeType || 'audio/wav',
          modelUsed: 'gemini-3.8-flash-lite-tts',
          voiceUsed: voice,
        });
        return;
      }

      res.status(500).json({ error: 'داده صوتی از هوش مصنوعی دریافت نشد.' });
      return;
    }

    res.json({
      success: true,
      audioBase64: audioPart.inlineData.data,
      mimeType: audioPart.inlineData.mimeType || 'audio/wav',
      modelUsed: 'gemini-3.8-flash-tts',
      voiceUsed: voice,
    });
  } catch (error: any) {
    console.error('TTS error:', error);
    res.status(500).json({
      error: error.message || 'خطا در تولید فایل صوتی با مدل Gemini 3.8 Flash TTS',
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', hasGeminiKey: !!apiKey });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Persian Gemini TTS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
