/**
 * Inline SVG placeholder — works offline, no external dependency.
 * Returns a data URI that renders a grey box with optional label.
 */
export function placeholderImg(size = 400, label = 'Product'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#f3f4f6"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
      font-family="system-ui,sans-serif" font-size="${Math.max(12, size / 12)}" fill="#9ca3af">${label}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const IMG_FALLBACK = placeholderImg(400, 'Product');
export const IMG_FALLBACK_SM = placeholderImg(64, '?');
