const fs = require('fs');
const path = require('path');

const pngPath = path.join(__dirname, 'frontend/public/favicon.png');
const svgPath = path.join(__dirname, 'frontend/public/favicon.svg');

try {
  if (!fs.existsSync(pngPath)) {
    console.error('favicon.png not found at:', pngPath);
    process.exit(1);
  }

  const pngBase64 = fs.readFileSync(pngPath, { encoding: 'base64' });
  const dataUrl = `data:image/png;base64,${pngBase64}`;

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <clipPath id="circle-clip">
      <circle cx="64" cy="64" r="64" />
    </clipPath>
  </defs>
  <image href="${dataUrl}" x="0" y="0" width="128" height="128" clip-path="url(#circle-clip)" />
</svg>`;

  fs.writeFileSync(svgPath, svgContent, 'utf8');
  console.log('Successfully created circular favicon.svg at:', svgPath);
  process.exit(0);
} catch (err) {
  console.error('Failed to create circular SVG:', err);
  process.exit(1);
}
