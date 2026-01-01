
import { AiProvider } from "../types";
import { DEFAULT_SYSTEM_INSTRUCTION } from "../services/geminiService";

export const AI_PRESETS = {
    "MiniMax": {
        provider: AiProvider.CUSTOM_OPENAI,
        model: "abab6.5-chat", 
        baseUrl: "https://api.minimaxi.com/v1",
        apiKey: "",
        systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
        temperature: 0.7
    },
    "GLM": {
        provider: AiProvider.CUSTOM_OPENAI,
        model: "glm-4",
        baseUrl: "https://open.bigmodel.cn/api/paas/v4", 
        apiKey: "",
        systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
        temperature: 0.7
    },
    "Qwen": {
        provider: AiProvider.CUSTOM_OPENAI,
        model: "qwen-max",
        baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        apiKey: "",
        systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
        temperature: 0.7
    },
    "Doubao": {
        provider: AiProvider.CUSTOM_OPENAI,
        model: "ep-2024...", // Doubao needs endpoint ID usually
        baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
        apiKey: "",
        systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
        temperature: 0.7
    },
    "Gemini": {
        provider: AiProvider.GEMINI,
        model: "gemini-3-flash-preview",
        systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
        temperature: 0.7,
        apiKey: "" // Uses env process.env.API_KEY usually, or user input
    }
};

export const OSS_PRESETS = {
    "MinIO (Local)": {
        enabled: true,
        provider: "minio" as const,
        endpoint: "http://localhost:9000",
        bucket: "blog-assets",
        accessKey: "",
        secretKey: "",
        region: ""
    },
    "Aliyun OSS": {
        enabled: true,
        provider: "oss" as const,
        endpoint: "https://oss-cn-shanghai.aliyuncs.com", 
        bucket: "your-bucket-name",
        accessKey: "",
        secretKey: "",
        region: "cn-shanghai",
        uploadPath: "blog-images/",
        customDomain: "" 
    }
};
