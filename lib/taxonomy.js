// @ts-check

/**
 * Path join helper without node:path.
 * @param  {...string} parts
 * @returns {string}
 */
export function pathJoin(...parts) {
  return parts
    .filter(Boolean)
    .map((p, i) => {
      let cleaned = p.replace(/\\/g, '/');
      if (i > 0) cleaned = cleaned.replace(/^\/+/, '');
      if (i < parts.length - 1) cleaned = cleaned.replace(/\/+$/, '');
      return cleaned;
    })
    .filter(Boolean)
    .join('/');
}

/**
 * Path dirname helper without node:path.
 * @param {string} p
 * @returns {string}
 */
export function pathDirname(p) {
  const normalized = p.replace(/\\/g, '/').replace(/\/+$/, '');
  const lastSlash = normalized.lastIndexOf('/');
  if (lastSlash === -1) return '.';
  if (lastSlash === 0) return '/';
  return normalized.slice(0, lastSlash);
}

/**
 * Path basename helper without node:path.
 * @param {string} p
 * @returns {string}
 */
export function pathBasename(p) {
  const normalized = p.replace(/\\/g, '/').replace(/\/+$/, '');
  const lastSlash = normalized.lastIndexOf('/');
  return lastSlash === -1 ? normalized : normalized.slice(lastSlash + 1);
}

/**
 * @typedef {Object} SoundingboardProject
 * @property {string} rootPath
 * @property {boolean} isSoundingboard
 * @property {number} tier
 * @property {string[]} activePaths
 */

/**
 * Helper to check file or directory existence via $.fs.stat.
 * @param {any} $
 * @param {string} targetPath
 * @returns {Promise<boolean>}
 */
async function exists($, targetPath) {
  if (!$?.fs?.stat) return false;
  try {
    const res = await $.fs.stat(targetPath);
    return Boolean(res);
  } catch {
    return false;
  }
}

/**
 * Resolves the Soundingboard workspace root and detects active complexity tier using $.fs.
 * @param {any} $ Claude Code mod API interface
 * @param {string} [startDir]
 * @returns {Promise<SoundingboardProject>}
 */
export async function resolveWorkspace($, startDir = '') {
  let current = (startDir || '').replace(/\\/g, '/').replace(/\/+$/, '');
  if (!current) current = '.';

  while (true) {
    const hasWritersRoom = await exists($, pathJoin(current, 'writers_room'));
    const hasStages = (await exists($, pathJoin(current, 'stages'))) || (await exists($, pathJoin(current, 'manuscript')));
    const hasPreferences = await exists($, pathJoin(current, 'preferences.md'));
    const hasAgents = await exists($, pathJoin(current, 'AGENTS.md'));

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
      if (await exists($, pathJoin(current, 'series'))) {
        tier = 2;
        activePaths.push('series');
      }
      if (await exists($, pathJoin(current, 'world'))) {
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

    const parent = pathDirname(current);
    if (parent === current || current === '.' || current === '/') break;
    current = parent;
  }

  return {
    rootPath: startDir || '.',
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
