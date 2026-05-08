const { Jimp } = require('jimp');

async function getBottomColor() {
  const image = await Jimp.read('public/hero-interior.jpg');
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const sampleHeight = Math.min(50, height);

  let r = 0, g = 0, b = 0, count = 0;

  for (let y = height - sampleHeight; y < height; y++) {
    for (let x = 0; x < width; x += 4) {
      const hex = image.getPixelColor(x, y);
      const pr = (hex >> 24) & 0xFF;
      const pg = (hex >> 16) & 0xFF;
      const pb = (hex >> 8) & 0xFF;
      r += pr;
      g += pg;
      b += pb;
      count++;
    }
  }

  const avgR = Math.round(r / count);
  const avgG = Math.round(g / count);
  const avgB = Math.round(b / count);

  const toHex = (n) => n.toString(16).padStart(2, '0');
  const hex = `#${toHex(avgR)}${toHex(avgG)}${toHex(avgB)}`;

  console.log('Image size:', width, 'x', height);
  console.log('Sampled bottom rows:', sampleHeight);
  console.log('Average bottom color:', hex);
  console.log('RGB:', avgR, avgG, avgB);
}

getBottomColor().catch(console.error);
