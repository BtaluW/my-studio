import { encodeSignatureHeader, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { handleRevalidate } from "@/lib/revalidateHandler";

const SECRET = "test-secret-please-ignore";

async function signedRequest(payload: unknown, secret = SECRET) {
  const body = JSON.stringify(payload);
  const signature = await encodeSignatureHeader(body, Date.now(), secret);
  return new NextRequest("http://localhost/api/revalidate", {
    method: "POST",
    body,
    headers: { "content-type": "application/json", [SIGNATURE_HEADER_NAME]: signature },
  });
}

const run = (req: NextRequest, opts: { secret?: string | undefined } = { secret: SECRET }) => {
  const expire = vi.fn();
  return handleRevalidate(req, { secret: opts.secret, expire, waitForConsistency: false }).then((res) => ({ res, expire }));
};

describe("handleRevalidate", () => {
  it("expires the cache for a correctly signed beat change", async () => {
    const { res, expire } = await run(await signedRequest({ _type: "beat" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ revalidated: true, type: "beat" });
    expect(expire).toHaveBeenCalledOnce();
  });

  it("rejects a request with no signature header (parseBody returns null)", async () => {
    const req = new NextRequest("http://localhost/api/revalidate", { method: "POST", body: '{"_type":"beat"}' });
    const { res, expire } = await run(req);
    expect(res.status).toBe(401);
    expect(expire).not.toHaveBeenCalled();
  });

  it("rejects a request signed with the wrong secret", async () => {
    const { res, expire } = await run(await signedRequest({ _type: "beat" }, "some-other-secret"));
    expect(res.status).toBe(401);
    expect(expire).not.toHaveBeenCalled();
  });

  it("ignores document types that don't affect the page", async () => {
    const { res, expire } = await run(await signedRequest({ _type: "sanity.imageAsset" }));
    expect(res.status).toBe(400);
    expect(expire).not.toHaveBeenCalled();
  });

  it("fails closed when the secret isn't configured", async () => {
    const { res, expire } = await run(await signedRequest({ _type: "beat" }), { secret: undefined });
    expect(res.status).toBe(500);
    expect(expire).not.toHaveBeenCalled();
  });
});
