# CatWeb Docs

Everything you need to know about building in **CatWeb** (Roblox) — the Roblox game where you build 2D websites with JSON-based UI and a visual block-scripting system.

> Targeting CatWeb version **v2.18.2.3**

---

## Included Documents

1. [CatDocs - Overall explanation & reference](game/CatDocs.md)
2. [JSONScript - Guide for scripting & authoritative block shapes](game/JSONScript.md)
3. [UIGPT - Guide on how to use the custom JSON format & element schema](game/UIGPT.md)
4. [Assets & Patterns - Icons, sounds, reusable components & string decoder](game/Assets.md)
5. [Documents regarding CatWeb development and the Discord group](guild/)


If you are asked to make a site with CatWeb in the context, assume a CatWeb JSON site object is required (with `favicon`, `title`, `background`, and `webcontent`), and not real-life HTML code — refer to the [UIGPT documentation](game/UIGPT.md) and [Assets & Patterns](game/Assets.md).

---

## Related Repos

- [`catweb-additional-resources`](https://github.com/Mailo037/catweb-additional-resources) — community drop-box of ready-to-import JSONs and full sites (login pages, button packs, full portfolio sites, etc.). See its [`template/`](https://github.com/Mailo037/catweb-additional-resources/tree/main/template) folder if you want to submit your own.
- [`catweb-mcp`](https://github.com/Mailo037/catweb-mcp) — MCP server that indexes these docs + `catweb-additional-resources` so AI agents (Claude, etc.) can search by section, tag, or author and pull just the relevant slice into chat. See its README for setup.

If something isn't covered in these docs, the additional-resources repo is the next place to look.

## AI / Agent Usage & Skill Package

This repository provides an all-in-one **Agent Skill** (`skills/catweb/`) that encapsulates the full CatWeb specifications, hard output invariants, schema rules, and block engine definitions so any AI assistant can generate 100% valid, importable CatWeb JSON sites and scripts:

- [`skills/catweb/SKILL.md`](skills/catweb/SKILL.md) (and native workspace mirror [`.agents/skills/catweb/SKILL.md`](.agents/skills/catweb/SKILL.md)): Complete specification, output invariants, layout architecture patterns, element schemas, JSONScript block engine reference, asset IDs, and pre-flight checklist.
- [`skills/catweb/examples/minimal_site.json`](skills/catweb/examples/minimal_site.json): Production-ready minimal site implementing the standard sticky navbar + scrolling body architecture.
- [`skills/catweb/examples/interactive_counter.json`](skills/catweb/examples/interactive_counter.json): Complete interactive site featuring button click events, numeric variable incrementing (`{1}`), `Set Property` text updates, UI audio playback, and flat control flow.

### How to use with any AI Assistant / Agent:

1. **Workspace Agent Discovery (Cursor / Windsurf / Antigravity):** The skill is installed at `.agents/skills/catweb/SKILL.md` and `skills/catweb/SKILL.md`, enabling automatic discovery and mounting by workspace agents.
2. **Claude Projects / Custom GPTs:** Upload [`skills/catweb/SKILL.md`](skills/catweb/SKILL.md) as project knowledge or paste its contents into the system instructions.
3. **Direct Chat / LLM Prompting:** Copy the contents of [`skills/catweb/SKILL.md`](skills/catweb/SKILL.md) into your prompt along with your site idea (e.g. *"Create a portfolio site for CatWeb following this skill file"*).
4. **CatWeb MCP Server:** If you prefer on-demand search and retrieval, use [`catweb-mcp`](https://github.com/Mailo037/catweb-mcp) with tools like `get_doc` and `search`.

---

# Credits

Big thanks to **@sytesn** on Discord, or [**@quitism**](https://github.com/quitism) on Github, for providing initial docs, and **DevsLovePizza** for the SiteGPT specifications, confirmed block palette schemas, and token architectures.
The docs are modified and kept up to date by me.