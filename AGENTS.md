<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

# Project guidelines
- Preserve published Git history; keep the synced branch in a working state.
- Never edit generated files manually or put secrets in the repository.
- Keep server dependencies fully bundled and preserve CSRF protection.

## Application architecture
- Build with the standard TanStack Start, React, and Tailwind Vite plugins and prerender the public index; GitHub Pages serves only the static client output.
- Resolve all public files and the router base from Vite's BASE_URL so repository-subpath hosting works.
- Serve the supplied developer portrait from public/images on independent hosting; the original hosted pointer remains archival only.
- Run Python with Pyodide in a dedicated browser Web Worker; terminating the worker stops infinite loops without freezing the editor.
- Bridge synchronous Python stdin through a browser Service Worker with per-client input requests; it pauses execution without rerunning code or requiring server input endpoints.
- Persist workspace sessions and attached Python sources in browser localStorage because this playground is explicitly frontend-only.
- Keep the CodeMirror editor lifecycle inside effects and pass changes through callbacks so SSR never accesses the DOM.
