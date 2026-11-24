import { describe, expect, it } from "vitest";
import { appPath } from "./app-path";

describe("GitHub Pages paths", () => {
  it("keeps files within a repository website", () => {
    expect(appPath("python-worker.js", "/python-playground/")).toBe("/python-playground/python-worker.js");
    expect(appPath("python-input-sw.js", "/python-playground/")).toBe("/python-playground/python-input-sw.js");
    expect(appPath("images/irfan-founder.png", "/python-playground/")).toBe("/python-playground/images/irfan-founder.png");
    expect(appPath("favicon.ico", "/python-playground/")).toBe("/python-playground/favicon.ico");
  });
  it("also supports a root-domain Pages website", () => {
    expect(appPath("python-worker.js", "/")).toBe("/python-worker.js");
  });
});