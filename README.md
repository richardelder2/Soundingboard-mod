# Soundingboard Claude Code Mod

<p align="center">
  <strong>The Author's Intelligent Sounding Board & Novel Production Studio</strong><br />
  <em>A native, in-process Claude Code Mod for fiction writers collaborating with AI agents.</em>
</p>

---

## What is Soundingboard?

Most AI writing tools try to seize the keyboard: flattening authorial voice into homogenized corporate prose, performing silent rewrites, or blowing up context windows.

**Soundingboard operates on an entirely different foundation:**
> **The human author is the novelist; the AI is the Executive Editorial Assistant, Continuity Sentry, Master Librarian, and Craft Sounding Board.**
> **The human always holds the red pen. The AI never unilaterally rewrites author prose.**

This repository is an official **Claude Code Mod** running directly in-process inside the Claude Code terminal CLI and the Claude Desktop App.

---

## Key Features

1. **The Writer's Room Immunity Shield (`writers_room/`):**
   A creative sanctuary for messy brainstorming, beats, and raw drafts (`writers_room/notes/`, `writers_room/drafts/`). Automated linters, audits, and schema checks are blocked from nagging the author.
2. **The Bracket Method & Authorial Sovereignty (`stages/`):**
   Edits to completed scenes in `stages/` are intercepted in memory. All AI critique and suggestions must be framed as bracketed choices: `[Option A: Cut | Option B: Physical Action | Option C: Keep as author voice]`.
3. **Interactive Studio Pane (`/studio`):**
   A live sidebar pane inside the terminal and Claude Desktop App displaying active Tier complexity, scene counts, token footprints, and craft codex browsing without burning LLM turns.
4. **127 OKF Craft Modules (Story Grid & Swain MRUs):**
   Bundled storytelling theory served on-demand via `craft_lookup` tools, saving 99% of token context.
5. **Creative History in Git (`/checkpoint`):**
   Files contain the meaning; Git records the evolution (Playbook #21). Commits occur only when the author commands.

---

## Quick Installation

### Option 1: Direct Marketplace Add
In any Claude Code session:
```bash
/plugin marketplace add richardelder2/Soundingboard-mod
/plugin install soundingboard@soundingboard-marketplace
```

### Option 2: Local Session Testing
Clone this repository and launch Claude Code:
```bash
claude --plugin-dir /path/to/Soundingboard-mod
```


---

## Craft Slash Commands

| Command | Action |
| :--- | :--- |
| `/studio` | Toggles the interactive Soundingboard Studio pane |
| `/status` | Sub-10ms project ledger print (tokens, scenes, tiers) |
| `/beat` | Scene Beat Sheet & 5 Commandments planning volley |
| `/interview` | In-character psychological interview (WWXD) |
| `/bloom` | Sensory Blooming & atmospheric world expansion |
| `/critique` | Developmental editing quarantined in The Bracket Method |
| `/humanize` | AI-Tell and cadence diagnostics with 3-choice red-pen options |
| `/checkpoint` | Records creative history evolution to Git |
| `/graduate` | Promotes a polished draft from `writers_room/` to `stages/` |

---

## Architecture

```text
soundingboard-mod/
├── .claude-plugin/
│   ├── plugin.json          # Mod manifest
│   └── marketplace.json     # Self-hosted GitHub marketplace manifest
├── hooks/
│   ├── hooks.json           # Mod hook declarations
│   ├── register.js          # In-process mod registration
│   └── modules/
│       ├── guardrails.js    # Immunity Shield & Bracket Enforcer
│       ├── commands.js      # Natural slash commands
│       └── ui-pane.js       # Interactive studio pane (status, tokens, codex)
├── lib/                     # Zero-dependency deterministic core
│   ├── taxonomy.js          # Tier 0-3 resolution & path protection
│   ├── tokens.js            # Deterministic token estimator & budgets
│   ├── okf-parser.js        # Frontmatter & entity extraction
│   └── okf-catalog.js       # 127 Craft module retrieval engine
├── craft/                   # OKF Craft Knowledge Set (Story Grid & MRU)
├── skills/                  # Prompt skills for /beat, /critique, /bloom
└── templates/               # Scaffolding templates for scenes & canon
```

---

## License
MIT License. Created by Rick Elder.
