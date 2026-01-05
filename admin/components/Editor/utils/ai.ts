import { DEFAULT_AI_SYSTEM_PROMPT } from '../../../constants';

type AiAnalysisResult = {
  title: string;
  summary: string;
  tags: string[];
  suggestedSlug: string;
  readingTimeMinutes: number;
};

export const resolveAiSystemPrompt = (prompt?: string) => {
  const trimmed = prompt?.trim();
  return trimmed ? trimmed : DEFAULT_AI_SYSTEM_PROMPT;
};

export const parseAiJson = (text: string): AiAnalysisResult => {
  let cleanText = text;
  cleanText = cleanText.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleanText = cleanText.replace(/```json\n?|\n?```/g, '');
  cleanText = cleanText.replace(/```\n?|\n?```/g, '');
  cleanText = cleanText.trim();
  try {
    return JSON.parse(cleanText) as AiAnalysisResult;
  } catch (err) {
    const match = cleanText.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as AiAnalysisResult;
    }
  }
  throw new Error('AI_JSON_PARSE_FAILED');
};
