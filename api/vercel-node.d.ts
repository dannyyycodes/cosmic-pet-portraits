declare module "@vercel/node" {
  import type { IncomingMessage, ServerResponse } from "node:http";

  export interface VercelRequest extends IncomingMessage {
    query: Record<string, string | string[] | undefined>;
    body?: unknown;
    cookies: Record<string, string>;
  }

  export interface VercelResponse extends ServerResponse {
    status(statusCode: number): this;
    json(body: unknown): this;
    send(body: unknown): this;
    redirect(statusOrUrl: number | string, url?: string): this;
  }
}
