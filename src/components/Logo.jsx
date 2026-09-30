/**
 * The isibaya mark, in the two forms the app needs.
 *
 * Defined once so the brand cannot drift page by page — before this, every
 * screen drew its own green box with a cow emoji in it, and each one had
 * slightly different corners and gradients.
 *
 * Source artwork lives in /brand at the repo root; only the files referenced
 * here are copied into public/brand and shipped.
 */

/**
 * The app icon: the mark on its green rounded square. Same file the browser
 * uses as a favicon, so the tab and the page agree.
 */
export function LogoIcon({ size = 40, className = '', style }) {
  return (
    <img
      src="/favicon.svg"
      width={size}
      height={size}
      alt=""                 /* decorative — the wordmark beside it carries the name */
      className={className}
      style={{ display: 'block', borderRadius: size * 0.22, ...style }}
    />
  );
}

/**
 * Mark and wordmark side by side.
 *
 * `reversed` is the light version for dark backgrounds — the sidebar and the
 * footer — and `colour` is for light ones.
 */
export function LogoLockup({ height = 28, reversed = false, className = '' }) {
  return (
    <img
      src={`/brand/isibaya-horizontal-${reversed ? 'reversed' : 'colour'}.svg`}
      alt="isibaya"
      height={height}
      className={className}
      style={{ height, width: 'auto', display: 'block' }}
    />
  );
}
