import { appRouter } from "./routers";

describe("auth", () => {
  it("smoke", () => {
    expect(appRouter).toBeDefined();
  });
});
