import { describe, expect, it } from "vitest";
import { decryptPayload, encryptPayload, isEncryptedPayload } from "./encryption";

describe("encryption service", () => {
  it("returns unencrypted raw string if no password is provided", async () => {
    const raw = JSON.stringify({ hello: "world" });
    const encrypted = await encryptPayload(raw, "");
    expect(encrypted).toBe(raw);
    expect(isEncryptedPayload(encrypted)).toBe(false);
  });

  it("encrypts and decrypts payload correctly with AES-GCM when password is provided", async () => {
    const raw = JSON.stringify({ key: "secret_data_123" });
    const passphrase = "my-secret-passphrase";
    const encrypted = await encryptPayload(raw, passphrase);

    expect(isEncryptedPayload(encrypted)).toBe(true);
    expect(encrypted).not.toBe(raw);

    const decrypted = await decryptPayload(encrypted, passphrase);
    expect(decrypted).toBe(raw);
  });

  it("fails decryption when passphrase is wrong", async () => {
    const raw = JSON.stringify({ data: 42 });
    const encrypted = await encryptPayload(raw, "correct_pass");

    await expect(decryptPayload(encrypted, "wrong_pass")).rejects.toThrow();
  });
});
