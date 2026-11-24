import { afterEach, describe, expect, it, vi } from "vitest";
import { cancelTerminalInput, submitTerminalInput } from "./terminal-input";

afterEach(() => vi.unstubAllGlobals());
describe("Interactive Python terminal", () => {
  it("sends a entered number to the waiting input without converting it or rerunning", () => {
    const postMessage = vi.fn();
    vi.stubGlobal("navigator", { serviceWorker: { controller: { postMessage } } });
    submitTerminalInput({ token: "run1", id: "run1:0" }, "42");
    expect(postMessage).toHaveBeenCalledWith({ type: "input-response", token: "run1", id: "run1:0", value: "42" });
  });
  it("submits blank input as a valid empty string rather than EOF", () => {
    const postMessage = vi.fn();
    vi.stubGlobal("navigator", { serviceWorker: { controller: { postMessage } } });
    submitTerminalInput({ token: "run1", id: "run1:1" }, "");
    expect(postMessage).toHaveBeenCalledWith({ type: "input-response", token: "run1", id: "run1:1", value: "" });
  });
  it("cancels the input wait when stopped", () => {
    const postMessage = vi.fn();
    vi.stubGlobal("navigator", { serviceWorker: { controller: { postMessage } } });
    cancelTerminalInput("run1");
    expect(postMessage).toHaveBeenCalledWith({ type: "cancel", token: "run1" });
  });
});