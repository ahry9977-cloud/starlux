import { describe, it, expect } from "vitest";
import { 
  countryCodes, 
  isBlockedCountry, 
  getCountryByDialCode, 
  getCountryByCode,
  searchCountries,
  defaultCountry
} from "../shared/countryCodes";

describe("Country Codes System", () => {
  describe("countryCodes list", () => {
    it("should contain at least 150 countries", () => {
      expect(countryCodes.length).toBeGreaterThanOrEqual(150);
    });

    it("should NOT contain Israel (+972)", () => {
      const israel = countryCodes.find(c => 
        c.dialCode === "+972" || 
        c.code === "IL" || 
        c.name.toLowerCase().includes("israel") ||
        c.nameAr.includes("إسرائيل")
      );
      expect(israel).toBeUndefined();
    });

    it("should contain Iraq as the first Arab country", () => {
      const iraq = countryCodes.find(c => c.code === "IQ");
      expect(iraq).toBeDefined();
      expect(iraq?.dialCode).toBe("+964");
      expect(iraq?.nameAr).toBe("العراق");
    });

    it("should contain all Gulf countries", () => {
      const gulfCodes = ["SA", "AE", "KW", "QA", "BH", "OM"];
      gulfCodes.forEach(code => {
        const country = countryCodes.find(c => c.code === code);
        expect(country).toBeDefined();
      });
    });

    it("should contain Palestine", () => {
      const palestine = countryCodes.find(c => c.code === "PS");
      expect(palestine).toBeDefined();
      expect(palestine?.dialCode).toBe("+970");
      expect(palestine?.nameAr).toBe("فلسطين");
    });

    it("should have valid structure for all countries", () => {
      countryCodes.forEach(country => {
        expect(country.name).toBeTruthy();
        expect(country.nameAr).toBeTruthy();
        expect(country.code).toBeTruthy();
        expect(country.dialCode).toMatch(/^\+\d+$/);
        expect(country.flag).toBeTruthy();
      });
    });

    it("should have unique country codes", () => {
      const codes = countryCodes.map(c => c.code);
      const uniqueCodes = [...new Set(codes)];
      expect(codes.length).toBe(uniqueCodes.length);
    });
  });

  describe("isBlockedCountry function", () => {
    it("should block +972 (Israel)", () => {
      expect(isBlockedCountry("+972")).toBe(true);
    });

    it("should block 972 without plus", () => {
      expect(isBlockedCountry("972")).toBe(true);
    });

    it("should block 00972", () => {
      expect(isBlockedCountry("00972")).toBe(true);
    });

    it("should NOT block Iraq +964", () => {
      expect(isBlockedCountry("+964")).toBe(false);
    });

    it("should NOT block Saudi Arabia +966", () => {
      expect(isBlockedCountry("+966")).toBe(false);
    });

    it("should NOT block Palestine +970", () => {
      expect(isBlockedCountry("+970")).toBe(false);
    });

    it("should NOT block UAE +971", () => {
      expect(isBlockedCountry("+971")).toBe(false);
    });

    it("should NOT block USA +1", () => {
      expect(isBlockedCountry("+1")).toBe(false);
    });

    it("should NOT block UK +44", () => {
      expect(isBlockedCountry("+44")).toBe(false);
    });
  });

  describe("getCountryByDialCode function", () => {
    it("should find Iraq by +964", () => {
      const country = getCountryByDialCode("+964");
      expect(country).toBeDefined();
      expect(country?.code).toBe("IQ");
    });

    it("should find Saudi Arabia by +966", () => {
      const country = getCountryByDialCode("+966");
      expect(country).toBeDefined();
      expect(country?.code).toBe("SA");
    });

    it("should return undefined for +972 (Israel)", () => {
      const country = getCountryByDialCode("+972");
      expect(country).toBeUndefined();
    });

    it("should return undefined for invalid dial code", () => {
      const country = getCountryByDialCode("+9999");
      expect(country).toBeUndefined();
    });
  });

  describe("getCountryByCode function", () => {
    it("should find Iraq by IQ", () => {
      const country = getCountryByCode("IQ");
      expect(country).toBeDefined();
      expect(country?.dialCode).toBe("+964");
    });

    it("should find Palestine by PS", () => {
      const country = getCountryByCode("PS");
      expect(country).toBeDefined();
      expect(country?.dialCode).toBe("+970");
    });

    it("should return undefined for IL (Israel)", () => {
      const country = getCountryByCode("IL");
      expect(country).toBeUndefined();
    });
  });

  describe("searchCountries function", () => {
    it("should find Iraq by Arabic name", () => {
      const results = searchCountries("العراق");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].code).toBe("IQ");
    });

    it("should find Iraq by English name", () => {
      const results = searchCountries("iraq");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].code).toBe("IQ");
    });

    it("should find countries by dial code", () => {
      const results = searchCountries("+964");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].code).toBe("IQ");
    });

    it("should find countries by country code", () => {
      const results = searchCountries("SA");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(c => c.code === "SA")).toBe(true);
    });

    it("should NOT find Israel", () => {
      const results1 = searchCountries("israel");
      const results2 = searchCountries("إسرائيل");
      const results3 = searchCountries("+972");
      
      expect(results1.length).toBe(0);
      expect(results2.length).toBe(0);
      expect(results3.length).toBe(0);
    });

    it("should return empty array for non-existent country", () => {
      const results = searchCountries("xyzabc");
      expect(results.length).toBe(0);
    });
  });

  describe("defaultCountry", () => {
    it("should be Iraq", () => {
      expect(defaultCountry).toBeDefined();
      expect(defaultCountry.code).toBe("IQ");
      expect(defaultCountry.dialCode).toBe("+964");
    });
  });

  describe("Regional coverage", () => {
    it("should contain all Arab countries", () => {
      const arabCodes = [
        "IQ", "SA", "AE", "KW", "QA", "BH", "OM", "YE", "JO", "LB", 
        "SY", "PS", "EG", "LY", "TN", "DZ", "MA", "MR", "SD", "SO", 
        "DJ", "KM"
      ];
      arabCodes.forEach(code => {
        const country = countryCodes.find(c => c.code === code);
        expect(country).toBeDefined();
      });
    });

    it("should contain major European countries", () => {
      const europeCodes = ["GB", "DE", "FR", "IT", "ES", "NL", "BE", "CH", "AT", "SE"];
      europeCodes.forEach(code => {
        const country = countryCodes.find(c => c.code === code);
        expect(country).toBeDefined();
      });
    });

    it("should contain major Asian countries", () => {
      const asiaCodes = ["CN", "JP", "KR", "IN", "PK", "TR", "IR", "ID", "MY", "TH"];
      asiaCodes.forEach(code => {
        const country = countryCodes.find(c => c.code === code);
        expect(country).toBeDefined();
      });
    });

    it("should contain major American countries", () => {
      const americaCodes = ["US", "CA", "MX", "BR", "AR", "CO", "PE", "CL"];
      americaCodes.forEach(code => {
        const country = countryCodes.find(c => c.code === code);
        expect(country).toBeDefined();
      });
    });

    it("should contain major African countries", () => {
      const africaCodes = ["ZA", "NG", "KE", "ET", "GH", "TZ", "UG"];
      africaCodes.forEach(code => {
        const country = countryCodes.find(c => c.code === code);
        expect(country).toBeDefined();
      });
    });

    it("should contain Oceania countries", () => {
      const oceaniaCodes = ["AU", "NZ", "FJ", "PG"];
      oceaniaCodes.forEach(code => {
        const country = countryCodes.find(c => c.code === code);
        expect(country).toBeDefined();
      });
    });
  });
});
