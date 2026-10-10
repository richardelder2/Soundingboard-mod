// @ts-check
import { pathJoin } from './taxonomy.js';

/**
 * @typedef {Object} CraftEntry
 * @property {string} id
 * @property {string} title
 * @property {string} category
 * @property {string[]} tags
 * @property {string} summary
 * @property {string} relativePath
 */

/**
 * Queries the OKF Craft Knowledge catalogue using $.fs.
 */
export class CraftCatalog {
  /**
   * @param {any} $ Claude Code mod API interface
   * @param {string} craftDir
   */
  constructor($, craftDir) {
    this.$ = $;
    this.craftDir = craftDir;
    /** @type {CraftEntry[]} */
    this.entries = [];
  }

  async loadIndex() {
    const indexPath = pathJoin(this.craftDir, 'index.json');
    try {
      const data = await this.$.fs.read(indexPath);
      if (data) {
        this.entries = typeof data === 'string' ? JSON.parse(data) : data;
      }
    } catch {
      this.entries = [];
    }
  }

  /**
   * Search craft modules by keyword, topic, or tag.
   * @param {string} query
   * @returns {CraftEntry[]}
   */
  search(query) {
    if (!query) return this.entries.slice(0, 10);
    const q = query.toLowerCase();
    return this.entries.filter(
      (entry) =>
        entry.id.toLowerCase().includes(q) ||
        entry.title.toLowerCase().includes(q) ||
        entry.summary.toLowerCase().includes(q) ||
        entry.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  /**
   * Reads the full content of a specific craft module on demand.
   * @param {string} idOrPath
   * @returns {Promise<string | null>}
   */
  async readModule(idOrPath) {
    const isAbs = idOrPath.startsWith('/');
    const target = isAbs
      ? idOrPath
      : pathJoin(this.craftDir, idOrPath.endsWith('.md') ? idOrPath : `${idOrPath}.md`);

    try {
      const content = await this.$.fs.read(target);
      return typeof content === 'string' ? content : null;
    } catch {
      return null;
    }
  }
}
