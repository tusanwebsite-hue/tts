/**
 * Persian text processing and normalization utilities for TTS.
 * Cleans up typos, removes duplicate words (stutters), normalizes Arabic/Persian characters,
 * applies zwnj (half-space) where needed, and formats text for natural, fluent speech generation.
 */

export interface TextRefineOptions {
  mode: 'fluent_colloquial' | 'formal_broadcasting' | 'phonetic_diacritics';
  fixStutters?: boolean;
  cleanTypos?: boolean;
  addPhoneticHints?: boolean;
}

export interface RefinedResult {
  refinedText: string;
  detectedIssues: {
    original: string;
    fixed: string;
    reason: string;
  }[];
  wordCount: number;
  estimatedDurationSeconds: number;
  sentences: string[];
}

/**
 * Standard Persian character normalization:
 * Replaces Arabic Yeh/Kaf with Persian equivalents and cleans up spaces.
 */
export function normalizeChars(text: string): string {
  return text
    .replace(/\u064A/g, '\u06CC') // Arabic Yeh -> Persian Yeh
    .replace(/\u0643/g, '\u06a9') // Arabic Kaf -> Persian Kaf
    .replace(/\u06c0/g, '\u0647\u200c\u06cc') // Heh with Yeh above -> Heh + ZWNJ + Yeh
    .replace(/[\u200B\uFEFF]/g, '') // Zero-width spaces (not ZWNJ)
    .replace(/\r\n/g, '\n');
}

/**
 * Detects and removes adjacent duplicate words like "تو تو", "که که", "من من"
 */
export function removeStutters(text: string): { cleaned: string; issues: { original: string; fixed: string; reason: string }[] } {
  const issues: { original: string; fixed: string; reason: string }[] = [];
  
  // Persian word regex: match word followed by same word, bounded by non-Persian/space/punctuation
  const duplicateRegex = /(^|[^\u0600-\u06FF\u200c])([\u0600-\u06FF]+)\s+\2(?=[^\u0600-\u06FF\u200c]|$)/gu;
  
  const cleaned = text.replace(duplicateRegex, (match, prefix, word) => {
    issues.push({
      original: `${word} ${word}`,
      fixed: word,
      reason: `حذف تکرار ناخواسته کلمه «${word}» (تپق یا غلط املایی)`,
    });
    return `${prefix}${word}`;
  });

  return { cleaned, issues };
}

/**
 * Helper to build regex for whole Persian word
 */
function makePersianWordRegex(word: string, flags = 'gu'): RegExp {
  return new RegExp(`(^|[^\\u0600-\\u06FF\\u200c])${word}(?=[^\\u0600-\\u06FF\\u200c]|$)`, flags);
}

/**
 * Common typo mappings and phonetic clarity adjustments for Persian text
 */
const COMMON_REPLACEMENTS: { word: string; replacement: string; reason: string }[] = [
  {
    word: 'هس',
    replacement: 'هست',
    reason: 'اصلاح غلط املایی «هس» به «هست» برای بیان روان و صحیح',
  },
  {
    word: 'شمام',
    replacement: 'شما هم',
    reason: 'روان‌سازی «شمام» به «شما هم» جهت وضوح گفتار',
  },
  {
    word: 'سرویسای',
    replacement: 'سرویس‌های',
    reason: 'اصلاح نگارش «سرویسای» به «سرویس‌های» با نیم‌فاصله مناسب',
  },
  {
    word: 'فروشا',
    replacement: 'فروش‌ها',
    reason: 'اصلاح نگارش «فروشا» به «فروش‌ها» با نیم‌فاصله',
  },
  {
    word: 'هر ماهم',
    replacement: 'هر ماه هم',
    reason: 'جداسازی ترکیب «هر ماهم» به «هر ماه هم» برای رسایی تلفظ',
  },
];

/**
 * Smart rules for Persian colloquial vs formal speech
 */
export function refinePersianText(rawText: string, options: TextRefineOptions): RefinedResult {
  let text = normalizeChars(rawText);
  const issues: { original: string; fixed: string; reason: string }[] = [];

  // 1. Remove duplicate words / stutters if requested
  if (options.fixStutters !== false) {
    const stutterResult = removeStutters(text);
    text = stutterResult.cleaned;
    issues.push(...stutterResult.issues);
  }

  // 2. Fix known typos & word endings
  if (options.cleanTypos !== false) {
    for (const item of COMMON_REPLACEMENTS) {
      const reg = makePersianWordRegex(item.word);
      if (reg.test(text)) {
        text = text.replace(reg, (match, prefix) => {
          issues.push({
            original: item.word,
            fixed: item.replacement,
            reason: item.reason,
          });
          return `${prefix}${item.replacement}`;
        });
      }
    }
  }

  // 3. Mode adjustments
  if (options.mode === 'formal_broadcasting') {
    // Convert colloquial words to formal Persian
    const formalMap: [string, string, string][] = [
      ['برا', 'برای', 'تبدیل محاوره «برا» به رسمی «برای»'],
      ['بتونین', 'بتوانید', 'تبدیل افعال محاوره‌ای به رسمی'],
      ['نصب کنین', 'نصب کنید', 'تبدیل فعل دوم شخص جمع به صورت رسمی'],
      ['استفاده کنین', 'استفاده کنید', 'تبدیل به لحن فاخر رسمی'],
      ['جستجو کنین', 'جستجو کنید', 'تبدیل به لحن رسمی'],
      ['بگردین', 'بگردید', 'تبدیل به لحن رسمی'],
      ['فعالش کنین', 'فعالش کنید', 'تبدیل به لحن رسمی'],
      ['بهتون میده', 'به شما ارائه می‌دهد', 'تبدیل به بیان شیوای رسمی'],
      ['اگه', 'اگر', 'تبدیل «اگه» به «اگر»'],
      ['لازمش دارن', 'به آن نیاز دارند', 'تبدیل به نگارش دقیق رسمی'],
      ['براشون بفرست', 'برای آن‌ها بفرستید', 'تبدیل به توصیه رسمی'],
    ];

    for (const [word, replacement, reason] of formalMap) {
      const reg = makePersianWordRegex(word);
      if (reg.test(text)) {
        text = text.replace(reg, (match, prefix) => {
          issues.push({ original: word, fixed: replacement, reason });
          return `${prefix}${replacement}`;
        });
      }
    }
  } else if (options.mode === 'phonetic_diacritics') {
    // Apply key diacritics to tricky technology words and loanwords
    const diacriticsMap: [string, string, string][] = [
      ['جمینای', 'جِمینای', 'اعراب‌گذاری کلمه اختصاصی Gemini'],
      ['فلو', 'فِلو', 'اعراب‌گذاری کلمه Flow'],
      ['وی پی ان', 'وی‌پی‌اِن', 'تثبیت نیم‌فاصله و تلفظ VPN'],
      ['وی‌پی‌ان', 'وی‌پی‌اِن', 'اعراب‌گذاری VPN'],
      ['آیپی', 'آی‌پی', 'نیم‌فاصله کلمه IP'],
      ['فایرفاکس', 'فایِرفاکس', 'اعراب‌گذاری Firefox'],
    ];

    for (const [word, replacement, reason] of diacriticsMap) {
      const reg = makePersianWordRegex(word);
      if (reg.test(text)) {
        text = text.replace(reg, (match, prefix) => {
          issues.push({ original: word, fixed: replacement, reason });
          return `${prefix}${replacement}`;
        });
      }
    }
  }

  // Segment into sentences for synchronous display and audio chunking
  const sentences = text
    .split(/[\n.!?؛]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const wordCount = text.split(/\s+/).filter(w => w.trim().length > 0).length;
  // Persian speech average rate is approx 130-150 words per minute (~2.3 words/sec)
  const estimatedDurationSeconds = Math.max(2, Math.round((wordCount / 2.3) * 10) / 10);

  return {
    refinedText: text.trim(),
    detectedIssues: issues,
    wordCount,
    estimatedDurationSeconds,
    sentences,
  };
}

/**
 * Builds the TTS style instruction prompt for Gemini 3.8 Flash TTS
 */
export function buildTtsStylePrompt(style: 'reels_colloquial' | 'formal' | 'educational' | 'friendly'): string {
  switch (style) {
    case 'reels_colloquial':
      return 'Speak in natural, lively Persian (Farsi) as an engaging social media / Instagram Reels tech creator. Fast-paced, warm, natural intonation without stumbles, clear pronunciation of tech terms like VPN, Firefox, Gemini.';
    case 'formal':
      return 'Speak in polished, professional, broadcast-quality Persian (Farsi). Clear articulation, measured pacing, authoritative and pleasant radio voice tone.';
    case 'educational':
      return 'Speak in an energetic and crystal-clear Persian teacher tone. Emphasize key action steps clearly, pacing thoughtfully so listeners can easily follow.';
    case 'friendly':
    default:
      return 'Speak in a warm, friendly, conversational Persian tone. Relaxed, fluent, authentic phrasing with natural voice cadence.';
  }
}
