# Tekzbyte Python Playground

A browser-powered Python compiler by Irfan N with interactive terminal input,
attached Python files, and locally saved sessions.

## Development

Install Node.js and Bun, then:

```sh
bun install --frozen-lockfile
bun run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
- CodeMirror
- Pyodide / CPython WebAssembly

## GitHub Pages deployment

The app uses standard TanStack Start tooling and prerenders its public index into
`dist/client/index.html`. Only `dist/client` is deployed; Python and terminal input
run entirely in the browser, so no application server is required on GitHub Pages.

1. Sync this project to your GitHub repository.
2. Open the repository's **Settings → Pages**.
3. Under **Build and deployment**, select **GitHub Actions** as the source.
4. Push to the default branch, or run **Deploy Tekzbyte to GitHub Pages** from the
   **Actions** tab using **Run workflow**.
5. Open the website URL shown by the deployment once the workflow completes.

The workflow obtains the Pages base path automatically, supporting both
`username.github.io/repository/` and root/custom-domain sites. It installs
dependencies, runs tests, builds, checks required static files, and deploys them.
Do not select a branch/folder source or upload the unbuilt source directory.

Serve the app over HTTPS (or localhost during development). Interactive terminal input
requires Service Worker support and the `python-input-sw.js` and `python-worker.js`
files to be served from the application's own origin.

The first Python run downloads its runtime and requested scientific packages from
jsDelivr. Python execution and terminal values stay in the user's browser.

Browser local storage is specific to each domain; changing domains does not transfer
existing sessions. Download important `.py` files before changing domains.

The developer portrait and favicon are served from this repository. The prior
hosted portrait pointer is archival and is not used by the app. GitHub Actions
deployment itself cannot be verified until the repository is connected and Pages
is enabled. No prior Git history is rewritten.
