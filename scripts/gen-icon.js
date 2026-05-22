#!/usr/bin/env node
// Generates the PWA icon (assets/icon-512.png): a full-bleed accent tile with a
// white fork + knife — matches the in-app logo mark. Run: node scripts/gen-icon.js
// (the 192px version is produced from this with `sips`). pngjs is a build-time
// dependency (npm install --no-save pngjs); the output PNG is what ships.
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const SIZE = 512;
const ACCENT = [0xD4, 0x59, 0x3A];
const WHITE = [0xFF, 0xFF, 0xFF];

// White shapes (rounded rects), centered ~ x=256, within the maskable safe zone.
const shapes = [
    // fork: 3 prongs
    { x0: 188, y0: 120, x1: 200, y1: 210, r: 6 },
    { x0: 204, y0: 120, x1: 216, y1: 210, r: 6 },
    { x0: 220, y0: 120, x1: 232, y1: 210, r: 6 },
    { x0: 188, y0: 196, x1: 232, y1: 218, r: 6 }, // neck joining the prongs
    { x0: 201, y0: 210, x1: 219, y1: 396, r: 9 }, // handle
    // knife: a single tapered-ish bar
    { x0: 300, y0: 120, x1: 324, y1: 396, r: 12 },
];

function inRoundRect(px, py, s) {
    if (px < s.x0 || px > s.x1 || py < s.y0 || py > s.y1) return false;
    const r = s.r;
    const corners = [[s.x0 + r, s.y0 + r, px < s.x0 + r, py < s.y0 + r],
                     [s.x1 - r, s.y0 + r, px > s.x1 - r, py < s.y0 + r],
                     [s.x0 + r, s.y1 - r, px < s.x0 + r, py > s.y1 - r],
                     [s.x1 - r, s.y1 - r, px > s.x1 - r, py > s.y1 - r]];
    for (const [cx, cy, inX, inY] of corners) {
        if (inX && inY) return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
    }
    return true;
}

const png = new PNG({ width: SIZE, height: SIZE });
for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
        const white = shapes.some(s => inRoundRect(x + 0.5, y + 0.5, s));
        const [r, g, b] = white ? WHITE : ACCENT;
        const i = (y * SIZE + x) << 2;
        png.data[i] = r; png.data[i + 1] = g; png.data[i + 2] = b; png.data[i + 3] = 255;
    }
}
const out = path.join(__dirname, '..', 'assets', 'icon-512.png');
fs.writeFileSync(out, PNG.sync.write(png));
console.log('wrote', out);
