import { GoogleGenAI, Type } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export const getAIWritingAssistant = async (content: string) => {
  try {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY_MISSING');
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional blog editor. Analyze the following content and provide:
1. A concise summary (max 150 words)
2. 5 SEO tags
3. A readability score out of 100

Content:
${content}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            readability: { type: Type.NUMBER },
          },
          required: ['summary', 'tags', 'readability'],
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('NO_RESPONSE_TEXT');
    }
    return JSON.parse(textOutput.trim());
  } catch (error) {
    console.error('Gemini assistant failed:', error);
    return null;
  }
};
