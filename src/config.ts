/**
 * Owner-editable site settings.
 *
 * SITE_CREATED_ON — the day "Our Little World" began, as YYYY-MM-DD.
 * This could not be verified from Git history (the project has no repository), so it is the
 * day the site was first generated. Change it here, or set VITE_SITE_CREATED_ON in your
 * environment (Netlify → Site settings → Environment variables) without touching code.
 * Leave it empty ('') to hide the date line.
 */
export const SITE_CREATED_ON: string =
  (import.meta.env.VITE_SITE_CREATED_ON as string | undefined)?.trim() || '2026-11-01'
