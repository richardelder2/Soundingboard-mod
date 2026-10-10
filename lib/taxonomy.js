// @ts-check
import fs from 'node:fs';
import path from 'node:path';

/**
 * @typedef {Object} SoundingboardProject
 * @property {string} rootPath
 * @property {boolean} isSoundingboard
 * @property {number} tier
 * @property {string[]} activePaths
 */

/**
 * Resolves the Soundingboard workspace root and detects active complexity tier.
 * @param {string} [startDir]
 * @returns {SoundingboardProject}
 */
export function resolveWorkspace(startDir = process.cwd()) {
  let current = path.resolve(startDir);
  
  while (true) {
    const hasWritersRoom = fs.existsSync(path.join(current, 'writers_room'));
    const hasStages = fs.existsSync(path.join(current, 'stages')) || fs.existsSync(path.join(current, 'manuscript'));
    const hasPreferences = fs.existsSync(path.join(current, 'preferences.md'));
    const hasAgents = fs.existsSync(path.join(current, 'AGENTS.md'));

    if (hasWritersRoom || hasStages || hasPreferences || hasAgents) {
      let tier = 0;
      const activePaths = [];

      if (hasWritersRoom) {
        tier = 0;
        activePaths.push('writers_room');
      }
      if (hasStages) {
        tier = 1;
        activePaths.push('stages');
      }
      if (fs.existsSync(path.join(current, 'series'))) {
        tier = 2;
        activePaths.push('series');
      }
      if (fs.existsSync(path.join(current, 'world'))) {
        tier = 3;
        activePaths.push('world');
      }

      return {
        rootPath: current,
        isSoundingboard: true,
        tier,
        activePaths,
      };
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return {
    rootPath: path.resolve(startDir),
    isSoundingboard: false,
    tier: 0,
    activePaths: [],
  };
}

/**
 * Checks whether a given file path is quarantined inside the writers_room immunity shield.
 * @param {string} targetPath
 * @returns {boolean}
 */
export function isImmunePath(targetPath) {
  if (!targetPath) return false;
  const normalized = targetPath.replace(/\\/g, '/');
  return normalized.includes('/writers_room/') || normalized.startsWith('writers_room/');
}

/**
 * Checks whether a target file path represents a staged scene in Tier 1.
 * @param {string} targetPath
 * @returns {boolean}
 */
export function isStagedScenePath(targetPath) {
  if (!targetPath) return false;
  const normalized = targetPath.replace(/\\/g, '/');
  return (
    (normalized.includes('/stages/') ||
      normalized.startsWith('stages/') ||
      normalized.includes('/manuscript/scenes/') ||
      normalized.startsWith('manuscript/scenes/')) &&
    normalized.endsWith('.md')
  );
}

