import { appPath } from "./app-path";

export type InputRequest = { token: string; id: string };

export async function prepareTerminalInput(token: string): Promise<void> {
  if (!("serviceWorker" in navigator)) throw new Error("Interactive input is unavailable in this browser. Please use a current browser.");
  await navigator.serviceWorker.register(appPath("python-input-sw.js"), { scope: import.meta.env.BASE_URL });
  await navigator.serviceWorker.ready;
  if (!navigator.serviceWorker.controller) {
    await new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true });
      if (navigator.serviceWorker.controller) resolve();
    });
  }
  const controller = navigator.serviceWorker.controller;
  if (!controller) throw new Error("Terminal input could not start. Refresh and try again.");
  await new Promise<void>((resolve, reject) => {
    const channel = new MessageChannel();
    const timeout = setTimeout(() => { channel.port1.close(); reject(new Error("Terminal input connection timed out. Refresh and try again.")); }, 10000);
    channel.port1.onmessage = () => { clearTimeout(timeout); channel.port1.close(); resolve(); };
    controller.postMessage({ type: "register", token }, [channel.port2]);
  });
}

export function submitTerminalInput(request: InputRequest, value: string) {
  navigator.serviceWorker.controller?.postMessage({ type: "input-response", ...request, value });
}

export function cancelTerminalInput(token: string | null) {
  if (token) navigator.serviceWorker.controller?.postMessage({ type: "cancel", token });
}