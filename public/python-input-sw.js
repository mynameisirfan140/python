// Browser-local stdin rendezvous. Only this exact path is intercepted; nothing is cached.
const sessions = new Map();
const pending = new Map();
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("message", (event) => {
  const data = event.data;
  const clientId = event.source?.id;
  if (!clientId || !data?.token) return;
  if (data.type === "register") {
    sessions.set(data.token, clientId);
    event.ports[0]?.postMessage({ ready: true });
    return;
  }
  if (sessions.get(data.token) !== clientId) return;
  const request = pending.get(data.token);
  if (data.type === "input-response" && request?.id === data.id) {
    pending.delete(data.token);
    request.resolve(new Response(JSON.stringify({ value: data.value }), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }));
  }
  if (data.type === "cancel") {
    pending.delete(data.token);
    sessions.delete(data.token);
    request?.resolve(new Response("Input cancelled", { status: 410, headers: { "Cache-Control": "no-store" } }));
  }
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const endpoint = new URL("__python_terminal_input", self.location.href);
  if (url.origin !== endpoint.origin || url.pathname !== endpoint.pathname || event.request.method !== "POST") return;
  event.respondWith((async () => {
    const { token, id } = await event.request.json();
    const ownerId = sessions.get(token);
    const owner = ownerId ? await self.clients.get(ownerId) : null;
    if (!owner || pending.has(token)) return new Response("Input session unavailable", { status: 409 });
    return new Promise((resolve) => {
      pending.set(token, { resolve, id });
      owner.postMessage({ type: "input-request", token, id });
    });
  })());
});