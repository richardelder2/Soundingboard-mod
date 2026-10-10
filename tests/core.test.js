import test from 'node:test';
import assert from 'node:assert';
import { isImmunePath, isStagedScenePath } from '../lib/taxonomy.js';
import { estimateTokens, checkTokenBudget } from '../lib/tokens.js';
import { parseFrontmatter } from '../lib/okf-parser.js';

test('Taxonomy: correctly identifies writers_room immune paths', () => {
  assert.strictEqual(isImmunePath('writers_room/notes/ideas.md'), true);
  assert.strictEqual(isImmunePath('project/writers_room/drafts/ch1.md'), true);
  assert.strictEqual(isImmunePath('stages/sc-001.md'), false);
});

test('Taxonomy: correctly identifies staged scene paths', () => {
  assert.strictEqual(isStagedScenePath('stages/sc-001.md'), true);
  assert.strictEqual(isStagedScenePath('project/stages/sc-002.md'), true);
  assert.strictEqual(isStagedScenePath('writers_room/drafts/sc-001.md'), false);
  assert.strictEqual(isStagedScenePath('stages/notes.txt'), false);
});

test('Tokens: estimateTokens calculates reasonable token values', () => {
  const text = 'The rain drummed steadily against the tavern window while Corvus examined the silver key.';
  const tokens = estimateTokens(text);
  assert.ok(tokens >= 12 && tokens <= 25, `Expected token count around 16, got ${tokens}`);
});

test('Tokens: checkTokenBudget flags limits accurately', () => {
  const under = checkTokenBudget('canon', 2000);
  assert.strictEqual(under.status, 'green');

  const warning = checkTokenBudget('canon', 3500);
  assert.strictEqual(warning.status, 'yellow');

  const exceeded = checkTokenBudget('canon', 4500);
  assert.strictEqual(exceeded.status, 'red');
});

test('OKF Parser: correctly extracts frontmatter and body', () => {
  const md = `---
id: "sc-101"
title: "The Silver Key"
pov: "Corvus"
tags: [tavern, secret]
---

Corvus held the key up to the candlelight.`;

  const { frontmatter, body } = parseFrontmatter(md);
  assert.strictEqual(frontmatter.id, 'sc-101');
  assert.strictEqual(frontmatter.title, 'The Silver Key');
  assert.strictEqual(frontmatter.pov, 'Corvus');
  assert.deepStrictEqual(frontmatter.tags, ['tavern', 'secret']);
  assert.ok(body.includes('candlelight'));
});
