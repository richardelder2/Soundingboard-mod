// @ts-check

/**
 * @typedef {Object} SceneFrontmatter
 * @property {string} [id]
 * @property {string} [title]
 * @property {string} [pov]
 * @property {string} [time]
 * @property {string} [location]
 * @property {string} [valueShift] // e.g. "Ignorance -> Knowledge" or "- to +"
 * @property {string} [turningPoint]
 * @property {string} [status] // e.g. "draft" | "audited" | "complete"
 * @property {string[]} [tags]
 */

/**
 * Parses YAML frontmatter from a Markdown document without external dependencies.
 * @param {string} content
 * @returns {{ frontmatter: SceneFrontmatter, body: string }}
 */
export function parseFrontmatter(content) {
  if (!content || !content.startsWith('---')) {
    return { frontmatter: {}, body: content || '' };
  }

  const endIdx = content.indexOf('\n---', 3);
  if (endIdx === -1) {
    return { frontmatter: {}, body: content };
  }

  const rawYaml = content.slice(3, endIdx).trim();
  const body = content.slice(endIdx + 4).trim();
  /** @type {Record<string, any>} */
  const frontmatter = {};

  const lines = rawYaml.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    let val = trimmed.slice(colonIdx + 1).trim();

    // Remove quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }

    // Array parsing (e.g. [tag1, tag2])
    if (val.startsWith('[') && val.endsWith(']')) {
      const items = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
      frontmatter[key] = items;
    } else {
      frontmatter[key] = val;
    }
  }

  return { frontmatter, body };
}

/**
 * Extracts proper nouns, characters, and key locations deterministically from prose.
 * @param {string} text
 * @returns {{ characters: string[], locations: string[] }}
 */
export function harvestEntities(text) {
  if (!text) return { characters: [], locations: [] };

  // Match capitalized words that aren't at the start of a sentence
  // Pattern: space followed by CapitalizedWord
  const entityMatches = text.match(/(?<=[a-z,;]\s+)[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?/g) || [];
  
  const commonStopWords = new Set([
    'The', 'Then', 'There', 'They', 'This', 'That', 'These', 'Those', 'When',
    'Where', 'While', 'After', 'Before', 'Although', 'Because', 'Meanwhile',
    'Suddenly', 'Finally', 'However', 'Therefore', 'Perhaps', 'Instead'
  ]);

  const unique = Array.from(new Set(entityMatches))
    .filter((name) => !commonStopWords.has(name) && name.length > 2);

  return {
    characters: unique.slice(0, 20),
    locations: [],
  };
}
