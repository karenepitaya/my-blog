import { sniffImageType } from './imageType';

export type FileCategory = 'image' | 'audio' | 'video';

export type SniffedFileType = {
  category: FileCategory;
  mimeType: string;
  ext: string;
};

function sniffSvg(buffer: Buffer): SniffedFileType | null {
  if (!buffer || buffer.length === 0) return null;
  const head = buffer.slice(0, 512).toString('utf8').trim().toLowerCase();
  if (head.includes('<svg')) {
    return { category: 'image', mimeType: 'image/svg+xml', ext: 'svg' };
  }
  return null;
}

function sniffIco(buffer: Buffer): SniffedFileType | null {
  if (buffer.length < 4) return null;
  if (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00) {
    return { category: 'image', mimeType: 'image/x-icon', ext: 'ico' };
  }
  return null;
}

function sniffMp3(buffer: Buffer): SniffedFileType | null {
  if (buffer.length < 3) return null;
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    return { category: 'audio', mimeType: 'audio/mpeg', ext: 'mp3' };
  }
  if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
    return { category: 'audio', mimeType: 'audio/mpeg', ext: 'mp3' };
  }
  return null;
}

function sniffWav(buffer: Buffer): SniffedFileType | null {
  if (buffer.length < 12) return null;
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x41 &&
    buffer[10] === 0x56 &&
    buffer[11] === 0x45
  ) {
    return { category: 'audio', mimeType: 'audio/wav', ext: 'wav' };
  }
  return null;
}

function sniffOgg(buffer: Buffer): SniffedFileType | null {
  if (buffer.length < 4) return null;
  if (buffer[0] === 0x4f && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
    return { category: 'audio', mimeType: 'audio/ogg', ext: 'ogg' };
  }
  return null;
}

function sniffMp4(buffer: Buffer): SniffedFileType | null {
  if (buffer.length < 12) return null;
  if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    return { category: 'video', mimeType: 'video/mp4', ext: 'mp4' };
  }
  return null;
}

export function sniffFileType(buffer: Buffer): SniffedFileType | null {
  const image = sniffImageType(buffer);
  if (image) {
    return { category: 'image', mimeType: image.mimeType, ext: image.ext };
  }

  const svg = sniffSvg(buffer);
  if (svg) return svg;

  const ico = sniffIco(buffer);
  if (ico) return ico;

  const mp3 = sniffMp3(buffer);
  if (mp3) return mp3;

  const wav = sniffWav(buffer);
  if (wav) return wav;

  const ogg = sniffOgg(buffer);
  if (ogg) return ogg;

  const mp4 = sniffMp4(buffer);
  if (mp4) return mp4;

  return null;
}
