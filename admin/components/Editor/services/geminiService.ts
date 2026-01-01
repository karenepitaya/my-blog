
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AiAnalysisResult, AiConfig, AiProvider } from "../types";

// --- 1. Constants & Schemas ---

export const DEFAULT_GEMINI_MODELS = [
    "gemini-3-flash-preview",
    "gemini-3-pro-preview",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite-preview-02-05"
];

export const DEFAULT_CUSTOM_MODELS = [
    "deepseek-chat",
    "deepseek-reasoner",
    "qwen-max",
    "qwen-plus",
    "gpt-4o",
    "gpt-4o-mini",
    "glm-4"
];

export const DEFAULT_SYSTEM_INSTRUCTION = `
你是一位专业的博客内容管理系统 (CMS) 助手和 SEO 专家。
你的任务是分析输入的 Markdown 格式博客文章。

请严格按照以下要求提取信息（输出必须为简体中文）：
1. 标题 (title)：提取或生成一个吸引人且符合 SEO 的中文标题。
2. 摘要 (summary)：写一段 2-3 句的中文摘要（简介），概括文章核心内容，不超过 300 字。
3. 标签 (tags)：提取 3-5 个相关的中文标签（关键词）。
4. URL 别名 (suggestedSlug)：根据标题生成一个 URL 友好的英文 Slug（例如：my-blog-post）。
5. 阅读时间 (readingTimeMinutes)：预估阅读所需的分钟数（整数）。

输出必须是严格符合指定 Schema 的纯 JSON 格式。
`;

// Schema for Gemini SDK
const geminiResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    suggestedSlug: { type: Type.STRING },
    readingTimeMinutes: { type: Type.INTEGER },
  },
  required: ["title", "summary", "tags", "suggestedSlug", "readingTimeMinutes"],
};

// --- Helper: Robust JSON Parser ---
const parseJsonSafe = (text: string): AiAnalysisResult => {
    let cleanText = text;

    // 1. Remove <think>...</think> blocks (DeepSeek R1 style)
    // Note: DeepSeek R1 outputs chain-of-thought in <think> tags. We must remove them to parse JSON.
    cleanText = cleanText.replace(/<think>[\s\S]*?<\/think>/gi, "");

    // 2. Remove Markdown code blocks (```json ... ```)
    cleanText = cleanText.replace(/```json\n?|\n?```/g, "");
    cleanText = cleanText.replace(/```\n?|\n?```/g, ""); 

    // 3. Trim whitespace
    cleanText = cleanText.trim();

    // 4. Try strict parse
    try {
        return JSON.parse(cleanText) as AiAnalysisResult;
    } catch (e) {
        // 5. If strict parse fails, try extracting the first JSON object using Regex
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]) as AiAnalysisResult;
            } catch (e2) {
                console.error("Regex extracted invalid JSON:", jsonMatch[0]);
            }
        }
        console.error("Failed to parse JSON. Raw text:", text);
        // Throw a descriptive error that will be shown in the UI
        throw new Error(`解析 JSON 失败。AI 可能未返回有效的 JSON 格式。\n原始响应片段: ${cleanText.substring(0, 100)}...`);
    }
};

// --- 2. Providers Implementation ---

// A. Google Gemini Implementation
const analyzeWithGemini = async (content: string, config: AiConfig): Promise<AiAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
      // Clean model name (remove 'models/' prefix if present)
      const modelName = config.model ? config.model.replace(/^models\//, '') : "gemini-3-flash-preview";

      const response = await ai.models.generateContent({
        model: modelName,
        contents: content,
        config: {
          systemInstruction: config.systemInstruction,
          responseMimeType: "application/json",
          responseSchema: geminiResponseSchema,
          temperature: config.temperature,
        },
      });

      const resultText = response.text;
      if (!resultText) throw new Error("Gemini returned empty response. 可能被安全设置拦截。");
      
      return parseJsonSafe(resultText);
  } catch (error: any) {
      // Friendly error handling for Gemini
      if (error.message?.includes("404") || error.message?.includes("not found")) {
           throw new Error(`模型 '${config.model}' 未找到或您的 API Key 无权访问。请检查模型名称拼写。`);
      }
      if (error.message?.includes("Json mode is not supported")) {
          throw new Error(`当前模型 (${config.model}) 不支持 JSON Schema 模式。请尝试 gemini-3-pro-preview 或 gemini-3-flash-preview。`);
      }
      throw error;
  }
};

// Helper to list Gemini Models
const listGeminiModels = async (): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.list();
        const models = response.models || [];
        return models
            .filter((m: any) => 
                m.name && 
                (m.supportedGenerationMethods?.includes("generateContent") || m.supportedGenerationMethods?.includes("generate_content"))
            )
            .map((m: any) => m.name.replace(/^models\//, ''));
    } catch (e) {
        console.warn("Failed to list Gemini models via API, using defaults.", e);
        return DEFAULT_GEMINI_MODELS;
    }
}

// B. Custom OpenAI-Compatible Implementation
const analyzeWithCustomProvider = async (content: string, config: AiConfig): Promise<AiAnalysisResult> => {
  if (!config.baseUrl || !config.apiKey) {
    throw new Error("自定义提供商需要 Base URL 和 API Key");
  }

  // 1. URL Normalization
  let baseUrl = config.baseUrl.replace(/\/+$/, '');
  // If user entered ".../v1", keep it. If they entered ".../v1/chat/completions", strip it.
  baseUrl = baseUrl.replace(/\/chat\/completions$/, '');
  
  const endpoint = `${baseUrl}/chat/completions`;

  // 2. Vendor Heuristics
  const modelId = config.model.toLowerCase();
  const isOpenAI = modelId.includes("gpt-") || modelId.includes("o1-");
  const isDeepSeek = modelId.includes("deepseek");
  const isDeepSeekReasoner = modelId.includes("deepseek-reasoner"); // R1
  const isQwen = modelId.includes("qwen");

  // 3. Construct Payload
  const payload: any = {
    model: config.model,
    messages: [
       // System prompt
      { 
        role: "system", 
        content: config.systemInstruction + "\n\nIMPORTANT: You must output ONLY valid JSON. No Markdown block markers. No introductory text." 
      },
      // User prompt
      { role: "user", content: content }
    ],
    temperature: isDeepSeekReasoner ? undefined : config.temperature, // R1 often doesn't support temp
    stream: false
  };

  // 4. Provider-specific Tweaks
  
  // OpenAI Official: Supports response_format
  if (isOpenAI) {
      payload.response_format = { type: "json_object" };
  }
  
  // DeepSeek / Qwen: Usually do NOT support strict response_format in all hosting environments,
  // or it might cause 400 errors. We rely on the strong system prompt above.
  // However, if we wanted to enforce it for compatible endpoints:
  // if (isQwen) payload.response_format = { type: "json_object" }; // Only enable if sure

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        let errorMsg = `API Error (${response.status})`;
        try {
            const errJson = JSON.parse(errText);
            errorMsg += `: ${errJson.error?.message || errText}`;
        } catch {
            errorMsg += `: ${errText.substring(0, 200)}`;
        }
        
        // Handle common 404/400
        if (response.status === 404) errorMsg += " (Check Base URL or Model Name)";
        if (response.status === 401) errorMsg += " (Check API Key)";
        
        throw new Error(errorMsg);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    
    if (!rawContent) throw new Error("Provider returned empty content (choices[0].message.content is null)");

    return parseJsonSafe(rawContent);

  } catch (error: any) {
    console.error("Custom Provider Analysis Failed:", error);
    throw error;
  }
};

// Helper to list OpenAI Compatible Models
const listCustomModels = async (config: AiConfig): Promise<string[]> => {
    if (!config.baseUrl || !config.apiKey) return DEFAULT_CUSTOM_MODELS;
    try {
        let baseUrl = config.baseUrl.replace(/\/+$/, '');
        baseUrl = baseUrl.replace(/\/chat\/completions$/, '');
        const endpoint = `${baseUrl}/models`;

        const response = await fetch(endpoint, {
            method: "GET",
            headers: { "Authorization": `Bearer ${config.apiKey}` }
        });
        
        if (!response.ok) throw new Error("Failed to fetch models");
        
        const data = await response.json();
        // Handle standard OpenAI format { data: [{id: "..."}] }
        if (Array.isArray(data.data)) {
            return data.data.map((m: any) => m.id);
        }
        return DEFAULT_CUSTOM_MODELS;
    } catch (e) {
        console.warn("Could not list custom models, user must type manually.", e);
        return DEFAULT_CUSTOM_MODELS;
    }
}

// --- 3. Main Factory Functions ---

export const analyzeBlogContent = async (
  markdownContent: string,
  config: AiConfig
): Promise<AiAnalysisResult> => {
  
  switch (config.provider) {
    case AiProvider.GEMINI:
      return analyzeWithGemini(markdownContent, config);
    
    case AiProvider.CUSTOM_OPENAI:
      return analyzeWithCustomProvider(markdownContent, config);
      
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
};

export const fetchModelList = async (config: AiConfig): Promise<string[]> => {
    switch (config.provider) {
        case AiProvider.GEMINI:
            return listGeminiModels();
        case AiProvider.CUSTOM_OPENAI:
            return listCustomModels(config);
        default:
            return [];
    }
};
