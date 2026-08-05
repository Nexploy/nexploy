# Writing guide — editing without changing the voice

Two surfaces, two registers. Match the file you are editing; do not import one voice into the other.

---

## Website (`website/apps/web`, English only)

Existing voice, from the shipped copy: short declaratives, concrete nouns, a dry aside instead of an
adjective. "The bill stops moving." "Watch it happen. Then go in and fix it." No exclamation marks,
no "seamlessly", no "powerful", no em-dash-free marketing mush.

Rules for edits:

- **Edit the data array, not the JSX.** Every section keeps its prose in a `const` array at the top
  of the file. The JSX only maps over it.
- **Keep the rhythm of the sentence you replace.** If the line was six words, do not return twenty.
  A count change is a token change, not a rewrite.
- **Numbers come from `facts.sh`.** Never hand-count nodes, tools or containers.
- **A capability list is a promise.** Adding a provider to a list means the provider works end to
  end (setup form → OAuth → webhook → build). Verify before adding.
- **Do not upgrade the claim while fixing it.** If a section says "3 providers" and the truth is 5,
  the fix is "5" — not a new paragraph selling the two new ones, unless asked.
- The site is **English only**. There is no i18n layer; do not add one.
- `app/layout.tsx` carries the SEO description, the OG description and the JSON-LD. When a section's
  headline fact changes, check whether that file repeats it.

## Docs (`docs/content/docs`, fumadocs, French default + one file per translated locale)

Voice: precise, second person, present tense, no hype. Tables for anything enumerable. French is the
source language (`.mdx`); every other locale is a translation named `page.<lang>.mdx`. The locale
list lives in `docs/lib/i18n.ts` — read it rather than assuming, it grows.

Rules for edits:

- **Every locale, same commit, always.** `page.mdx` and each `page.<lang>.mdx` must stay
  structurally identical: same headings in the same order, same table rows, same callouts.
  `drift.sh i18n` enforces the shape; only you can enforce the meaning.
- **Frontmatter** is `title` + `description`, both translated. Keep `title` short — it is the sidebar
  label.
- **Sidebar order** lives in `meta.json` (fr) and one `meta.<lang>.json` per translated locale. A
  new page must be added to all of them, in the same position — `drift.sh meta` fails on any
  divergence in the page list or its order. `meta.json` files without a `"title"` (the root one)
  need no translated twin.
- **Available MDX components**: fumadocs defaults. In practice the corpus uses `<Callout>` and
  `<Callout type="warn" title="…">`. Do not introduce a component the repo does not already import.
- **Code identifiers in backticks**: node ids, env vars, MCP tool names, file paths. `drift.sh`
  audits exactly these, so backtick them consistently — an identifier written as plain prose escapes
  the audit.
- French conventions already in the corpus: "dépôt" for repository, "nœud" for node, "conteneur",
  "sauvegarde" for backup, "chiffré" for encrypted. Keep them; do not re-translate settled terms.

---

## Aspirational vs factual

Some copy describes what does not exist yet (managed instances, tier features, SLAs). That is
allowed — but it must be visibly future-tense: a "Coming soon" badge, "Pricing lands with the
launch", a `plans.ts` entry inside the block already marked as such.

Never let an aspirational claim migrate into a factual context — the FAQ, the feature sections, the
docs, or the OG description. If you are asked to describe something unbuilt in a factual section,
say it is not built and ask.

## Never touch without being asked

- **Legal placeholders.** `[TO COMPLETE — …]` in `app/legal`, `app/terms`, `app/sales-terms` are
  deliberate holes for company registration data. Never invent a company name, SIRET, address or
  hosting provider. Report them as unfinished; do not fill them.
- **Prices.** `lib/plans.ts` numbers are a business decision.
- **`install.sh`.** It is executable infrastructure, not copy. Correcting prose to match it is right;
  editing it to match prose is not.
- **Screenshots and demo mocks** (`instance-panel.tsx`, log lines, request tables). They are
  illustrative. Only fix them when they contradict a real behaviour (a channel that no longer
  exists, a step name that was renamed).

## Commit and reporting shape

- One commit per target repo; they are separate git repos with separate histories.
- Message: what drifted and why, not "update docs". Example:
  `docs: 5 Git providers, AES-256-GCM — sync with app 2e988dc2`
- Never commit or push unless asked. Report the diff instead.
- Always state explicitly what you verified, what you changed, and what you left alone because it
  needs a human decision.
