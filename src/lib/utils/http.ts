export async function readJsonSafe(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Expected JSON but got: ${text.slice(0, 200)}`);
    }
  }
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

export async function fetchRetry(
  url: string,
  init: RequestInit = {},
  tries = 3,
  pauseMs = 1000
): Promise<Response> {
  let lastErr: Error | undefined;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, init);
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${body}`);
      }
      return res;
    } catch (e) {
      lastErr = e as Error;
      if (i < tries - 1) {
        await new Promise((r) => setTimeout(r, pauseMs));
      }
    }
  }
  throw lastErr;
}
