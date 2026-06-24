import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentStaff = vi.fn();
const assetCreate = vi.fn();
const assetFindFirst = vi.fn();
const assetUpdate = vi.fn();
const blockFindFirst = vi.fn();
const createSignedUpload = vi.fn();
const createSignedDownload = vi.fn();
const inspectObject = vi.fn();
const deleteObject = vi.fn();

vi.mock("@/shared/auth/staff-session", () => ({ getCurrentStaff }));
vi.mock("@/shared/db/prisma", () => ({
  prisma: {
    mediaAsset: { create: assetCreate, findFirst: assetFindFirst, update: assetUpdate },
    moduleBlock: { findFirst: blockFindFirst },
  },
}));
vi.mock("@/modules/media/s3-adapter", () => ({
  getMediaStorage: () => ({
    createSignedUpload,
    createSignedDownload,
    inspectObject,
    deleteObject,
  }),
}));

describe("media upload and delivery routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentStaff.mockResolvedValue({ id: "staff-1", role: "EDITOR", name: "Éditrice" });
    assetCreate.mockResolvedValue({ id: "media-1" });
  });

  it("rejects unauthenticated and invalid upload preparations", async () => {
    const { POST } = await import("@/app/api/admin/media/uploads/route");
    getCurrentStaff.mockResolvedValueOnce(null);
    const unauthenticated = await POST(
      new Request("http://test/api/admin/media/uploads", {
        method: "POST",
        body: JSON.stringify({ mimeType: "image/png", sizeBytes: 3, altText: "Logo" }),
      }),
    );
    expect(unauthenticated.status).toBe(401);

    const invalid = await POST(
      new Request("http://test/api/admin/media/uploads", {
        method: "POST",
        body: JSON.stringify({
          mimeType: "text/html",
          sizeBytes: 3,
          altText: "",
          isDecorative: false,
        }),
      }),
    );
    expect(invalid.status).toBe(400);
    expect(assetCreate).not.toHaveBeenCalled();
  });

  it("reserves metadata then verifies the exact uploaded bytes", async () => {
    const { POST } = await import("@/app/api/admin/media/uploads/route");
    const preparation = await POST(
      new Request("http://test/api/admin/media/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mimeType: "image/png",
          sizeBytes: 3,
          altText: "Schéma explicatif",
          isDecorative: false,
        }),
      }),
    );
    expect(preparation.status).toBe(201);
    expect(assetCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          uploadedByStaffId: "staff-1",
          altText: "Schéma explicatif",
        }),
      }),
    );

    assetFindFirst.mockResolvedValue({
      id: "media-1",
      objectKey: "media/2026/06/key.png",
      mimeType: "image/png",
      sizeBytes: 3,
      uploadedByStaffId: "staff-1",
      uploadedAt: null,
      uploadExpiresAt: new Date(Date.now() + 60_000),
    });
    createSignedUpload.mockResolvedValue({
      url: "http://storage/upload",
      objectKey: "media/2026/06/key.png",
      requiredHeaders: { "Content-Type": "image/png" },
      expiresInSeconds: 300,
    });
    inspectObject.mockResolvedValue({ sizeBytes: 3, mimeType: "image/png" });
    assetUpdate.mockResolvedValue({ id: "media-1" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));

    const { PUT } = await import("@/app/api/admin/media/uploads/[mediaId]/content/route");
    const response = await PUT(
      new Request("http://test/api/admin/media/uploads/media-1/content", {
        method: "PUT",
        headers: { "Content-Type": "image/png" },
        body: new Uint8Array([1, 2, 3]),
      }),
      { params: Promise.resolve({ mediaId: "media-1" }) },
    );
    expect(response.status).toBe(200);
    expect(inspectObject).toHaveBeenCalledWith("media/2026/06/key.png");
    expect(assetUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ uploadedAt: expect.any(Date) }) }),
    );
    vi.unstubAllGlobals();
  });

  it("does not disclose a completed asset without a published reference", async () => {
    assetFindFirst.mockResolvedValue({
      id: "media-1",
      objectKey: "media/key.png",
      mimeType: "image/png",
      sizeBytes: 3,
      uploadedAt: new Date(),
    });
    getCurrentStaff.mockResolvedValue(null);
    blockFindFirst.mockResolvedValue(null);
    const { GET } = await import("@/app/api/media/[mediaId]/route");
    const hidden = await GET(new Request("http://test/api/media/media-1"), {
      params: Promise.resolve({ mediaId: "media-1" }),
    });
    expect(hidden.status).toBe(404);

    blockFindFirst.mockResolvedValue({ id: "block-1" });
    createSignedDownload.mockResolvedValue("https://storage.example/signed");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { "Content-Type": "image/png" },
        }),
      ),
    );
    const publicResponse = await GET(new Request("http://test/api/media/media-1"), {
      params: Promise.resolve({ mediaId: "media-1" }),
    });
    expect(publicResponse.status).toBe(200);
    expect(publicResponse.headers.get("content-type")).toBe("image/png");
    vi.unstubAllGlobals();
  });
});
