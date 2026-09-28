const fs = require('fs');
const path = require('path');

async function main() {
  const puppeteer = require('puppeteer');
  const { marked } = require('marked');

  const mdPath = path.join(__dirname, '..', 'RESEARCH_NOTE.md');
  const md = fs.readFileSync(mdPath, 'utf8');
  const htmlContent = marked(md);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', 'Arial', sans-serif; margin: 0; padding: 40px; color: #1a1a2e; line-height: 1.6; max-width: 800px; }
    h1 { font-size: 26px; color: #1a365d; border-bottom: 3px solid #2563eb; padding-bottom: 12px; margin-top: 0; }
    h2 { font-size: 20px; color: #2563eb; margin-top: 28px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
    h3 { font-size: 16px; color: #475569; margin-top: 20px; }
    p { margin: 0 0 12px 0; }
    ul { margin: 0 0 12px 0; padding-left: 20px; }
    li { margin-bottom: 4px; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; font-size: 13px; }
    th { background-color: #e2e8f0; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-family: 'Consolas', monospace; font-size: 12px; }
    pre { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px; overflow-x: auto; font-family: 'Consolas', monospace; font-size: 12px; }
    pre code { background: none; padding: 0; }
    strong { color: #0f172a; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>
  `;

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: path.join(__dirname, '..', 'RESEARCH_NOTE.pdf'),
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
  });

  await browser.close();
  console.log('PDF created: RESEARCH_NOTE.pdf');
}

main().catch(console.error);
