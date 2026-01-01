
// Define the shape of the AI analysis result
export interface AiAnalysisResult {
  title: string;
  summary: string;
  tags: string[];
  suggestedSlug: string;
  readingTimeMinutes: number;
}

export enum AiProvider {
  GEMINI = 'gemini',
  CUSTOM_OPENAI = 'custom_openai' // For DeepSeek, Qwen, GLM, etc.
}

// OSS Configuration
export interface OssConfig {
  enabled: boolean;
  provider: 'minio' | 'oss'; // Restored MinIO, removed S3
  endpoint: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  region?: string;      // For Aliyun (e.g., cn-wulanchabu)
  uploadPath?: string;  // Custom storage path prefix
  customDomain?: string; // Custom CDN/Domain url
}

// Image Processing Configuration
export interface ImageProcessingConfig {
    enabled: boolean;
    compressQuality: number; // 0.1 to 1.0
    maxWidth: number; // Resize if wider than this (e.g. 1920)
    convertToWebP: boolean;
}

// AI Configuration
export interface AiConfig {
  provider: AiProvider;
  
  // Common Settings
  systemInstruction: string;
  model: string;
  temperature: number;

  // Custom Provider Settings (DeepSeek, Qwen, etc.)
  baseUrl?: string;
  apiKey?: string; // Optional override for custom providers
}

// Global Application Configuration
export interface GlobalConfig {
  ai: AiConfig;
  oss: OssConfig;
  image: ImageProcessingConfig; // New section
}

// Define the shape of our mock database record
export interface BlogDraft {
  id: string;
  content: string;
  lastSaved: Date | null;
  status: 'draft' | 'synced' | 'analyzed';
  analysis?: AiAnalysisResult;
  ossUrl?: string; // URL after upload
}

export enum LoadingState {
  IDLE = 'IDLE',
  PROCESSING_IMAGES = 'PROCESSING_IMAGES', // New State
  SAVING_TO_DB = 'SAVING_TO_DB',
  UPLOADING_OSS = 'UPLOADING_OSS',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
  WAITING_FOR_ASSETS = 'WAITING_FOR_ASSETS' // New State: waiting for user to upload folder
}
