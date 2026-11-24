import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, keymap } from "@codemirror/view";
import { python } from "@codemirror/lang-python";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching, indentOnInput, syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap, autocompletion } from "@codemirror/autocomplete";
import { tags } from "@lezer/highlight";

const colors = HighlightStyle.define([
  { tag: tags.comment, color: "var(--syntax-comment)" },
  { tag: [tags.keyword, tags.controlKeyword], color: "var(--syntax-keyword)" },
  { tag: [tags.string, tags.special(tags.string)], color: "var(--syntax-string)" },
  { tag: [tags.number, tags.bool], color: "var(--syntax-number)" },
  { tag: tags.function(tags.variableName), color: "var(--syntax-function)" },
  { tag: tags.definition(tags.variableName), color: "var(--syntax-function)" },
  { tag: tags.operator, color: "var(--syntax-keyword)" },
]);

export function PythonEditor({ code, onChange, onRun }: { code: string; onChange: (code: string) => void; onRun: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorView | null>(null);
  const callbacks = useRef({ onChange, onRun });
  callbacks.current = { onChange, onRun };
  useEffect(() => {
    if (!host.current) return;
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({ doc: code, extensions: [
        lineNumbers(), history(), drawSelection(), highlightActiveLine(), highlightActiveLineGutter(), python(),
        indentOnInput(), bracketMatching(), closeBrackets(), autocompletion(), syntaxHighlighting(colors),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({ "aria-label": "Python code editor", "spellcheck": "false" }),
        keymap.of([{ key: "Mod-Enter", run: () => { callbacks.current.onRun(); return true; } }, ...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.updateListener.of((update) => { if (update.docChanged) callbacks.current.onChange(update.state.doc.toString()); }),
      ] }),
    });
    editor.current = view;
    return () => { editor.current = null; view.destroy(); };
    // External document updates are applied separately to preserve editor history.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const view = editor.current;
    if (view && view.state.doc.toString() !== code) view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: code } });
  }, [code]);
  return <div ref={host} className="python-editor" />;
}