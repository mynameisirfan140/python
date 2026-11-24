import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

function inputBridge(base = "/") {
  const handlers = new Map<string, (event: any) => void>();
  const postMessage = vi.fn();
  runInNewContext(readFileSync("public/python-input-sw.js", "utf8"), {
    URL, Response,
    self: {
      location: { origin: "https://playground.test", href: `https://playground.test${base}python-input-sw.js` },
      clients: { get: async () => ({ postMessage }) },
      addEventListener: (name: string, callback: (event: any) => void) => handlers.set(name, callback),
    },
    Map, Promise,
  });
  const message = (data: unknown, client = "owner") => handlers.get("message")?.({ source: { id: client }, data, ports: [] });
  const read = (token = "run", id = "prompt1") => {
    let response: Promise<Response> | undefined;
    handlers.get("fetch")?.({
      request: { url: `https://playground.test${base}__python_terminal_input`, method: "POST", json: async () => ({ token, id }) },
      respondWith: (value: Promise<Response>) => { response = value; },
    });
    return response;
  };
  return { message, read, postMessage };
}

describe("Python input rendezvous", () => {
  it("requires a separate answer for every consecutive prompt", async () => {
    const bridge = inputBridge();
    bridge.message({ type: "register", token: "run" });
    for (const [id, value] of [["first", "alpha"], ["second", "beta"], ["third", "gamma"]]) {
      const result = bridge.read("run", id);
      await vi.waitFor(() => expect(bridge.postMessage).toHaveBeenLastCalledWith({ type: "input-request", token: "run", id }));
      let completed = false;
      void result?.then(() => { completed = true; });
      bridge.message({ type: "input-response", token: "run", id: "stale", value: "unknown" });
      await Promise.resolve();
      expect(completed).toBe(false);
      bridge.message({ type: "input-response", token: "run", id, value });
      const response = await result;
      expect(await response?.json()).toEqual({ value });
      expect(response?.headers.get("Cache-Control")).toBe("no-store");
    }
  });
  it("cancels a waiting input and accepts input in the next run", async () => {
    const bridge = inputBridge();
    bridge.message({ type: "register", token: "run" });
    const stopped = bridge.read();
    await vi.waitFor(() => expect(bridge.postMessage).toHaveBeenCalled());
    bridge.message({ type: "cancel", token: "run" });
    expect((await stopped)?.status).toBe(410);
    bridge.message({ type: "register", token: "next" });
    const next = bridge.read("next", "first");
    await vi.waitFor(() => expect(bridge.postMessage).toHaveBeenLastCalledWith({ type: "input-request", token: "next", id: "first" }));
    bridge.message({ type: "input-response", token: "run", id: "prompt1", value: "unknown" });
    bridge.message({ type: "input-response", token: "next", id: "first", value: "fresh" });
    expect(await (await next)?.json()).toEqual({ value: "fresh" });
  });
  it("collects input under a GitHub Pages repository subpath", async () => {
    const bridge = inputBridge("/python-playground/");
    bridge.message({ type: "register", token: "run" });
    const result = bridge.read();
    await vi.waitFor(() => expect(bridge.postMessage).toHaveBeenCalledWith({ type: "input-request", token: "run", id: "prompt1" }));
    bridge.message({ type: "input-response", token: "run", id: "prompt1", value: "42" });
    expect(await (await result)?.json()).toEqual({ value: "42" });
  });
  it("waits for terminal input instead of returning EOF", async () => {
    const bridge = inputBridge();
    bridge.message({ type: "register", token: "run" });
    const result = bridge.read();
    await vi.waitFor(() => expect(bridge.postMessage).toHaveBeenCalledWith({ type: "input-request", token: "run", id: "prompt1" }));
    let completed = false;
    void result?.then(() => { completed = true; });
    await Promise.resolve();
    expect(completed).toBe(false);
    bridge.message({ type: "input-response", token: "run", id: "prompt1", value: "42" });
    expect(await (await result)?.json()).toEqual({ value: "42" });
  });
  it("accepts an empty line without signaling EOF", async () => {
    const bridge = inputBridge();
    bridge.message({ type: "register", token: "run" });
    const result = bridge.read();
    await vi.waitFor(() => expect(bridge.postMessage).toHaveBeenCalled());
    bridge.message({ type: "input-response", token: "run", id: "prompt1", value: "" });
    expect(await (await result)?.json()).toEqual({ value: "" });
  });
  it("does not let another tab answer a prompt", async () => {
    const bridge = inputBridge();
    bridge.message({ type: "register", token: "run" });
    const result = bridge.read();
    await vi.waitFor(() => expect(bridge.postMessage).toHaveBeenCalled());
    bridge.message({ type: "input-response", token: "run", id: "prompt1", value: "wrong" }, "another-tab");
    bridge.message({ type: "input-response", token: "run", id: "prompt1", value: "correct" });
    expect(await (await result)?.json()).toEqual({ value: "correct" });
  });
});