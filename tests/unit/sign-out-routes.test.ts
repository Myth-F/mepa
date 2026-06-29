import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteLearnerSession = vi.fn();
const deleteStaffSession = vi.fn();

vi.mock("@/shared/auth/learner-session", () => ({ deleteLearnerSession }));
vi.mock("@/shared/auth/staff-session", () => ({ deleteStaffSession }));

describe("sign-out routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps learner sign-out redirects relative to the current public origin", async () => {
    const { POST } = await import("@/app/account/sign-out/route");

    const response = await POST();

    expect(deleteLearnerSession).toHaveBeenCalledOnce();
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/");
  });

  it("keeps staff sign-out redirects relative to the current public origin", async () => {
    const { POST } = await import("@/app/admin/sign-out/route");

    const response = await POST();

    expect(deleteStaffSession).toHaveBeenCalledOnce();
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/");
  });
});
