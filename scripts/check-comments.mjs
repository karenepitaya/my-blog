import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', '.tmp', 'coverage']);
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.astro', '.css']);
const ALLOWED_PREFIXES = ['WHY:', 'CONTRACT:', 'PITFALL:', 'TODO(#', 'DOC:'];

const targets = [
  { label: 'server/src', dir: path.join(ROOT, 'server', 'src') },
  {
    label: 'admin/src',
    dir: path.join(ROOT, 'admin', 'src'),
    fallback: path.join(ROOT, 'admin'),
  },
  { label: 'frontend/src', dir: path.join(ROOT, 'frontend', 'src') },
];

function collectFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      files.push(...collectFiles(full));
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name);
    if (EXTENSIONS.has(ext)) files.push(full);
  }
  return files;
}

function isAllowedComment(text) {
  return ALLOWED_PREFIXES.some((prefix) => text.startsWith(prefix));
}

const REGEX_START_KEYWORDS = new Set([
  'return',
  'throw',
  'case',
  'else',
  'yield',
  'await',
  'typeof',
  'void',
  'delete',
  'in',
  'of',
  'do',
]);

function canStartRegex(prevChar) {
  if (!prevChar) return true;
  return /[({[=,:;!&|?+\-*%^~]/.test(prevChar);
}

function isIdentifierChar(ch) {
  return /[A-Za-z0-9_$]/.test(ch);
}

function findPrevNonSpace(line, index) {
  let i = index;
  while (i >= 0 && /\s/.test(line[i])) i -= 1;
  return i;
}

function shouldStartRegex(line, index) {
  const prevIndex = findPrevNonSpace(line, index - 1);
  if (prevIndex < 0) return true;
  const prevChar = line[prevIndex];
  if (canStartRegex(prevChar)) return true;
  if (prevChar === '>') {
    const prevPrev = findPrevNonSpace(line, prevIndex - 1);
    if (prevPrev >= 0 && line[prevPrev] === '=') return true;
  }
  if (isIdentifierChar(prevChar)) {
    let start = prevIndex;
    while (start >= 0 && isIdentifierChar(line[start])) start -= 1;
    const word = line.slice(start + 1, prevIndex + 1);
    if (REGEX_START_KEYWORDS.has(word)) return true;
  }
  return false;
}

function checkText(text, baseLine = 1, allowLicenseHeader = true) {
  const violations = [];
  const commentOnlyLines = new Set();
  const lines = text.split(/\r?\n/);

  let inBlockComment = false;
  let blockStartLine = 0;
  let blockContent = '';

  const record = (lineNumber, reason) => {
    violations.push({ line: baseLine + lineNumber - 1, reason });
  };

  let inTemplate = false;
  let inRegex = false;
  let inCharClass = false;

  for (let idx = 0; idx < lines.length; idx += 1) {
    const lineNumber = idx + 1;
    const line = lines[idx] ?? '';
    let i = 0;
    let inSingle = false;
    let inDouble = false;

    while (i < line.length) {
      const ch = line[i];
      const next = line[i + 1];

      if (inBlockComment) {
        const endIdx = line.indexOf('*/', i);
        if (endIdx === -1) {
          blockContent += line.slice(i) + '\n';
          i = line.length;
          continue;
        }
        blockContent += line.slice(i, endIdx);
        const isLicense = /license|copyright/i.test(blockContent);
        const atTop = blockStartLine === 1;
        if (!(allowLicenseHeader && atTop && isLicense)) {
          record(blockStartLine, 'Block comments are not allowed.');
        }
        inBlockComment = false;
        blockContent = '';
        i = endIdx + 2;
        continue;
      }

      if (inSingle) {
        if (ch === '\\' && next) {
          i += 2;
          continue;
        }
        if (ch === "'") {
          inSingle = false;
        }
        i += 1;
        continue;
      }

      if (inDouble) {
        if (ch === '\\' && next) {
          i += 2;
          continue;
        }
        if (ch === '"') {
          inDouble = false;
        }
        i += 1;
        continue;
      }

      if (inTemplate) {
        if (ch === '\\' && next) {
          i += 2;
          continue;
        }
        if (ch === '`') {
          inTemplate = false;
        }
        i += 1;
        continue;
      }

      if (inRegex) {
        if (ch === '\\' && next) {
          i += 2;
          continue;
        }
        if (ch === '[') {
          inCharClass = true;
          i += 1;
          continue;
        }
        if (ch === ']' && inCharClass) {
          inCharClass = false;
          i += 1;
          continue;
        }
        if (ch === '/' && !inCharClass) {
          inRegex = false;
          let j = i + 1;
          while (j < line.length && /[A-Za-z]/.test(line[j])) j += 1;
          i = j;
          continue;
        }
        i += 1;
        continue;
      }

      if (ch === '`') {
        inTemplate = true;
        i += 1;
        continue;
      }

      if (ch === "'") {
        inSingle = true;
        i += 1;
        continue;
      }

      if (ch === '"') {
        inDouble = true;
        i += 1;
        continue;
      }

      if (ch === '/' && next === '*') {
        inBlockComment = true;
        blockStartLine = lineNumber;
        blockContent = '';
        i += 2;
        continue;
      }

      if (ch === '/' && next === '/') {
        const before = line.slice(0, i);
        const isCommentOnly = before.trim().length === 0;
        const commentBody = line.slice(i + 2).trim();

        if (!isCommentOnly) {
          record(lineNumber, 'Inline comments are not allowed.');
        }

        if (!isAllowedComment(commentBody)) {
          record(lineNumber, 'Comment prefix must be WHY/CONTRACT/PITFALL/TODO(#id)/DOC.');
        }

        if (commentBody.startsWith('TODO') && !/^TODO\(#\d+\):/.test(commentBody)) {
          record(lineNumber, 'TODO must match TODO(#<number>):');
        }

        if (isCommentOnly) commentOnlyLines.add(lineNumber);
        break;
      }

      if (ch === '/' && shouldStartRegex(line, i)) {
        inRegex = true;
        inCharClass = false;
        i += 1;
        continue;
      }

      i += 1;
    }
  }

  if (inBlockComment) {
    record(blockStartLine || 1, 'Unterminated block comment.');
  }

  let consecutive = 0;
  for (let ln = 1; ln <= lines.length; ln += 1) {
    if (commentOnlyLines.has(ln)) {
      consecutive += 1;
      if (consecutive > 2) {
        record(ln, 'More than 2 consecutive comment lines.');
      }
    } else {
      consecutive = 0;
    }
  }

  return violations;
}

function extractAstroSegments(content) {
  const segments = [];
  const lines = content.split(/\r?\n/);
  if (lines[0]?.trim() === '---') {
    let end = 1;
    while (end < lines.length && lines[end].trim() !== '---') end += 1;
    const text = lines.slice(1, end).join('\n');
    segments.push({ text, startLine: 2 });
  }

  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(content))) {
    const scriptContent = match[1] ?? '';
    const before = content.slice(0, match.index);
    const startLine = before.split(/\r?\n/).length;
    segments.push({ text: scriptContent, startLine: startLine + 1 });
  }

  return segments;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const violations = [];
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.astro') {
    const segments = extractAstroSegments(content);
    for (const segment of segments) {
      violations.push(...checkText(segment.text, segment.startLine, false));
    }
    return violations;
  }

  return checkText(content, 1, true);
}

const allViolations = [];
for (const target of targets) {
  let dir = target.dir;
  if (!fs.existsSync(dir) && target.fallback) {
    dir = target.fallback;
  }
  if (!fs.existsSync(dir)) continue;
  const files = collectFiles(dir);
  for (const file of files) {
    const violations = checkFile(file);
    if (violations.length === 0) continue;
    for (const violation of violations) {
      allViolations.push({
        file,
        line: violation.line,
        reason: violation.reason,
      });
    }
  }
}

if (allViolations.length > 0) {
  for (const violation of allViolations) {
    const rel = path.relative(ROOT, violation.file);
    console.log(`${rel}:${violation.line} ${violation.reason}`);
  }
  process.exit(1);
}

console.log('Comment check passed.');
