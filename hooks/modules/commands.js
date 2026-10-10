// @ts-check
import { resolveWorkspace } from '../../lib/taxonomy.js';
import { estimateTokens, checkTokenBudget } from '../../lib/tokens.js';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Registers natural, craft-first slash commands:
 * /studio, /status, /checkpoint, /graduate
 *
 * @param {Function} on Claude Code mod hook registration function
 */
export function registerCommands(on) {
  // session.start: Register slash commands
  on('session.start', async ($, e, next) => {
    // 1. /studio (or /soundingboard) - Opens the visual workspace pane
    await $.command.register({
      name: 'studio',
      description: 'Open the Soundingboard Studio pane (Token ledger, continuity, craft codex)',
      immediate: true,
    });

    // 2. /story-status - Instant 10ms story health check without burning a Claude turn
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
  on('command.run', { command: 'story-status' }, async () => {
    const ws = resolveWorkspace();
    if (!ws.isSoundingboard) {
      return {
        text: 'Not in a Soundingboard workspace. Type `/init` to scaffold a novel studio.',
      };
    }

    // Inspect canon and scenes
    let canonTokens = 0;
    const canonPath = path.join(ws.rootPath, 'stages', 'canon.md');
    if (fs.existsSync(canonPath)) {
      canonTokens = estimateTokens(fs.readFileSync(canonPath, 'utf-8'));
    }

    const canonBudget = checkTokenBudget('canon', canonTokens);

    let sceneCount = 0;
    const stagesDir = path.join(ws.rootPath, 'stages');
    if (fs.existsSync(stagesDir)) {
      sceneCount = fs.readdirSync(stagesDir).filter((f) => f.endsWith('.md') && f !== 'canon.md').length;
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

  // Handle /graduate: Move a draft from writers_room/ to stages/
  on('command.run', { command: 'graduate' }, async ($, e) => {
    const fileArg = e.args?.trim();
    if (!fileArg) {
      return { text: 'Usage: `/graduate <file>` (e.g. `/graduate writers_room/drafts/ch1_opening.md`)' };
    }

    const ws = resolveWorkspace();
    const sourcePath = path.isAbsolute(fileArg) ? fileArg : path.join(ws.rootPath, fileArg);

    if (!fs.existsSync(sourcePath)) {
      return { text: `❌ File not found: \`${fileArg}\`` };
    }

    const baseName = path.basename(sourcePath);
    const stagesDir = path.join(ws.rootPath, 'stages');
    if (!fs.existsSync(stagesDir)) {
      fs.mkdirSync(stagesDir, { recursive: true });
    }

    const targetPath = path.join(stagesDir, baseName);
    fs.copyFileSync(sourcePath, targetPath);

    return {
      text: `🎓 Scene successfully graduated to stages!\n* Source: \`${sourcePath}\`\n* Staged: \`${targetPath}\`\n\nThe Immunity Shield is lifted; scene is now part of the canonical production pool.`
    };
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
