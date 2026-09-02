/**
 * The one place a Claude model string is allowed to live.
 *
 * Enforced by the `no-restricted-syntax` ESLint rule in eslint.config.mjs:
 * a hardcoded "claude-*" literal anywhere else in application source is a
 * lint error, not a warning. This is the March 404 tripwire.
 */
export const CLAUDE_MODEL = "claude-fable-5-1";
