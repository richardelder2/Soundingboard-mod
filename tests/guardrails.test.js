// @ts-check
import test from 'node:test';
import assert from 'node:assert';
import { registerGuardrails } from '../hooks/modules/guardrails.js';

test('Guardrails: allows unbracketed edits to immune paths (writers_room)', async () => {
  let registeredHandler = null;
  const on = (event, filter, handler) => {
    registeredHandler = handler;
  };

  registerGuardrails(on);
  assert.ok(registeredHandler, 'registerGuardrails should register a handler');

  const mock$ = {
    store: {
      get: async () => true,
    },
  };

  const immuneEvent = {
    tool: 'Edit',
    file_path: 'writers_room/drafts/scene1.md',
    content: 'Unbracketed raw brainstorming text',
  };

  let nextCalled = false;
  const next = async (e) => {
    nextCalled = true;
    return { ok: true, forwarded: e };
  };

  const res = await registeredHandler(mock$, immuneEvent, next);
  assert.strictEqual(nextCalled, true, 'Next should be called for immune path');
  assert.strictEqual(res.ok, true);
});

test('Guardrails: denies unbracketed edits to staged scene paths (stages/)', async () => {
  let registeredHandler = null;
  const on = (event, filter, handler) => {
    registeredHandler = handler;
  };

  registerGuardrails(on);

  const mock$ = {
    store: {
      get: async () => true,
    },
  };

  const stagedViolationEvent = {
    tool: 'Edit',
    file_path: 'stages/sc-001.md',
    content: 'Unilateral overwrite of author prose without options.',
  };

  let nextCalled = false;
  const next = async () => {
    nextCalled = true;
  };

  const res = await registeredHandler(mock$, stagedViolationEvent, next);
  assert.strictEqual(nextCalled, false, 'Next should NOT be called on sovereignty violation');
  assert.ok(res.deny, 'Should return deny response');
  assert.match(res.deny, /Authorial Sovereignty Violation/);
});

test('Guardrails: allows bracketed proposal edits to staged scene paths (stages/)', async () => {
  let registeredHandler = null;
  const on = (event, filter, handler) => {
    registeredHandler = handler;
  };

  registerGuardrails(on);

  const mock$ = {
    store: {
      get: async () => true,
    },
  };

  const stagedBracketedEvent = {
    tool: 'Edit',
    file_path: 'stages/sc-001.md',
    content: 'She stepped into the alley. [Option A: Rain hissed against the stone | Option B: The air smelled of burnt grease | Option C: Keep author original]',
  };

  let nextCalled = false;
  const next = async (e) => {
    nextCalled = true;
    return { ok: true };
  };

  const res = await registeredHandler(mock$, stagedBracketedEvent, next);
  assert.strictEqual(nextCalled, true, 'Next should be called when proposals are bracketed');
  assert.strictEqual(res.ok, true);
});
