// @ts-check
import { resolveWorkspace, pathJoin, pathBasename } from '../../lib/taxonomy.js';
import { estimateTokens, checkTokenBudget } from '../../lib/tokens.js';

/**
 * Registers natural, craft-first slash commands:
 * /studio, /story-status, /checkpoint, /graduate
 *
 * @param {Function} on Claude Code mod hook registration function
 */
export function registerCommands(on) {
  // session.start: Register slash commands
  on('session.start', async ($, e, next) => {
    // 1. /studio - Opens the visual workspace pane
    await $.command.register({
      name: 'studio',
      description: 'Open the Soundingboard Studio pane (Token ledger, continuity, craft codex)',
      immediate: true,
    });

    // 2. /story-status - Instant story health check without burning a Claude turn
    await $.command.register({
      name: 'story-status',
      description: 'Display story ledger, active tier, and token footprints',
      immediate: true,
    });

    // 3. /checkpoint - Creative Git commit (Playbook #21)
    await $.command.register({
      name: 'checkpoint',
      description: 'Record narrative evolution to Git with a craft message',
      argumentHint: '[commit message]',
    });

    // 4. /graduate - Promotes a draft from writers_room/ into stages/
    await $.command.register({
      name: 'graduate',
      description: 'Promote a drafted scene from writers_room to stages/ and update canon',
      argumentHint: '<draft-file>',
    });

    return next(e);
  });

  // Handle /studio
  on('command.run', { command: 'studio' }, async ($) => {
    await $.ui.open({
      id: 'soundingboard-studio',
      title: 'Soundingboard Studio',
      focus: true,
      closeOnEscape: true,
    });
    return {};
  });

  // Handle /story-status
  on('command.run', { command: 'story-status' }, async ($) => {
    const ws = await resolveWorkspace($);
    if (!ws.isSoundingboard) {
      return {
        text: 'Not in a Soundingboard workspace. Type `/init` to scaffold a novel studio.',
      };
    }

    // Inspect canon and scenes using $.fs
    let canonTokens = 0;
    const canonPath = pathJoin(ws.rootPath, 'stages', 'canon.md');
    try {
      const canonData = await $.fs.read(canonPath);
      if (typeof canonData === 'string') {
        canonTokens = estimateTokens(canonData);
      }
    } catch {
      canonTokens = 0;
    }

    const canonBudget = checkTokenBudget('canon', canonTokens);

    let sceneCount = 0;
    const stagesDir = pathJoin(ws.rootPath, 'stages');
    try {
      const stageFiles = await $.fs.list(stagesDir);
      if (Array.isArray(stageFiles)) {
        sceneCount = stageFiles.filter((f) => {
          const name = typeof f === 'string' ? f : f?.name || '';
          return name.endsWith('.md') && name !== 'canon.md';
        }).length;
      }
    } catch {
      sceneCount = 0;
    }

    const report = [
      `### 📖 Soundingboard Story Status (Tier ${ws.tier})`,
      `* **Workspace:** \`${ws.rootPath}\``,
      `* **Active Layers:** ${ws.activePaths.join(', ') || 'none'}`,
      `* **Staged Scenes:** ${sceneCount} atomic scene(s)`,
      `* **Canon Token Footprint:** ${canonTokens} / ${canonBudget.limit} tokens (${canonBudget.status.toUpperCase()})`,
      `* **Mode:** Solo / Human Red Pen Active`,
    ].join('\n');

    return { text: report };
  });

  // Handle /graduate: Move a draft from writers_room/ to stages/ using $.fs.read and $.fs.write
  on('command.run', { command: 'graduate' }, async ($, e) => {
    const fileArg = e.args?.trim();
    if (!fileArg) {
      return { text: 'Usage: `/graduate <file>` (e.g. `/graduate writers_room/drafts/ch1_opening.md`)' };
    }

    const ws = await resolveWorkspace($);
    const sourcePath = fileArg.startsWith('/') ? fileArg : pathJoin(ws.rootPath, fileArg);

    let draftContent = null;
    try {
      draftContent = await $.fs.read(sourcePath);
    } catch {
      draftContent = null;
    }

    if (!draftContent) {
      return { text: `❌ File not found or unreadable: \`${fileArg}\`` };
    }

    const baseName = pathBasename(sourcePath);
    const targetPath = pathJoin(ws.rootPath, 'stages', baseName);

    try {
      await $.fs.write(targetPath, draftContent);
      return {
        text: `🎓 Scene successfully graduated to stages!\n* Source: \`${sourcePath}\`\n* Staged: \`${targetPath}\`\n\nThe Immunity Shield is lifted; scene is now part of the canonical production pool.`
      };
    } catch (err) {
      return { text: `❌ Failed to graduate scene: ${err?.message || 'write failed'}` };
    }
  });

  // Handle /checkpoint (Playbook #21) using $.process.run
  on('command.run', { command: 'checkpoint' }, async ($, e) => {
    const msg = e.args?.trim() || 'Narrative evolution checkpoint';
    try {
      const res = await $.process.run(['git', 'commit', '-am', `[sb-checkpoint] ${msg}`]);
      if (res && res.exitCode === 0) {
        return { text: `✅ Checkpoint recorded in Git: "${msg}"` };
      } else {
        const errDetail = res?.stderr || res?.stdout || 'Nothing to commit or git error.';
        return { text: `⚠️ Checkpoint notice: ${errDetail.trim()}` };
      }
    } catch (err) {
      return { text: `⚠️ Checkpoint failed: ${err?.message || 'Git not initialized.'}` };
    }
  });
}
