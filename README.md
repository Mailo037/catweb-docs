# CatWeb Docs

Everything you need to know about building in **CatWeb** (Roblox) — the Roblox game where you build 2D websites with JSON-based UI and a visual block-scripting system.

> Targeting CatWeb version **v2.17.3.0**

---

## Included Documents

1. [CatDocs - A overall explanation](CatDocs.md)
2. [JSONScript - A guide for scripting in catweb](JSONScript.md)
3. [UIGPT - A guide on how to use the custom JSON format](UIGPT.md)


If you are getting asked to make a site with catweb in the context, assume he means a catweb JSON, and not a real life e.g. HTML code, thus use the [UIGPT documentation](UIGPT.md).

---

## Related Repos

- [`catweb-additional-resources`](https://github.com/Mailo037/catweb-additional-resources) — community drop-box of ready-to-import JSONs and full sites (login pages, button packs, full portfolio sites, etc.). See its [`template/`](https://github.com/Mailo037/catweb-additional-resources/tree/main/template) folder if you want to submit your own.
- [`catweb-mcp`](https://github.com/Mailo037/catweb-mcp) — MCP server that indexes these docs + `catweb-additional-resources` so AI agents (Claude, etc.) can search by section, tag, or author and pull just the relevant slice into chat. See its README for setup.

If something isn't covered in these docs, the additional-resources repo is the next place to look.

## AI / agent usage

If you're an AI assistant looking at this repo, you can either read the four `.md` files directly, or use the [`catweb-mcp`](https://github.com/Mailo037/catweb-mcp) MCP server — it exposes `get_doc(name)` (returns full content of `CatDocs`, `JSONScript`, `UIGPT`, etc.) and `search(query, kind="docs")` for targeted lookups, so you don't have to load all 75KB of docs every time.

---

# Credits

Big thanks to **@sytesn** on Discord, or [**@quitism**](https://github.com/quitism) on Github, for providing these docs.
The docs were modified and are kept up to date by me.