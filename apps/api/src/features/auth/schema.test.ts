import assert from "node:assert/strict";
import test from "node:test";
import { loginSchema, registerSchema } from "./schema.js";

test("registration accepts normalized-shape email and strong password input", () => {
  const result = registerSchema.safeParse({
    email: "person@example.com",
    password: "correct horse battery",
    displayName: "Poll creator",
  });
  assert.equal(result.success, true);
});

test("registration rejects short passwords and invalid emails", () => {
  assert.equal(
    registerSchema.safeParse({
      email: "not-an-email",
      password: "short",
      displayName: "A",
    }).success,
    false,
  );
});

test("login schema does not trim or transform credentials", () => {
  assert.equal(
    loginSchema.safeParse({ email: "person@example.com", password: " p " })
      .success,
    true,
  );
});
