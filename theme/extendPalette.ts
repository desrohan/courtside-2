/**
 * Helper which enforces at compile‑time that
 * both `light` and `dark` are exactly the same `T`.
 */
export function extendTheme<T>(themes: { light: T; dark: T }): {
	light: T;
	dark: T;
} {
	return themes;
}
