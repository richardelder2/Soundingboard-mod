// @ts-check
import { resolveWorkspace, pathJoin } from '../../lib/taxonomy.js';
import { estimateTokens, checkTokenBudget } from '../../lib/tokens.js';

const PANE_ID = 'soundingboard-studio';

/**
 * Registers the interactive Soundingboard Studio UI pane:
 * Tabs:
 * 1. Story Status (Tier, scenes, progress)
 * 2. Token Ledger (Live canon & world token tracking)
 * 3. Craft Codex (Browse OKF craft knowledge)
 * 4. Sovereignty Settings (Toggle bracket strictness)
 *
 * @param {Function} on Claude Code mod hook registration function
 */
export function registerStudioPane(on) {
  let activeTab = 'status';

  on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    // Only render when our pane is requested
    if (e.requestId !== PANE_ID) return next(e);

    const { Box, Text, Button } = $.ui.resolve(e);
    const redraw = () => $.ui.invalidate('ui.render');

    const ws = await resolveWorkspace($);

    // Tab switcher button generator
    const tabBtn = (key, label) =>
      Button({
        key: `tab-${key}`,
        label,
        plain: true,
        dimColor: activeTab !== key,
        onPress: () => {
          activeTab = key;
          redraw();
        },
      });

    // Body content per active tab
    /** @type {any[]} */
    let tabBody = [];

    if (activeTab === 'status') {
      let sceneCount = 0;
      if (ws.isSoundingboard) {
        const stagesDir = pathJoin(ws.rootPath, 'stages');
        try {
          const files = await $.fs.list(stagesDir);
          if (Array.isArray(files)) {
            sceneCount = files.filter((f) => {
              const name = typeof f === 'string' ? f : f?.name || '';
              return name.endsWith('.md') && name !== 'canon.md';
            }).length;
          }
        } catch {
          sceneCount = 0;
        }
      }

      tabBody = [
        Text({ children: [`Status: ${ws.isSoundingboard ? 'Active Project' : 'No Soundingboard project'}`] }),
        Text({ children: [`Complexity: Tier ${ws.tier}`] }),
        Text({ children: [`Staged Scenes: ${sceneCount}`] }),
        Text({ children: ['The Red Pen stays in the human author’s hand.'] }),
      ];
    } else if (activeTab === 'tokens') {
      let canonTokens = 0;
      if (ws.isSoundingboard) {
        const canonPath = pathJoin(ws.rootPath, 'stages', 'canon.md');
        try {
          const canonData = await $.fs.read(canonPath);
          if (typeof canonData === 'string') {
            canonTokens = estimateTokens(canonData);
          }
        } catch {
          canonTokens = 0;
        }
      }
      const budget = checkTokenBudget('canon', canonTokens);

      tabBody = [
        Text({ children: [`canon.md: ${canonTokens} / ${budget.limit} tokens (${budget.percentage}%)`] }),
        Text({ children: [`Context Budget Status: ${budget.status.toUpperCase()}`] }),
        Text({ children: ['Dynamic Context Isolation active (< 4,000 token target)'] }),
      ];
    } else if (activeTab === 'codex') {
      tabBody = [
        Text({ children: ['OKF Craft Codex: 133 Modules Ready'] }),
        Text({ children: ['• Five Commandments of the Scene'] }),
        Text({ children: ['• Motivating-Reaction Units (Dwight Swain)'] }),
        Text({ children: ['• Value Progression & Emotional Polarity'] }),
        Text({ children: ['Type /codex <topic> or ask Claude in chat.'] }),
      ];
    } else if (activeTab === 'settings') {
      const strict = (await $.store.get('sovereignty_strict')) ?? true;
      tabBody = [
        Text({ children: [`Strict Bracket Enforcement: ${strict ? 'ENABLED' : 'ADVISORY'}`] }),
        Button({
          key: 'toggle-strict',
          label: strict ? 'Switch to Advisory Mode' : 'Switch to Strict Mode',
          onPress: async () => {
            await $.store.set('sovereignty_strict', !strict);
            redraw();
          },
        }),
      ];
    }

    return Box({
      flexDirection: 'column',
      children: [
        Box({
          flexDirection: 'row',
          columnGap: 2,
          children: [
            tabBtn('status', '1. Story Status'),
            tabBtn('tokens', '2. Token Ledger'),
            tabBtn('codex', '3. Craft Codex'),
            tabBtn('settings', '4. Sovereignty'),
          ],
        }),
        Text({ children: ['────────────────────────────────────────'] }),
        ...tabBody,
      ],
    });
  });
}
