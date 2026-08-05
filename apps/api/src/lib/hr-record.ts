import type { Prisma } from "@prisma/client";

const protectedFields = new Set(["nin", "bvn", "accountNumber"]);

function maskedProtectedValue(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const last4 = (value as Record<string, unknown>).last4;
  if (typeof last4 !== "string" || !/^\d{4}$/.test(last4)) return undefined;
  return { last4, masked: `••••${last4}` };
}

export function sanitizeHrProfile(profile: Prisma.JsonValue | null) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) return profile;
  return Object.fromEntries(
    Object.entries(profile).flatMap(([key, value]) => {
      if (!protectedFields.has(key)) return [[key, value]];
      const masked = maskedProtectedValue(value);
      return masked ? [[key, masked]] : [];
    }),
  );
}

export function confidentialEmployeeFields(profile: Prisma.JsonValue | null, allowed: boolean) {
  return allowed ? { hrProfile: sanitizeHrProfile(profile) } : {};
}
