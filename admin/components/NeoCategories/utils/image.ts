type CoverImageOptions = {
  maxWidth?: number;
  aspectRatio?: number;
  quality?: number;
  format?: 'image/webp' | 'image/jpeg';
};

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.loading = 'eager';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('IMAGE_LOAD_FAILED'));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function cropRectForAspect(input: { width: number; height: number; aspect: number }) {
  const srcAspect = input.width / input.height;
  if (!Number.isFinite(srcAspect) || input.width <= 0 || input.height <= 0) {
    return { sx: 0, sy: 0, sw: input.width, sh: input.height };
  }
  if (Math.abs(srcAspect - input.aspect) < 0.0001) {
    return { sx: 0, sy: 0, sw: input.width, sh: input.height };
  }

  if (srcAspect > input.aspect) {
    const sh = input.height;
    const sw = Math.round(sh * input.aspect);
    const sx = Math.round((input.width - sw) / 2);
    return { sx, sy: 0, sw, sh };
  }

  const sw = input.width;
  const sh = Math.round(sw / input.aspect);
  const sy = Math.round((input.height - sh) / 2);
  return { sx: 0, sy, sw, sh };
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('IMAGE_ENCODE_FAILED'));
        resolve(blob);
      },
      type,
      quality
    );
  });
}

export async function prepareCategoryCoverImage(file: File, options: CoverImageOptions = {}): Promise<File> {
  const maxWidth = Math.max(320, Math.floor(options.maxWidth ?? 1600));
  const aspect = Math.max(0.1, options.aspectRatio ?? 16 / 9);
  const quality = Math.min(0.95, Math.max(0.4, options.quality ?? 0.82));
  const preferredFormat = options.format ?? 'image/webp';

  const img = await loadImageFromFile(file);
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;

  const crop = cropRectForAspect({ width: srcW, height: srcH, aspect });
  const scale = Math.min(1, maxWidth / crop.sw);
  const outW = Math.max(1, Math.floor(crop.sw * scale));
  const outH = Math.max(1, Math.floor(crop.sh * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('CANVAS_UNAVAILABLE');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, outW, outH);

  let blob: Blob;
  try {
    blob = await canvasToBlob(canvas, preferredFormat, quality);
  } catch {
    blob = await canvasToBlob(canvas, 'image/jpeg', quality);
  }

  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const baseName = (file.name || 'cover').replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.${ext}`, { type: blob.type });
}
