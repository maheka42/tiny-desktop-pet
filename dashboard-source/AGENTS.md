<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Web dashboard only; the Electron desktop pet lives in a separate project. Talk to it only through the typed `window.tinyPet` bridge in src/lib/pet/bridge.ts (see docs/ELECTRON_INTEGRATION.md) — keeps browser preview free of Electron code.
- Groq calls go through the server function in src/lib/pet/chat.functions.ts using the GROQ_API_KEY secret, with offline fallback — key must never reach the client.
- Progression rules (XP, stages, streak, mood, quiet hours) stay pure in src/lib/pet/progression.ts with tests — so Electron can reuse them.
- Dashboard state persists in localStorage via src/lib/pet/store.ts — no accounts needed for a single-user companion.
