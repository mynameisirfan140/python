/* Browser-only CPython runtime. No code is sent to an application server. */
const base = "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/";
let runtime;
let initialization;
let previousFiles = [];

async function initialize() {
  if (!initialization) initialization = initializeRuntime().catch((error) => { runtime = undefined; initialization = undefined; throw error; });
  return initialization;
}

async function initializeRuntime() {
  if (runtime) return runtime;
  self.postMessage({ type: "status", text: "Loading Python runtime…" });
  importScripts(`${base}pyodide.js`);
  runtime = await loadPyodide({ indexURL: base });
  runtime.FS.mkdirTree("/workspace");
  runtime.FS.chdir("/workspace");
  await runtime.runPythonAsync("import sys\nif '/workspace' not in sys.path: sys.path.insert(0, '/workspace')");
  const decoder = new TextDecoder();
  runtime.setStdout({ write: (buffer) => { self.postMessage({ type: "stdout", text: decoder.decode(buffer, { stream: true }) }); return buffer.length; } });
  runtime.setStderr({ write: (buffer) => { self.postMessage({ type: "stderr", text: decoder.decode(buffer, { stream: true }) }); return buffer.length; } });
  self.postMessage({ type: "ready", version: runtime.runPython("sys.version.split()[0]") });
  return runtime;
}

self.onmessage = async ({ data }) => {
  try {
    const py = await initialize();
    if (data.type === "init") return;
    if (data.type !== "run") return;
    self.postMessage({ type: "status", text: "Preparing imports…" });
    for (const name of previousFiles) {
      try { py.FS.unlink(`/workspace/${name}`); } catch { /* Already removed. */ }
    }
    const files = data.files.filter((f) => /^[\w .-]+\.py$/.test(f.name));
    previousFiles = files.map((f) => f.name);
    for (const file of files) py.FS.writeFile(`/workspace/${file.name}`, file.code);
    const lines = data.input === "" ? [] : data.input.split("\n");
    let index = 0;
    py.setStdin({ stdin: () => {
      if (index < lines.length) return lines[index++];
      // Synchronous XHR blocks only this worker; the browser-local Service Worker
      // holds the response until the user submits a terminal line.
      const request = new XMLHttpRequest();
      const id = `${data.token}:${index++}`;
      const endpoint = new URL("__python_terminal_input", self.location.href);
      endpoint.searchParams.set("request", id);
      request.open("POST", endpoint.href, false);
      request.setRequestHeader("Content-Type", "application/json");
      request.send(JSON.stringify({ token: data.token, id }));
      if (request.status !== 200) throw new Error("Terminal input disconnected. Stop and run again.");
      return JSON.parse(request.responseText).value;
    } });
    const allCode = files.map((f) => f.code).join("\n");
    await py.loadPackagesFromImports(allCode, { messageCallback: (text) => self.postMessage({ type: "status", text }) });
    py.globals.set("_workspace_modules", files.map((f) => f.name.slice(0, -3)));
    await py.runPythonAsync("import sys, importlib\nimportlib.invalidate_caches()\nfor _module in _workspace_modules:\n    sys.modules.pop(_module, None)");
    self.postMessage({ type: "status", text: "Running…" });
    const start = performance.now();
    const namespace = py.toPy({ "__name__": "__main__", "__file__": `/workspace/${data.filename}` });
    try { await py.runPythonAsync(data.code, { globals: namespace, filename: data.filename }); }
    finally { namespace.destroy(); }
    await py.runPythonAsync("import sys\nsys.stdout.flush()\nsys.stderr.flush()");
    self.postMessage({ type: "done", duration: performance.now() - start });
  } catch (error) {
    self.postMessage({ type: "error", text: String(error), runtimeReady: Boolean(runtime) });
  }
};