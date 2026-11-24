export type PythonFile = { name: string; code: string };
export type Session = { id: string; name: string; files: PythonFile[]; activeFile: string; input: string };
export const STORAGE_KEY = "tekzbyte-python-workspace-v1";
export const STARTER = `# Welcome to your Python playground.
# A little curiosity goes a long way.

def greet(name):
    return f"Hello, {name}!"

print(greet("world"))
print("Let's build something great. 🚀")

# Try a pattern
for i in range(1, 6):
    print("✦ " * i)
`;

export function createSession(id: string, name = "Welcome", code = STARTER): Session {
  return { id, name, files: [{ name: "main.py", code }], activeFile: "main.py", input: "" };
}

export function pythonFilename(name: string): string {
  const basename = name.split(/[\\/]/).at(-1)?.trim() || "main";
  return basename.endsWith(".py") ? basename : `${basename}.py`;
}

export function restoreSessions(raw: string | null): Session[] | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || !value.length) return null;
    const valid = value.every((s: unknown) => {
      if (!s || typeof s !== "object") return false;
      const r = s as Record<string, unknown>;
      return typeof r["id"] === "string" && typeof r["name"] === "string" && typeof r["input"] === "string" &&
        typeof r["activeFile"] === "string" && Array.isArray(r["files"]) && r["files"].length > 0 &&
        r["files"].every((f: unknown) => {
          if (!f || typeof f !== "object") return false;
          const file = f as Record<string, unknown>;
          return typeof file["name"] === "string" && file["name"].endsWith(".py") && typeof file["code"] === "string";
        }) && r["files"].some((f: { name: string }) => f.name === r["activeFile"]);
    });
    return valid ? value as Session[] : null;
  } catch { return null; }
}

export const EXAMPLES = [
  { name: "Hello, world", description: "Start with the classics", code: 'name = input("What is your name? ")\nprint(f"Hello, {name}!")\n' },
  { name: "Star patterns", description: "Loops with a little sparkle", code: 'for i in range(1, 8):\n    print(" " * (7 - i) + "* " * i)\n' },
  { name: "Fibonacci", description: "A sequence of possibilities", code: 'a, b = 0, 1\nfor _ in range(12):\n    print(a, end=" ")\n    a, b = b, a + b\nprint()\n' },
  { name: "Modules & math", description: "Explore the standard library", code: 'import math\nimport random\nfrom collections import Counter\n\nprint("π:", math.pi)\nprint("Square root of 144:", math.sqrt(144))\nprint("Dice roll:", random.randint(1, 6))\nprint("Letters:", dict(Counter("tekzbyte")))\n' },
  { name: "NumPy arrays", description: "Meet scientific Python", code: 'import numpy as np\n\nnumbers = np.array([1, 2, 3, 4, 5])\nprint("Array:", numbers)\nprint("Mean:", numbers.mean())\nprint("Squared:", numbers ** 2)\n' },
];