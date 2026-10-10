// @ts-check
import { registerGuardrails } from './modules/guardrails.js';
import { registerCommands } from './modules/commands.js';
import { registerStudioPane } from './modules/ui-pane.js';
import { CraftCatalog } from '../lib/okf-catalog.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const craftCatalog = new CraftCatalog(path.join(__dirname, '..', 'craft'));

/**
 * Main Claude Code Mod entry point.
 * Claude Code calls register(on) when the mod loads.
 *
 * @param {Function} on The hook registration function
 */
export function register(on) {
  // 1. Register Sovereignty Guardrails (Immunity Shield & Bracket Method)
  registerGuardrails(on);

  // 2. Register Natural Slash Commands (/studio, /status, /checkpoint, /graduate)
  registerCommands(on);

  // 3. Register Interactive Studio Pane & UI Rendering
  registerStudioPane(on);

  // 4. Register On-Demand Craft Knowledge Tool for Claude
  on('session.start', async ($, e, next) => {
    await $.tool.register({
      name: 'craft_lookup',
      description:
        'Lookup narrative theory from the 127 OKF Craft modules (Story Grid 5 Commandments, Dwight Swain MRUs, value progressions, scene structure). Call this to give precise craft feedback without loading entire libraries into context.',
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

  // Handle mcp__soundingboard__craft_lookup
  on('tool.call', { tool: 'mcp__soundingboard__craft_lookup' }, async ($, e) => {
    const topic = e.topic || '';
    const results = craftCatalog.search(topic);
    if (results.length === 0) {
      return { result: `No specific craft module found for "${topic}". General storytelling principles apply.` };
    }

    const top = results[0];
    const content = craftCatalog.readModule(top.relativePath || top.id);
    return {
      result: `### Craft Guidance: ${top.title}\n\n${content || top.summary}`,
    };
  });
}
