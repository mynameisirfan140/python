import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Zap, Play, Paperclip, Copy, Download, Trash2, Plus, Search, FileCode2, Terminal, Maximize2, Minimize2, UserRound, Blocks, Code2, Square, Check, LoaderCircle, ShieldCheck, CornerDownLeft, ArrowUpRight, FolderOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PythonEditor } from "@/components/python-editor";
import { DeveloperProfile } from "@/components/developer-profile";
import { createSession, EXAMPLES, pythonFilename, restoreSessions, STORAGE_KEY, type Session } from "@/lib/workspace";
import { prepareTerminalInput, submitTerminalInput, cancelTerminalInput, type InputRequest } from "@/lib/terminal-input";
import { appPath } from "@/lib/app-path";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Tekzbyte Python Playground — Online Python Compiler" },
    { name: "description", content: "Run real Python in your browser with the Tekzbyte online compiler. Explore modules, attach Python files, and save your work locally. Created by Irfan N." },
    { property: "og:title", content: "Tekzbyte Python Playground — Online Python Compiler" },
    { property: "og:description", content: "A space to compile, run, learn, and build. Your Python playground, by Tekzbyte." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

function Index() {
  const [sessions, setSessions] = useState<Session[]>(() => [createSession("welcome")]);
  const [activeId, setActiveId] = useState("welcome");
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [developer, setDeveloper] = useState(false);
  const [examples, setExamples] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState(false);
  const [running, setRunning] = useState(false);
  const [booting, setBooting] = useState(true);
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState("3.13");
  const [status, setStatus] = useState("Loading Python…");
  const [duration, setDuration] = useState<number | null>(null);
  const [inputRequest, setInputRequest] = useState<InputRequest | null>(null);
  const pendingInput = useRef<InputRequest | null>(null);
  const [terminalValue, setTerminalValue] = useState("");
  const inputToken = useRef<string | null>(null);
  const terminalField = useRef<HTMLInputElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const [storageAvailable, setStorageAvailable] = useState(true);
  const worker = useRef<Worker | null>(null);
  const upload = useRef<HTMLInputElement>(null);
  const outputElement = useRef<HTMLPreElement>(null);
  const runningRef = useRef(false);
  const session = sessions.find((item) => item.id === activeId) ?? sessions[0];
  const file = session?.files.find((item) => item.name === session.activeFile) ?? session?.files[0];

  useEffect(() => {
    try {
      const restored = restoreSessions(localStorage.getItem(STORAGE_KEY));
      if (restored) {
        setSessions(restored);
        const selected = localStorage.getItem(`${STORAGE_KEY}:active`);
        setActiveId(restored.find((s) => s.id === selected)?.id ?? restored[0]?.id ?? "welcome");
      }
    } catch { setStorageAvailable(false); }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      localStorage.setItem(`${STORAGE_KEY}:active`, activeId);
      setStorageAvailable(true);
    } catch { setStorageAvailable(false); }
  }, [sessions, activeId, hydrated]);

  const startWorker = useCallback(() => {
    worker.current?.terminate();
    setBooting(true); setReady(false); setStatus("Loading Python…");
    const instance = new Worker(appPath("python-worker.js"));
    worker.current = instance;
    instance.onmessage = ({ data }: MessageEvent<{ type: string; text?: string; version?: string; duration?: number; runtimeReady?: boolean }>) => {
      if (worker.current !== instance) return;
      if (data.type === "ready") { setReady(true); setBooting(false); setVersion(data.version ?? "3.13"); setStatus("Ready"); }
      if (data.type === "status") setStatus(data.text ?? "Preparing…");
      if (data.type === "stdout" || data.type === "stderr") setOutput((previous) => (previous + (data.text ?? "")).slice(0, 150000));
      if (data.type === "done") { cancelTerminalInput(inputToken.current); pendingInput.current = null; setInputRequest(null); runningRef.current = false; setRunning(false); setDuration(data.duration ?? 0); setStatus("Process exited with code 0"); }
      if (data.type === "error") {
        cancelTerminalInput(inputToken.current); pendingInput.current = null; setInputRequest(null);
        runningRef.current = false; setRunning(false); setBooting(false); setReady(Boolean(data.runtimeReady)); setError(true);
        setOutput((previous) => previous + (data.text ?? "Python could not be loaded. Check your connection and try again."));
        setStatus(data.runtimeReady ? "Process exited with code 1" : "Runtime unavailable · retry Run");
      }
    };
    instance.onerror = () => {
      if (worker.current !== instance) return;
      cancelTerminalInput(inputToken.current); pendingInput.current = null; setInputRequest(null);
      runningRef.current = false; setRunning(false); setBooting(false); setReady(false); setError(true);
      setStatus("Runtime unavailable · retry Run"); setOutput("Unable to load Python. Please check your internet connection and try Run again.");
    };
    instance.postMessage({ type: "init" });
  }, []);

  useEffect(() => { startWorker(); return () => worker.current?.terminate(); }, [startWorker]);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const listener = (event: MessageEvent<{ type: string; token: string; id: string }>) => {
      if (event.data.type !== "input-request" || event.data.token !== inputToken.current || !runningRef.current) return;
      const request = { token: event.data.token, id: event.data.id };
      if (pendingInput.current?.id === request.id) return;
      pendingInput.current = request;
      setInputRequest(request); setTerminalValue(""); setStatus("Waiting for input");
    };
    navigator.serviceWorker.addEventListener("message", listener);
    return () => { navigator.serviceWorker.removeEventListener("message", listener); cancelTerminalInput(inputToken.current); };
  }, []);
  useEffect(() => { if (inputRequest) terminalField.current?.focus(); }, [inputRequest]);
  useEffect(() => { if (outputElement.current) outputElement.current.scrollTop = outputElement.current.scrollHeight; }, [output]);
  useEffect(() => {
    if (!fullscreen) return;
    const listener = (event: KeyboardEvent) => { if (event.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [fullscreen]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 3500); return () => clearTimeout(timer); }, [notice]);

  function updateSession(update: (s: Session) => Session) {
    if (!session) return;
    setSessions((items) => items.map((item) => item.id === session.id ? update(item) : item));
  }
  function updateCode(code: string) {
    if (!file) return;
    updateSession((s) => ({ ...s, files: s.files.map((f) => f.name === file.name ? { ...f, code } : f) }));
  }
  async function run() {
    if (!session || !file || runningRef.current || booting) return;
    if (!ready) { startWorker(); return; }
    pendingInput.current = null;
    setOutput(""); setError(false); setDuration(null); setInputRequest(null); setTerminalValue(""); setStatus("Preparing terminal…");
    runningRef.current = true; setRunning(true);
    const token = crypto.randomUUID(); inputToken.current = token;
    try {
      await prepareTerminalInput(token);
      if (!runningRef.current || inputToken.current !== token) return;
      worker.current?.postMessage({ type: "run", code: file.code, filename: file.name, files: session.files, input: "", token });
    } catch (failure) {
      if (inputToken.current !== token) return;
      cancelTerminalInput(token); runningRef.current = false; setRunning(false); setError(true);
      setOutput(failure instanceof Error ? failure.message : "Terminal could not connect. Refresh and try again."); setStatus("Terminal unavailable");
    }
  }
  function sendInput() {
    const request = pendingInput.current;
    if (!request || !runningRef.current || request.token !== inputToken.current) return;
    pendingInput.current = null;
    submitTerminalInput(request, terminalValue);
    setOutput((previous) => previous + terminalValue + "\n");
    setInputRequest(null); setTerminalValue(""); setStatus("Running…");
  }
  function stop() {
    cancelTerminalInput(inputToken.current); inputToken.current = null; pendingInput.current = null; setInputRequest(null); setTerminalValue("");
    worker.current?.terminate(); runningRef.current = false; setRunning(false);
    setOutput((previous) => previous + "\nKeyboardInterrupt: execution stopped.\n");
    startWorker();
  }
  function addSession(name = `Session ${sessions.length + 1}`, code?: string) {
    const item = createSession(crypto.randomUUID(), name, code);
    setSessions((previous) => [...previous, item]); setActiveId(item.id); setSearch("");
    if (!runningRef.current) { setOutput(""); setError(false); setDuration(null); setStatus(ready ? "Ready" : status); }
  }
  function deleteSession(id: string) {
    const remaining = sessions.filter((s) => s.id !== id);
    if (!remaining.length) remaining.push(createSession(crypto.randomUUID()));
    setSessions(remaining);
    if (activeId === id) { setActiveId(remaining[0]?.id ?? "welcome"); setOutput(""); setDuration(null); setError(false); }
  }
  async function attach(files: FileList | null) {
    if (!files || !session) return;
    const accepted = Array.from(files).filter((f) => f.name.endsWith(".py"));
    if (!accepted.length) { setNotice("Choose a Python (.py) file."); return; }
    if (accepted.some((f) => f.size > 2 * 1024 * 1024)) { setNotice("Each Python file must be smaller than 2 MB."); return; }
    try {
      const additions = await Promise.all(accepted.map(async (f) => ({ name: pythonFilename(f.name.replace(/[^\w .-]/g, "_")), code: await f.text() })));
      updateSession((s) => ({ ...s, files: [...s.files.filter((f) => !additions.some((a) => a.name === f.name)), ...additions], activeFile: additions[0]?.name ?? s.activeFile }));
      setNotice(`${additions.length} Python file${additions.length === 1 ? "" : "s"} attached`);
    } catch { setNotice("The file could not be read. Please try again."); }
    if (upload.current) upload.current.value = "";
  }
  async function copy() {
    if (!file) return;
    try { await navigator.clipboard.writeText(file.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { setNotice("Clipboard unavailable. Select the code to copy it."); }
  }
  function save() {
    if (!file) return;
    const url = URL.createObjectURL(new Blob([file.code], { type: "text/x-python;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = pythonFilename(file.name); anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); setNotice(`${pythonFilename(file.name)} saved`);
  }

  return <main className="playground">
    <header className="app-header">
      <div className="brand"><Zap className="brand-mark" aria-hidden="true" /><span className="brand-name">Tekz<span>byte</span></span><div className="brand-divider" /><div className="brand-motto">Compile <b>·</b> Run <b>·</b> Learn <b>·</b> Build</div></div>
      <nav className="header-nav" aria-label="Workspace navigation">
        <Button variant="ghost" className="nav-item" data-active={!examples} onClick={() => setExamples(false)} title="Playground"><Code2 /><span>Playground</span></Button>
        <Button variant="ghost" className="nav-item" data-active={examples} onClick={() => setExamples(true)} title="Python examples"><Blocks /><span>Examples</span></Button>
        <div className="header-divider" /><Button variant="outline" className="developer-button" onClick={() => setDeveloper(true)}><UserRound />Meet developer</Button>
      </nav>
    </header>
    <div className="page-heading"><div><h1>Python Playground <span className="python-badge">PYTHON 3</span></h1><p>A little curiosity. A few lines of code. Endless possibilities.</p></div><div className="runtime-pill"><span className={`status-dot ${booting ? "loading" : ""}`} />{booting ? "Starting runtime" : `Python ${version}`}<span>·</span>WebAssembly</div></div>
    <div className="workspace">
      <aside className="sessions-sidebar" aria-label="Sessions">
        <div className="section-header"><h2><FolderOpen />Sessions</h2><span className="small-count">{sessions.length}</span></div>
        <div className="sidebar-tools"><Button variant="outline" className="new-session" onClick={() => addSession()} disabled={running}><Plus />New session</Button><label className="session-search"><Search /><input aria-label="Search sessions" placeholder="Search sessions…" value={search} onChange={(e) => setSearch(e.target.value)} /></label></div>
        <div className="session-list">{sessions.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())).map((s) => <div className={`session-entry ${s.id === activeId ? "active" : ""}`} key={s.id}><Button variant="ghost" className="session-select" disabled={running} onClick={() => { setActiveId(s.id); setOutput(""); setDuration(null); setError(false); setStatus(ready ? "Ready" : status); }}><FileCode2 className="session-icon" /><span className="session-label"><span className="session-name">{s.name}</span><small>{s.files.length} file{s.files.length === 1 ? "" : "s"} · Python</small></span></Button><Button variant="ghost" className="session-delete" title={`Delete ${s.name}`} aria-label={`Delete ${s.name}`} onClick={() => deleteSession(s.id)} disabled={running}><X /></Button></div>)}{!sessions.some((s) => s.name.toLowerCase().includes(search.toLowerCase())) && <p className="no-sessions">No matching sessions</p>}</div>
        <div className="sidebar-bottom"><Zap className="brand-mark" /><h3>Build. Learn. Grow.</h3><p>Big ideas start small.<br />Make yours happen.</p><p className="mini-caption"><ShieldCheck size={11} />Your workspace. Your browser.</p></div>
      </aside>
      <section className="editor-panel" aria-label="Python editor">
        <div className="file-tabs" role="tablist" aria-label="Python files">{session?.files.map((f) => <Button key={f.name} role="tab" aria-selected={f.name === file?.name} variant="ghost" className={`file-tab ${f.name === file?.name ? "active" : ""}`} onClick={() => updateSession((s) => ({ ...s, activeFile: f.name }))}><FileCode2 />{f.name}<span className="file-dot" /></Button>)}</div>
        <div className="toolbar"><Button className="tool-button run-button" variant={running ? "destructive" : "default"} disabled={booting} onClick={running ? stop : run}>{booting ? <LoaderCircle className="animate-spin" /> : running ? <Square /> : <Play />}{running ? "Stop" : "Run"}</Button><Button variant="outline" className="tool-button" onClick={() => upload.current?.click()} disabled={running}><Paperclip />Attach</Button><Button variant="outline" className="tool-button" onClick={copy}>{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy"}</Button><Button variant="outline" className="tool-button" onClick={save}><Download />Save</Button><Button variant="ghost" className="tool-button clear-button" onClick={() => { updateCode(""); setOutput(""); setError(false); setDuration(null); }} disabled={running}><Trash2 />Clear</Button><input type="file" accept=".py" multiple hidden ref={upload} onChange={(e) => { void attach(e.target.files); }} /></div>
        <PythonEditor code={file?.code ?? ""} onChange={updateCode} onRun={run} />
        <div className="editor-footer"><div><span>{(file?.code ?? "").split("\n").length} lines</span><span>UTF-8</span></div><div><span>Spaces: 4</span><FileCode2 size={11} /><span>Python</span></div></div>
      </section>
      <div className="output-column"><section className={`output-panel ${fullscreen ? "fullscreen-output" : ""}`} aria-label="Python output">
        <div className="section-header"><h2><span className="output-title">OUTPUT</span>{running && <LoaderCircle className="animate-spin" />}</h2><div className="output-actions"><Button variant="ghost" title={fullscreen ? "Exit full screen" : "Expand output"} aria-label={fullscreen ? "Exit full screen" : "Expand output"} onClick={() => setFullscreen(!fullscreen)}>{fullscreen ? <Minimize2 /> : <Maximize2 />}</Button><Button variant="ghost" title="Clear output" aria-label="Clear output" onClick={() => { setOutput(""); setError(false); setDuration(null); }}><Trash2 /></Button></div></div>
        <div className="terminal-heading"><span><Terminal />Terminal</span><span className={`execution-badge ${inputRequest ? "awaiting" : ""}`}><span className={`status-dot ${running ? "loading" : ""}`} />{inputRequest ? "Awaiting input" : running ? "Running" : error ? "Error" : duration !== null ? "Completed" : "Ready"}</span></div>
        <div className="console-body">{output || inputRequest ? <pre ref={outputElement} className={`console-code ${error ? "has-error" : ""}`} aria-live="polite">{output}</pre> : <div className="console-empty"><div className="terminal-symbol"><Terminal /></div><h3>{running ? "Python is running…" : "Ready when you are."}</h3><p>{running ? status : "A blank canvas for your next idea."}</p></div>}</div>
        {inputRequest && <form className="terminal-input-form" onSubmit={(event) => { event.preventDefault(); sendInput(); }}><span className="terminal-prompt" aria-hidden="true">❯</span><input ref={terminalField} aria-label="Terminal input" autoComplete="off" spellCheck={false} placeholder="Enter a value…" value={terminalValue} onChange={(event) => setTerminalValue(event.target.value)} /><Button type="submit" size="icon" title="Submit input" aria-label="Submit input"><CornerDownLeft /></Button></form>}
        <div className="console-status"><span className={duration !== null && !error ? "success-text" : ""}>{status}</span>{duration !== null && <span>{(duration / 1000).toFixed(3)}s</span>}</div>
      </section><div className="creative-band"><Code2 /><div><p>Small beginnings. Big possibilities.</p><span>Made for the way you think.</span></div><ArrowUpRight className="ml-auto" /></div></div>
    </div>
    <footer className="app-footer"><div><span className={`status-dot ${booting ? "loading" : ""}`} /><span>{booting ? "Connecting to Python" : ready ? "Python runtime ready" : "Runtime unavailable"}</span><span className="footer-detail">·</span><span className="footer-detail">Runs in your browser</span></div><div role="status">{notice || (storageAvailable ? <><Check /><span>All changes saved locally</span></> : "Browser storage unavailable · download to save")}</div><div className="footer-detail">Crafted by <span className="footer-brand">Tekzbyte</span></div></footer>
    <DeveloperProfile open={developer} onOpenChange={setDeveloper} />
    <Dialog open={examples} onOpenChange={setExamples}><DialogContent className="examples-dialog"><DialogTitle>Start with a spark<span className="text-primary">.</span></DialogTitle><DialogDescription>Python examples</DialogDescription><div className="example-list">{EXAMPLES.map((example) => <Button variant="outline" className="example-item" disabled={running} key={example.name} onClick={() => { addSession(example.name, example.code); setExamples(false); }}><FileCode2 /><span><strong>{example.name}</strong><small>{example.description}</small></span><ArrowUpRight className="ml-auto" /></Button>)}</div></DialogContent></Dialog>
  </main>;
}
