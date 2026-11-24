export function appPath(path: string, base = import.meta.env.BASE_URL): string {
  return `${base.endsWith("/") ? base : `${base}/`}${path.replace(/^\/+/, "")}`;
}