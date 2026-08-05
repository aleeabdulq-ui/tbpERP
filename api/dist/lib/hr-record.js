const protectedFields = new Set(["nin", "bvn", "accountNumber"]);
function maskedProtectedValue(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return undefined;
    const last4 = value.last4;
    if (typeof last4 !== "string" || !/^\d{4}$/.test(last4))
        return undefined;
    return { last4, masked: `••••${last4}` };
}
export function sanitizeHrProfile(profile) {
    if (!profile || typeof profile !== "object" || Array.isArray(profile))
        return profile;
    return Object.fromEntries(Object.entries(profile).flatMap(([key, value]) => {
        if (!protectedFields.has(key))
            return [[key, value]];
        const masked = maskedProtectedValue(value);
        return masked ? [[key, masked]] : [];
    }));
}
export function confidentialEmployeeFields(profile, allowed) {
    return allowed ? { hrProfile: sanitizeHrProfile(profile) } : {};
}
