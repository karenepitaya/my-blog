
import { GlobalConfig } from "../types";

export interface ImageProcessingResult {
    content: string;
    errors: Array<{
        path: string;
        reason: string;
        isLocalMissing?: boolean;
    }>;
    processedCount: number;
    missingLocalPaths: string[];
}

const MD_IMAGE_REGEX = /!\[(.*?)\]\((.*?)\)/g;
const HTML_IMAGE_REGEX = /<img[\s\S]*?src=["'](.*?)["'][\s\S]*?>/g;

interface ImageMatch {
    originalStr: string;
    alt: string;
    url: string;
    isHtml: boolean;
}

// --- Utils ---

const normalizePath = (p: string) => {
    let clean = p.split('?')[0].split('#')[0];
    try { clean = decodeURIComponent(clean); } catch {}
    clean = clean.replace(/\\/g, '/');
    clean = clean.replace(/^(\.\/|\/)/, ''); 
    return clean.toLowerCase();
};

const computeHmacSha1 = async (secret: string, message: string) => {
    const enc = new TextEncoder();
    const key = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "HMAC", hash: "SHA-1" },
        false,
        ["sign"]
    );
    const signature = await window.crypto.subtle.sign("HMAC", key, enc.encode(message));
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
};

// --- Upload Implementation ---

const uploadToAliyunOSS = async (blob: Blob | string, filename: string, config: GlobalConfig['oss']): Promise<string> => {
    const method = 'PUT';
    const date = new Date().toUTCString();
    // Simple content type detection
    const contentType = typeof blob === 'string' 
        ? 'text/plain; charset=utf-8' 
        : (blob.type || 'application/octet-stream');
    
    // Canonicalized Resource: /bucket/filename
    const resourcePath = `/${config.bucket}/${filename}`;
    
    // Signature
    const stringToSign = `${method}\n\n${contentType}\n${date}\n${resourcePath}`;
    const signature = await computeHmacSha1(config.secretKey, stringToSign);
    const auth = `OSS ${config.accessKey}:${signature}`;

    // Host construction
    // Aliyun standard: https://bucket.endpoint/filename (Virtual Hosted Style)
    // endpoint usually: oss-cn-xxx.aliyuncs.com
    let host = config.endpoint.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    let protocol = config.endpoint.startsWith('http://') ? 'http://' : 'https://';
    
    // Construct final URL
    let uploadUrl = "";
    let publicUrl = "";

    if (host.includes('aliyuncs.com')) {
        // Use Virtual Host
        uploadUrl = `${protocol}${config.bucket}.${host}/${filename}`;
        publicUrl = config.customDomain 
            ? `${config.customDomain.replace(/\/+$/, '')}/${filename}` 
            : uploadUrl;
    } else {
        // Fallback / Custom domain
        uploadUrl = `${protocol}${host}/${config.bucket}/${filename}`;
        publicUrl = config.customDomain 
            ? `${config.customDomain.replace(/\/+$/, '')}/${filename}`
            : uploadUrl;
    }

    try {
        const response = await fetch(uploadUrl, {
            method: method,
            headers: {
                'Content-Type': contentType,
                'Date': date,
                'Authorization': auth
            },
            body: blob
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Upload Failed (${response.status}): ${text}`);
        }

        return publicUrl;
    } catch (e) {
        if ((e as Error).message === 'Failed to fetch') {
            throw new Error("网络请求失败，极可能是 CORS 跨域限制。\n请在 OSS 控制台 -> 权限管理 -> 跨域设置中添加规则：\n允许来源: * (或本地域名)\n允许 Methods: PUT, HEAD\n允许 Headers: *");
        }
        throw e;
    }
};

const uploadToMinIO = async (blob: Blob | string, filename: string, config: GlobalConfig['oss']): Promise<string> => {
    const method = 'PUT';
    // MinIO / S3 requires AWS SigV4. 
    // Implementing full AWS SigV4 in frontend without 'aws-sdk' or 'crypto-js' is complex and verbose.
    // For this implementation, we will attempt a direct upload using the constructed URL.
    // NOTE: This will likely fail with 403 Forbidden unless the bucket policy allows anonymous writes 
    // or a proxy is used, because we are not calculating the AWS v4 Signature here.
    
    const endpoint = config.endpoint.replace(/\/+$/, '');
    const uploadUrl = `${endpoint}/${config.bucket}/${filename}`;
    
    const contentType = typeof blob === 'string' 
    ? 'text/plain; charset=utf-8' 
    : (blob.type || 'application/octet-stream');

    try {
        const response = await fetch(uploadUrl, {
            method: method,
            headers: {
                'Content-Type': contentType,
                // 'Authorization': ... (Requires SigV4)
            },
            body: blob
        });

        if (!response.ok) {
            const text = await response.text();
             throw new Error(`MinIO Upload Failed (${response.status}): ${text}. \n注意: 前端直传 MinIO 需要 AWS SigV4 签名，当前演示版本暂未内置完整 SigV4 算法。请使用 Aliyun OSS 或允许匿名写入 (不推荐)。`);
        }
        
        return config.customDomain 
            ? `${config.customDomain.replace(/\/+$/, '')}/${filename}`
            : uploadUrl;

    } catch (e) {
        throw new Error(`MinIO Connection Failed: ${(e as Error).message}`);
    }
};

const uploadToOss = async (blob: Blob, filename: string, config: GlobalConfig['oss']): Promise<string> => {
    const pathPrefix = config.uploadPath ? config.uploadPath.replace(/^\/|\/$/g, '') + '/' : '';
    const finalFilename = pathPrefix + filename;

    // Enforce real configuration usage
    if (config.provider === 'oss') {
        return uploadToAliyunOSS(blob, finalFilename, config);
    } else if (config.provider === 'minio') {
        return uploadToMinIO(blob, finalFilename, config);
    } else {
        throw new Error("Unknown provider type");
    }
};

const isFuzzyMatch = (markdownPath: string, uploadPath: string): boolean => {
    const target = normalizePath(markdownPath);
    const candidate = normalizePath(uploadPath);
    if (target === candidate) return true;
    if (target.endsWith(candidate)) return true;
    if (candidate.endsWith(target)) return true;
    const targetParts = target.split('/');
    const candidateParts = candidate.split('/');
    if (targetParts.length >= 2 && candidateParts.length >= 2) {
        const targetKey = `${targetParts[targetParts.length - 2]}/${targetParts[targetParts.length - 1]}`;
        const candidateKey = `${candidateParts[candidateParts.length - 2]}/${candidateParts[candidateParts.length - 1]}`;
        if (targetKey === candidateKey) return true;
    }
    return false;
};

// --- Image Processing ---

const compressImage = async (blob: Blob, config: GlobalConfig['image']): Promise<Blob> => {
    if (!config.enabled) return blob;

    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            let width = img.width;
            let height = img.height;
            if (width > config.maxWidth) {
                height = Math.round((height * config.maxWidth) / width);
                width = config.maxWidth;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(blob); return; }
            ctx.drawImage(img, 0, 0, width, height);
            const mimeType = config.convertToWebP ? 'image/webp' : 'image/jpeg';
            canvas.toBlob((newBlob) => {
                if (newBlob) resolve(newBlob);
                else resolve(blob);
            }, mimeType, config.compressQuality);
        };
        img.onerror = (err) => reject(err);
        img.src = url;
    });
};

export const processMarkdownImages = async (
    markdownContent: string, 
    config: GlobalConfig,
    uploadedFiles: File[] = []
): Promise<ImageProcessingResult> => {
    const result: ImageProcessingResult = {
        content: markdownContent,
        errors: [],
        processedCount: 0,
        missingLocalPaths: []
    };

    if (!config.oss.enabled) return result;

    const matches: ImageMatch[] = [];
    let match;
    while ((match = MD_IMAGE_REGEX.exec(markdownContent)) !== null) {
        matches.push({ originalStr: match[0], alt: match[1], url: match[2], isHtml: false });
    }
    while ((match = HTML_IMAGE_REGEX.exec(markdownContent)) !== null) {
        matches.push({ originalStr: match[0], alt: 'image', url: match[1], isHtml: true });
    }

    if (matches.length === 0) return result;

    let newContent = markdownContent;
    const uniqueUrls = [...new Set(matches.map(m => m.url))];

    for (const url of uniqueUrls) {
        if (url.startsWith('http') && !url.includes('localhost')) continue; 

        try {
            let blob: Blob | null = null;
            if (url.startsWith('data:image')) {
                const res = await fetch(url);
                blob = await res.blob();
            } else {
                const file = uploadedFiles.find(f => {
                    const uploadPath = f.webkitRelativePath || f.name;
                    return isFuzzyMatch(url, uploadPath);
                });
                if (file) {
                    blob = file;
                } else {
                    result.missingLocalPaths.push(url);
                    result.errors.push({
                        path: url,
                        reason: "本地文件未找到 (路径不匹配)",
                        isLocalMissing: true
                    });
                    continue; 
                }
            }

            if (!blob) continue;

            const compressedBlob = await compressImage(blob, config.image);
            const ext = config.image.convertToWebP ? 'webp' : blob.type.split('/')[1] || 'jpg';
            const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
            const ossUrl = await uploadToOss(compressedBlob, filename, config.oss);

            newContent = newContent.split(url).join(ossUrl);
            result.processedCount++;

        } catch (error) {
            console.error(`Failed ${url}`, error);
            result.errors.push({ path: url, reason: (error as Error).message });
        }
    }

    result.content = newContent;
    return result;
};

// --- Connection Tester ---

export const testOssConfig = async (config: GlobalConfig['oss']): Promise<{success: boolean, message: string, url?: string}> => {
    if (!config.enabled) return { success: false, message: "对象存储未启用" };
    if (!config.bucket) return { success: false, message: "Bucket Name 不能为空" };
    if (!config.endpoint) return { success: false, message: "Endpoint 不能为空" };
    
    const testFilename = `test_connection_${Date.now()}.txt`;
    const testContent = "Hello from AI Blog CMS! This is a real upload test.";

    try {
        if (config.provider === 'oss') {
            const url = await uploadToAliyunOSS(testContent, testFilename, config);
            return { 
                success: true, 
                message: "连接成功！文件已真实上传至 OSS (请检查 Bucket)。", 
                url: url 
            };
        } else if (config.provider === 'minio') {
             const url = await uploadToMinIO(testContent, testFilename, config);
             return {
                success: true,
                message: "MinIO 连接请求已发送 (注意: 若无 SigV4 签名可能失败)。",
                url: url
             };
        } else {
             return { success: false, message: "Unsupported provider." };
        }
    } catch (e) {
        return { 
            success: false, 
            message: `连接失败: ${(e as Error).message}`,
        };
    }
};
