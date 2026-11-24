import { describe, expect, it } from "vitest";
import { createSession, pythonFilename, restoreSessions } from "./workspace";

describe("Python workspace rules", () => {
  it("saves files with the requested .py extension", () => {
    expect(pythonFilename("main")).toBe("main.py");
    expect(pythonFilename("pattern.py")).toBe("pattern.py");
  });
  it("retains attached Python files and code in browser storage", () => {
    const session = createSession("test");
    session.files.push({ name: "helper.py", code: "value = 42" });
    expect(restoreSessions(JSON.stringify([session]))?.[0]?.files[1]).toEqual({ name: "helper.py", code: "value = 42" });
  });
  it("cleared code remains empty when restored", () => {
    const session = createSession("test", "Empty", "");
    expect(restoreSessions(JSON.stringify([session]))?.[0]?.files[0]?.code).toBe("");
  });
  it("rejects broken storage without crashing", () => {
    expect(restoreSessions("{broken")).toBeNull();
    expect(restoreSessions('[{"id":"x"}]')).toBeNull();
  });
});