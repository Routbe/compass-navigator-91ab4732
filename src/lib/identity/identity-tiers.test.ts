import { describe, expect, it } from "vitest";
import { badgesFor, tiersFor } from "./identity-tiers";

describe("identity tiers", () => {
  it("Didit passport gives both tiers", () => {
    expect(tiersFor([{ provider: "didit", verified: true }])).toEqual({ tier1RealHuman: true, tier2LegalIdentity: true });
  });
  it("W Identity gives only tier 1", () => {
    expect(tiersFor([{ provider: "w_identity", verified: true }])).toEqual({ tier1RealHuman: true, tier2LegalIdentity: false });
  });
  it("a passkey alone never proves a unique human", () => {
    expect(tiersFor([{ provider: "passkey", verified: true }]).tier1RealHuman).toBe(false);
  });
  it("unverified proofs count for nothing", () => {
    expect(tiersFor([{ provider: "didit", verified: false }]).tier2LegalIdentity).toBe(false);
  });
  it("root profile shows the blue mark only with tier 2", () => {
    expect(badgesFor("root", { tier1RealHuman: true, tier2LegalIdentity: false }, { aliasHumanBadgeOn: true }).blueMark).toBe(false);
    expect(badgesFor("root", { tier1RealHuman: true, tier2LegalIdentity: true }, { aliasHumanBadgeOn: true }).blueMark).toBe(true);
  });
  it("alias never shows the legal name or blue mark", () => {
    const b = badgesFor("alias", { tier1RealHuman: true, tier2LegalIdentity: true }, { aliasHumanBadgeOn: true });
    expect(b).toEqual({ blueMark: false, humanBadge: true, showLegalName: false });
  });
  it("alias human badge needs the owner's opt-in and a tier", () => {
    expect(badgesFor("alias", { tier1RealHuman: true, tier2LegalIdentity: false }, { aliasHumanBadgeOn: false }).humanBadge).toBe(false);
    expect(badgesFor("alias", { tier1RealHuman: false, tier2LegalIdentity: false }, { aliasHumanBadgeOn: true }).humanBadge).toBe(false);
  });
});
