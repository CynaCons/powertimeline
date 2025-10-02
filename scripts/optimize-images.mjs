#!/usr/bin/env node
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { statSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

const images = [
  {
    input: join(publicDir, 'assets', 'images', 'logo.png'),
    output: join(publicDir, 'assets', 'images', 'logo.png'),
  },
  {
    input: join(publicDir, 'favicon.png'),
    output: join(publicDir, 'favicon.png'),
  },
];

async function optimizeImage(input, output) {
  const originalSize = statSync(input).size;

  await sharp(input)
    .png({
      quality: 90,
      compressionLevel: 9,
      effort: 10,
    })
    .toFile(output + '.tmp');

  const optimizedSize = statSync(output + '.tmp').size;

  // Only replace if the optimized version is smaller
  if (optimizedSize < originalSize) {
    await sharp(output + '.tmp').toFile(output);
    const savedKB = ((originalSize - optimizedSize) / 1024).toFixed(2);
    const savedPercent = (((originalSize - optimizedSize) / originalSize) * 100).toFixed(1);
    console.log(`✅ ${input}`);
    console.log(`   ${(originalSize / 1024).toFixed(2)} KB → ${(optimizedSize / 1024).toFixed(2)} KB (saved ${savedKB} KB, ${savedPercent}%)`);
  } else {
    console.log(`ℹ️  ${input} - already optimized`);
  }

  // Clean up temp file
  const fs = await import('fs');
  fs.unlinkSync(output + '.tmp');
}

console.log('🖼️  Optimizing images...\n');

for (const { input, output } of images) {
  try {
    await optimizeImage(input, output);
  } catch (error) {
    console.error(`❌ Error optimizing ${input}:`, error.message);
  }
}

console.log('\n✨ Image optimization complete!');
