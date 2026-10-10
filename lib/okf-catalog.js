// @ts-check
import fs from 'node:fs';
import path from 'node:path';

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
 * Queries the OKF Craft Knowledge catalogue.
 */
export class CraftCatalog {
  /**
   * @param {string} craftDir
   */
  constructor(craftDir) {
    this.craftDir = craftDir;
    /** @type {CraftEntry[]} */
    this.entries = [];
    this.loadIndex();
  }

  loadIndex() {
    const indexPath = path.join(this.craftDir, 'index.json');
    if (fs.existsSync(indexPath)) {
      try {
        this.entries = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      } catch (e) {
        this.entries = [];
      }
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
   * @returns {string | null}
   */
  readModule(idOrPath) {
    const target = path.isAbsolute(idOrPath)
      ? idOrPath
      : path.join(this.craftDir, idOrPath.endsWith('.md') ? idOrPath : `${idOrPath}.md`);

    if (fs.existsSync(target)) {
      return fs.readFileSync(target, 'utf-8');
    }
    return null;
  }
}
