import { describe, expect, it } from "vitest";
import { StepError } from "@/lib/pipeline/errors";
import { assertSafeUrl, isPublicAddress } from "@/lib/pipeline/safe-fetch";

describe("isPublicAddress", () => {
  it.each(["8.8.8.8", "93.184.215.14", "2606:4700:4700::1111"])("allows public address %s", (ip) => {
    expect(isPublicAddress(ip)).toBe(true);
  });

  it.each([
    ["127.0.0.1", "loopback"],
    ["10.0.0.5", "private network"],
    ["192.168.1.1", "home router"],
    ["172.16.0.1", "private network"],
    ["169.254.169.254", "cloud metadata service"],
    ["0.0.0.0", "unspecified"],
    ["::1", "IPv6 loopback"],
    ["fc00::1", "IPv6 private"],
    ["::ffff:10.0.0.1", "private IPv4 written as IPv6"],
    ["not-an-ip", "not an address"],
  ])("blocks %s (%s)", (ip) => {
    expect(isPublicAddress(ip)).toBe(false);
  });
});

describe("assertSafeUrl", () => {
  it.each([
    "ftp://example.com/file",
    "file:///etc/passwd",
    "http://localhost:3000",
    "http://printer.local",
    "http://127.0.0.1/admin",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]/",
    "http://8.8.8.8:8080/",
    "not a url",
  ])("rejects %s", async (url) => {
    await expect(assertSafeUrl(url)).rejects.toBeInstanceOf(StepError);
  });

  it("accepts a public IP address on a normal port", async () => {
    await expect(assertSafeUrl("https://8.8.8.8/")).resolves.toBeInstanceOf(URL);
  });
});
