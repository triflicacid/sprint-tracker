/**
 * converts a CSS hex colour to an RGB triple
 *
 * @param hex hex colour string (#rrggbb)
 * @returns RGB triple [r, g, b]
 */
export function hexToRgb(hex: string): [number, number, number] {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

