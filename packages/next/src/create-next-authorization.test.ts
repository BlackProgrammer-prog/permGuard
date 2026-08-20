import {
  AbilityBuilder,
  createMongoAbility,
  ForbiddenError,
  type MongoAbility,
} from "@casl/ability";
import type { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { createNextAuthorization } from "./index.js";

type AppAbility = MongoAbility<["read" | "delete", "Product"]>;

function defineAbility(): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
  can("read", "Product");
  return build();
}

const request = new Request("https://example.test/api/products") as NextRequest;

const context = {
  params: Promise.resolve({}),
};

describe("createNextAuthorization", () => {
  it("returns the resolved ability for an allowed permission", async () => {
    const ability = defineAbility();
    const resolveAbility = vi.fn(() => ability);
    const authorization = createNextAuthorization(resolveAbility);

    await expect(authorization.requireCan("read", "Product")).resolves.toBe(
      ability,
    );
    expect(resolveAbility).toHaveBeenCalledOnce();
  });

  it("throws CASL ForbiddenError for a denied server check", async () => {
    const authorization = createNextAuthorization(defineAbility);

    await expect(
      authorization.requireCan("delete", "Product"),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("runs an allowed Route Handler and preserves its arguments", async () => {
    const handler = vi.fn((incomingRequest: NextRequest) =>
      Response.json({ url: incomingRequest.url }),
    );
    const authorization = createNextAuthorization(defineAbility);
    const protectedHandler = authorization.withAuthorization(
      ["read", "Product"],
      handler,
    );

    const response = await protectedHandler(request, context);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      url: "https://example.test/api/products",
    });
    expect(handler).toHaveBeenCalledWith(request, context);
  });

  it("returns 403 without running a denied Route Handler", async () => {
    const handler = vi.fn(() => new Response(null, { status: 204 }));
    const authorization = createNextAuthorization(defineAbility);
    const protectedHandler = authorization.withAuthorization(
      ["delete", "Product"],
      handler,
    );

    const response = await protectedHandler(request, context);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Forbidden",
      code: "PERMGUARD_FORBIDDEN",
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("supports a custom forbidden response", async () => {
    const authorization = createNextAuthorization(defineAbility);
    const protectedHandler = authorization.withAuthorization(
      ["delete", "Product"],
      () => new Response(null, { status: 204 }),
      {
        onForbidden: () =>
          Response.json({ error: "Not found" }, { status: 404 }),
      },
    );

    const response = await protectedHandler(request, context);

    expect(response.status).toBe(404);
  });

  it("does not hide resolver errors", async () => {
    const sessionError = new Error("Session unavailable");
    const authorization = createNextAuthorization<AppAbility>(() => {
      throw sessionError;
    });
    const protectedHandler = authorization.withAuthorization(
      ["read", "Product"],
      () => new Response(null, { status: 204 }),
    );

    await expect(protectedHandler(request, context)).rejects.toBe(sessionError);
  });
});
