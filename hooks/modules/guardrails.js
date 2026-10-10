// @ts-check
import { isImmunePath, isStagedScenePath } from '../../lib/taxonomy.js';

/**
 * Registers guardrail hooks intercepting tool calls to enforce authorial sovereignty.
 *
 * Principles Enforced:
 * 1. The Writer's Room Immunity Shield: No automated linter or schema nag on drafts in writers_room/
 * 2. The Bracket Method: Prohibits unilateral overwrites of author prose in stages/.
 *    All AI critique and suggestions must be framed as bracketed choices: [Option A | Option B].
 *
 * @param {Function} on Claude Code mod hook registration function
 */
export function registerGuardrails(on) {
  on('tool.call', { tool: ['Edit', 'Write'] }, async ($, e, next) => {
    const filePath = e.file_path || e.path || '';

    // 1. IMMUNITY SHIELD CHECK
    // If the tool is acting inside writers_room, ensure total creative immunity
    if (isImmunePath(filePath)) {
      // Allow the author/agent to freely write or draft without strict schemas
      return next(e);
    }

    // 2. AUTHORIAL SOVEREIGNTY & BRACKET CHECK
    // If editing a scene in stages/, verify that edits do not unilaterally overwrite author prose
    if (isStagedScenePath(filePath)) {
      const content = e.content || e.new_content || e.text || '';
      
      // If this is an Edit operation (modifying existing author text)
      if (e.tool === 'Edit') {
        // Look for bracketed proposals [Option A | Option B] or explicit author exceptions
        const hasBracketedProposal =
          /\[Option\s+[A-Z]|\[AI-TELL:|\[author\s+exception\]|\[suggest(?:ion)?:/i.test(content);
        
        // If Claude is making an unbracketed direct rewrite without author option brackets:
        if (!hasBracketedProposal) {
          // Check if author explicitly disabled strict guardrails in store
          const strictMode = (await $.store.get('sovereignty_strict')) ?? true;
          
          if (strictMode) {
            return {
              deny:
                "Authorial Sovereignty Violation: Soundingboard policy prohibits unilateral rewrites of staged scenes. " +
                "The author holds the red pen. Please quarantine your proposed revisions in brackets " +
                "[Option A: Rephrase | Option B: Physical Action | Option C: Keep as author voice] so the author can choose."
            };
          }
        }
      }
    }

    // Proceed to next middleware / Claude Code execution
    return next(e);
  });
}
