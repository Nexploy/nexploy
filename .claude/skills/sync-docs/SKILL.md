---
name: sync-docs
description: Audits and updates the Nexploy documentation site (docs/) and marketing website (website/) against what the app actually does — driven by recent commits, a release, or a full sweep. Finds stale counts, removed features, renamed identifiers, missing translations and undocumented surfaces. Trigger when the user asks to "mettre à jour la doc / le site", "sync the docs", "check the website against the app", "vérifier la cohérence des textes", or after a release, a merge, or a batch of pushes.
---

# Sync the docs and the website with the app

Three repos, one truth. `nexploy/` is the product; `website/` and `docs/` make claims about it.
Claims rot silently — a provider is added, an algorithm changes, a count moves, and nobody edits the
prose. This skill finds those, proves them, and fixes them.

**The rule that makes this skill work: never state a fact you did not read out of the code.**
Not from memory, not from `README.md`, not from `CLAUDE.md` — both of those are already wrong in
ways this skill has caught. `scripts/facts.sh` is the only accepted source for a number.

Repos are siblings and resolved automatically:

```
nexploy/   ← app, source of truth (this skill lives here)
website/   ← marketing site, English only, also hosts public/install.sh
docs/      ← fumadocs, French default + .en.mdx
cli/       ← recovery CLI, referenced by both
```

Override with `NEXPLOY_APP_ROOT`, `NEXPLOY_WEBSITE_ROOT`, `NEXPLOY_DOCS_ROOT`, `NEXPLOY_CLI_ROOT`.

## Step 0 — Orient

```bash
cd .claude/skills/sync-docs/scripts
./changed.sh --status     # how far behind each target is
./facts.sh                # the full ground truth, ~400 lines
```

Read `references/content-map.md` now. It maps every website section and every docs page to the
source files that decide whether its claims are true. You will use it in every later step.

## Step 1 — Choose the scope

Ask only if the user's request is genuinely ambiguous; otherwise pick:

| Situation | Scope |
|---|---|
| "after these commits", "since the release", a PR merged | **delta** — `./changed.sh [<ref>]` |
| "check everything", "is the site accurate?", first run | **full** — every check, both targets |
| "just the docs" / "just the site" | pass `--docs` or `--website` to `drift.sh` |

Delta scope still runs the full `drift.sh` — it is cheap and catches drift the diff cannot explain.
What the delta narrows is the *semantic* pass in Step 3.

```bash
./changed.sh                 # since the recorded sync stamp, else last tag
./changed.sh v0.1.0 v0.2.0   # between two refs
```

`changed.sh` prints the commits, the changed files, and — the useful part — the **routed prose
targets**: which pages assert something about each thing that moved. Treat that routing as your
work list for Step 3.

## Step 2 — Mechanical pass

```bash
./drift.sh              # both targets, every check
./drift.sh --docs       # or one target
./drift.sh counts       # or one check
```

Checks: `identifiers` (node ids / MCP tool names that no longer exist), `counts` (every number
asserted in prose vs the code, fr and en), `providers` (pages enumerating a stale subset),
`encryption`, `env-vars`, `coverage` (product surface with no prose), `i18n` (fr/en parity),
`links`, `meta`, `versions`.

- **`[FAIL]` is proven drift.** Fix all of them. Each prints the file and line.
- **`[WARN]` needs judgement.** An undocumented env var may be deliberate; a documented one that no
  code reads is usually a rename you must chase down.
- A false positive gets a line in `references/known-terms.txt` — *after* you have confirmed it is
  legitimate prose. Never silence a real mismatch there.

Exit code is 1 when any `[FAIL]` printed, so this is also the gate for a pre-release check.

## Step 3 — Semantic pass (the part no script does)

A script cannot tell that "sign in with GitHub OAuth" is false when the sign-in form only has an
email field. This is where the actual work is.

For every page the routing (Step 1) or the content map (Step 0) points at:

1. **List the page's claims.** Every sentence that asserts a capability, a name, a number, a
   guarantee, or a default. Ignore prose that makes no verifiable claim.
2. **Prove or disprove each one against the code**, using `references/verification-recipes.md`.
   That file carries the recipe *and* the trap for each claim family — auth, encryption, capability,
   installer, counts, node config keys, versions, out-of-repo claims.
3. **Classify:**
   - *False* — contradicted by the code. Fix it.
   - *Stale* — true once, now incomplete (a list missing an item). Fix it.
   - *Unverifiable* — no code backs it. Soften it, mark it aspirational, or raise it. Never leave it
     stated as fact.
   - *True* — leave it alone. Do not rewrite prose that is correct.
4. **Log the evidence** — file and line in the app repo. Your report must let the user re-check you.

Do not skim for keywords. A claim can be wrong while every word in it appears in the codebase.

## Step 4 — Coverage

Drift is not only wrong text; it is also missing text. From `changed.sh` output and
`drift.sh coverage`:

- A new node type, MCP tool group, admin screen, provider, or Prisma model with no prose anywhere →
  propose a doc section (and a website line, if it is user-visible enough to sell).
- A removed feature still described → delete the prose, and check for orphaned links and `meta.json`
  entries afterwards.
- New surface usually needs **both** locales in docs and a look at whether the website's headline
  numbers move.

Propose new pages; do not invent whole sections unasked. Adding a row to an existing table is
in-scope, writing a new 300-line guide is a decision for the user.

## Step 5 — Write

Follow `references/writing-guide.md` — it holds the voice rules for each target, the i18n contract,
the MDX conventions, and the list of things never to touch (legal placeholders, prices, `install.sh`).

The three rules that matter most:

- **Website**: edit the `const` array at the top of the section file, keep the sentence's rhythm,
  never upgrade a claim while fixing it.
- **Docs**: `page.mdx` and `page.en.mdx` in the same pass, structurally identical; a new page goes
  into `meta.json` *and* `meta.en.json`.
- **Numbers**: from `facts.sh`, and remember `website/apps/web/lib/pipeline.ts` duplicates the
  per-category node counts that feed four different sections.

## Step 6 — Verify and record

```bash
cd ../../../../../website && pnpm --filter=web check-types
cd ../docs && pnpm build          # fumadocs catches broken MDX and links
cd ../nexploy/.claude/skills/sync-docs/scripts && ./drift.sh
```

`drift.sh` must come back clean on everything you touched. Then, once the user is satisfied:

```bash
./changed.sh --record    # stamps website/.docs-sync.json and docs/.docs-sync.json
```

The stamp is what makes the next run a cheap delta instead of a full sweep. Record it only after the
changes are accepted — not while they are still under review.

## Report

Give the user, in this order:

1. **Proven wrong** — claim, where it is asserted, what the code says, evidence path.
2. **Stale / incomplete** — same shape.
3. **Fixed** — file:line for each edit, both locales noted.
4. **Left alone, needs you** — unverifiable claims, aspirational copy, legal placeholders, anything
   where fixing it is a product decision rather than a factual correction.
5. **Verified accurate** — a short list. It is worth stating what you checked and found correct;
   it tells the user how much of the surface the run actually covered.

Never report a page as checked if you only ran the scripts on it. The mechanical pass and the
semantic pass are different claims about your own work — keep them distinct.
