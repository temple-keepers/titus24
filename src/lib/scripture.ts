/**
 * Scripture reference normalisation. Sisters type "Prov 3:5", "Proverbs
 * 3:5-6", "1 cor 13", "1Cor13", "psalm 23". We turn any of those into a
 * canonical form so a search for "Prov 3" finds devotionals stored
 * with "Proverbs 3:5".
 */

const BOOKS: Array<{ canonical: string; aliases: string[] }> = [
  // Old Testament
  { canonical: 'Genesis', aliases: ['gen', 'ge'] },
  { canonical: 'Exodus', aliases: ['exo', 'ex'] },
  { canonical: 'Leviticus', aliases: ['lev', 'le'] },
  { canonical: 'Numbers', aliases: ['num', 'nu'] },
  { canonical: 'Deuteronomy', aliases: ['deut', 'dt'] },
  { canonical: 'Joshua', aliases: ['josh', 'jos'] },
  { canonical: 'Judges', aliases: ['judg', 'jdg'] },
  { canonical: 'Ruth', aliases: ['ru'] },
  { canonical: '1 Samuel', aliases: ['1 sam', '1sam', '1sa', 'i samuel'] },
  { canonical: '2 Samuel', aliases: ['2 sam', '2sam', '2sa', 'ii samuel'] },
  { canonical: '1 Kings', aliases: ['1 kgs', '1kgs', '1ki'] },
  { canonical: '2 Kings', aliases: ['2 kgs', '2kgs', '2ki'] },
  { canonical: '1 Chronicles', aliases: ['1 chron', '1chr', '1ch'] },
  { canonical: '2 Chronicles', aliases: ['2 chron', '2chr', '2ch'] },
  { canonical: 'Ezra', aliases: ['ezr'] },
  { canonical: 'Nehemiah', aliases: ['neh', 'ne'] },
  { canonical: 'Esther', aliases: ['est'] },
  { canonical: 'Job', aliases: ['jb'] },
  { canonical: 'Psalm', aliases: ['psalms', 'ps', 'psa'] },
  { canonical: 'Proverbs', aliases: ['prov', 'pr', 'pro'] },
  { canonical: 'Ecclesiastes', aliases: ['eccl', 'ecc', 'ec'] },
  { canonical: 'Song of Solomon', aliases: ['song', 'sos', 'song of songs'] },
  { canonical: 'Isaiah', aliases: ['isa', 'is'] },
  { canonical: 'Jeremiah', aliases: ['jer', 'je'] },
  { canonical: 'Lamentations', aliases: ['lam'] },
  { canonical: 'Ezekiel', aliases: ['ezek', 'eze'] },
  { canonical: 'Daniel', aliases: ['dan', 'da'] },
  { canonical: 'Hosea', aliases: ['hos'] },
  { canonical: 'Joel', aliases: ['jl'] },
  { canonical: 'Amos', aliases: ['am'] },
  { canonical: 'Obadiah', aliases: ['obad', 'ob'] },
  { canonical: 'Jonah', aliases: ['jon'] },
  { canonical: 'Micah', aliases: ['mic'] },
  { canonical: 'Nahum', aliases: ['nah'] },
  { canonical: 'Habakkuk', aliases: ['hab'] },
  { canonical: 'Zephaniah', aliases: ['zeph'] },
  { canonical: 'Haggai', aliases: ['hag'] },
  { canonical: 'Zechariah', aliases: ['zech', 'zec'] },
  { canonical: 'Malachi', aliases: ['mal'] },
  // New Testament
  { canonical: 'Matthew', aliases: ['matt', 'mt'] },
  { canonical: 'Mark', aliases: ['mk', 'mar'] },
  { canonical: 'Luke', aliases: ['lk', 'luk'] },
  { canonical: 'John', aliases: ['jn', 'joh'] },
  { canonical: 'Acts', aliases: ['act'] },
  { canonical: 'Romans', aliases: ['rom', 'ro'] },
  { canonical: '1 Corinthians', aliases: ['1 cor', '1cor', '1co', 'i corinthians'] },
  { canonical: '2 Corinthians', aliases: ['2 cor', '2cor', '2co', 'ii corinthians'] },
  { canonical: 'Galatians', aliases: ['gal'] },
  { canonical: 'Ephesians', aliases: ['eph'] },
  { canonical: 'Philippians', aliases: ['phil', 'php'] },
  { canonical: 'Colossians', aliases: ['col'] },
  { canonical: '1 Thessalonians', aliases: ['1 thess', '1thess', '1th'] },
  { canonical: '2 Thessalonians', aliases: ['2 thess', '2thess', '2th'] },
  { canonical: '1 Timothy', aliases: ['1 tim', '1tim', '1ti'] },
  { canonical: '2 Timothy', aliases: ['2 tim', '2tim', '2ti'] },
  { canonical: 'Titus', aliases: ['tit'] },
  { canonical: 'Philemon', aliases: ['phlm'] },
  { canonical: 'Hebrews', aliases: ['heb'] },
  { canonical: 'James', aliases: ['jas'] },
  { canonical: '1 Peter', aliases: ['1 pet', '1pet', '1pe'] },
  { canonical: '2 Peter', aliases: ['2 pet', '2pet', '2pe'] },
  { canonical: '1 John', aliases: ['1 jn', '1jn'] },
  { canonical: '2 John', aliases: ['2 jn', '2jn'] },
  { canonical: '3 John', aliases: ['3 jn', '3jn'] },
  { canonical: 'Jude', aliases: [] },
  { canonical: 'Revelation', aliases: ['rev', 'revelations', 're'] },
];

/**
 * If the input looks like a scripture reference, return a canonical book
 * name (and optionally chapter:verse) that we can match against stored
 * scripture_ref columns. Returns null if the input doesn't parse as a
 * reference at all — caller should fall back to plain text search.
 */
export function parseScriptureRef(raw: string): { book: string; remainder: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Match leading book name (with optional 1/2/3 prefix and a space) and
  // an optional chapter:verse remainder. Tolerant of missing space:
  // "1Cor13", "1cor 13", "1 cor 13:4-7".
  const m = trimmed.match(/^((?:[123]\s?)?[a-zA-Z]+)\.?\s*(.*)$/);
  if (!m) return null;
  const candidate = m[1].toLowerCase().replace(/\s+/g, ' ').trim();
  const remainder = m[2].trim();

  for (const b of BOOKS) {
    const names = [b.canonical.toLowerCase(), ...b.aliases.map((a) => a.toLowerCase())];
    if (names.includes(candidate)) {
      return { book: b.canonical, remainder };
    }
  }
  return null;
}

/**
 * Build a list of search variants the user's query might match against
 * stored scripture references. For "Prov 3:5" we return:
 *   ["Prov 3:5", "Proverbs 3:5"]
 * so an ILIKE match against either variant succeeds.
 */
export function scriptureSearchVariants(raw: string): string[] {
  const parsed = parseScriptureRef(raw);
  if (!parsed) return [raw];
  const variants = new Set<string>();
  variants.add(raw);
  variants.add(parsed.remainder ? `${parsed.book} ${parsed.remainder}` : parsed.book);
  return Array.from(variants);
}
