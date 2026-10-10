// @ts-check
import { registerGuardrails } from './modules/guardrails.js';
import { registerCommands } from './modules/commands.js';
import { registerStudioPane } from './modules/ui-pane.js';
import { CraftCatalog } from '../lib/okf-catalog.js';
import { pathJoin } from '../lib/taxonomy.js';

/**
 * Main Claude Code Mod entry point.
 * Claude Code calls register(on, options) when the mod loads.
 *
 * @param {Function} on The hook registration function
 * @param {Record<string, any>} [options] Mod load options (e.g. pluginRoot, dir)
 */
export function register(on, options = {}) {
  // 1. Register Sovereignty Guardrails (Immunity Shield & Bracket Method)
  registerGuardrails(on);

  // 2. Register Natural Slash Commands (/studio, /story-status, /checkpoint, /graduate)
  registerCommands(on);

  // 3. Register Interactive Studio Pane & UI Rendering
  registerStudioPane(on);

  // 4. Register On-Demand Craft Knowledge Tool for Claude
  on('session.start', async ($, e, next) => {
    await $.tool.register({
      name: 'craft_lookup',
      description:
        'Lookup narrative theory from the 133 OKF Craft modules (Story Grid 5 Commandments, Dwight Swain MRUs, value progressions, scene structure). Call this to give precise craft feedback without loading entire libraries into context.',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Topic or narrative question (e.g., "crisis", "mru", "turning point", "inciting incident")',
          },
        },
        required: ['topic'],
      },
    });

    return next(e);
  });

  // Handle craft_lookup tool call
  on('tool.call', { tool: ['craft_lookup', 'mcp__soundingboard__craft_lookup'] }, async ($, e) => {
    const modDir = options?.pluginRoot || options?.dir || '.';
    const craftDir = pathJoin(modDir, 'craft');
    const catalog = new CraftCatalog($, craftDir);
    await catalog.loadIndex();

    const topic = e.topic || e.args?.topic || '';
    const results = catalog.search(topic);
    if (results.length === 0) {
      return { result: `No specific craft module found for "${topic}". General storytelling principles apply.` };
    }

    const top = results[0];
    const content = await catalog.readModule(top.relativePath || top.id);
    return {
      result: `### Craft Guidance: ${top.title}\n\n${content || top.summary}`,
    };
  });
}
