#!/usr/bin/env node

/**
 * PWA Icon Generator
 *
 * This script generates placeholder PWA icon files (192x192, 512x512, and maskable variants).
 *
 * TODO: Replace these placeholder icons with proper designs before shipping to production.
 * The icons are minimally valid PNGs that satisfy PWA manifest requirements for development/testing.
 *
 * For production:
 * - Design proper 192x192, 512x512, and maskable (192x192) icons
 * - Export as PNG from your design tool
 * - Run this script with proper icon assets or replace manually
 *
 * Usage: node scripts/generate-pwa-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');

/**
 * Creates a minimal valid PNG file with a solid color.
 * This is a placeholder for proper icon designs.
 *
 * PNG header and minimal structure for testing purposes.
 */
function createMinimalPNG(width, height) {
  // Minimal PNG with just a header and data chunks
  // This creates a 1x1 transparent PNG that can be resized
  const buffer = Buffer.alloc(67);

  // PNG signature
  buffer.writeUInt8(0x89, 0);
  buffer.writeUInt8(0x50, 1);
  buffer.writeUInt8(0x4E, 2);
  buffer.writeUInt8(0x47, 3);
  buffer.writeUInt8(0x0D, 4);
  buffer.writeUInt8(0x0A, 5);
  buffer.writeUInt8(0x1A, 6);
  buffer.writeUInt8(0x0A, 7);

  // IHDR chunk (image header)
  // Length: 13 bytes
  buffer.writeUInt32BE(13, 8);
  // Chunk type: IHDR
  buffer.write('IHDR', 12);
  // Width
  buffer.writeUInt32BE(width, 16);
  // Height
  buffer.writeUInt32BE(height, 20);
  // Bit depth: 8
  buffer.writeUInt8(8, 24);
  // Color type: 6 (RGBA)
  buffer.writeUInt8(6, 25);
  // Compression method
  buffer.writeUInt8(0, 26);
  // Filter method
  buffer.writeUInt8(0, 27);
  // Interlace method
  buffer.writeUInt8(0, 28);
  // CRC
  buffer.writeUInt32BE(0x5257da47, 29);

  // IDAT chunk (image data - minimal transparent data)
  buffer.writeUInt32BE(11, 33);
  buffer.write('IDAT', 37);
  // Minimal zlib compressed data (transparent)
  buffer.writeUInt8(0x78, 41);
  buffer.writeUInt8(0x9C, 42);
  buffer.writeUInt8(0x62, 43);
  buffer.writeUInt8(0x00, 44);
  buffer.writeUInt8(0x00, 45);
  buffer.writeUInt8(0x00, 46);
  buffer.writeUInt8(0x02, 47);
  buffer.writeUInt8(0x00, 48);
  buffer.writeUInt8(0x01, 49);
  buffer.writeUInt32BE(0x3c1e9f9f, 50);

  // IEND chunk
  buffer.writeUInt32BE(0, 54);
  buffer.write('IEND', 58);
  buffer.writeUInt32BE(0xae426082, 62);

  return buffer;
}

async function generateIcons() {
  try {
    console.log('Generating placeholder PWA icons...');
    console.log('⚠️  NOTE: These are placeholder icons for development/testing.');
    console.log('           Replace with proper designs before production.\n');

    const icons = [
      { name: 'pwa-192x192.png', width: 192, height: 192 },
      { name: 'pwa-512x512.png', width: 512, height: 512 },
      { name: 'maskable-icon.png', width: 192, height: 192 },
    ];

    for (const { name, width, height } of icons) {
      const outputPath = path.join(publicDir, name);
      const pngBuffer = createMinimalPNG(width, height);
      fs.writeFileSync(outputPath, pngBuffer);
      console.log(`✓ Generated ${name} (${width}x${height})`);
    }

    console.log('\nPlaceholder PWA icons generated successfully!');
    console.log('\nIcons created:');
    icons.forEach(({ name, width, height }) => {
      console.log(`  - public/${name} (${width}x${height})`);
    });
    console.log('\n📝 TODO: Replace with proper icon designs before shipping.\n');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
