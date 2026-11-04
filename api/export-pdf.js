import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

const MAX_BODY_BYTES = 3_500_000;

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;

  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > MAX_BODY_BYTES) throw Object.assign(new Error('The wiki is too large to export.'), { statusCode: 413 });
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function createShareToken(data) {
  const escaped = encodeURIComponent(JSON.stringify(data)).replace(/%([0-9A-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  return Buffer.from(escaped, 'binary').toString('base64');
}

function getAppOrigin(req) {
  const requestOrigin = req.headers.origin;
  if (!requestOrigin || new URL(requestOrigin).host.toLowerCase() !== String(req.headers.host || '').toLowerCase()) {
    throw Object.assign(new Error('PDF export requests must come from TinyWiki.'), { statusCode: 403 });
  }

  // Vercel supplies its deployment hostname. Locally, use the same-origin Host
  // received by the Vite middleware so the renderer cannot be pointed at an
  // arbitrary URL supplied in the request body.
  const host = process.env.VERCEL_URL || req.headers.host;
  if (!host || !/^[a-z0-9.-]+(?::\d+)?$/i.test(host)) throw new Error('Could not determine the application host.');
  const protocol = process.env.VERCEL_URL ? 'https' : (req.headers.origin?.startsWith('https://') ? 'https' : 'http');
  return `${protocol}://${host}`;
}

export const config = {
  api: { bodyParser: { sizeLimit: '4mb' } },
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.statusCode = 405;
    return res.end('Method not allowed');
  }

  let browser;
  let stage = 'read-request';
  try {
    const { wikiData, viewportWidth } = await readBody(req);
    if (!wikiData || typeof wikiData.title !== 'string' || !Array.isArray(wikiData.sections)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'A valid wiki is required.' }));
    }

    const width = Math.max(360, Math.min(1920, Number(viewportWidth) || 1280));
    stage = 'prepare-page-url';
    const origin = getAppOrigin(req);
    const shareToken = createShareToken(wikiData);
    const pageUrl = `${origin}/?share=${encodeURIComponent(shareToken)}`;

    stage = 'launch-chromium';
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width, height: 1000, deviceScaleFactor: 1 },
      executablePath: await chromium.executablePath(),
      headless: 'shell',
    });

    stage = 'load-wiki-page';
    const page = await browser.newPage();
    await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 45_000 });
    stage = 'wait-for-wiki-content';
    await page.waitForSelector('#section-0', { timeout: 20_000 });
    stage = 'prepare-print';
    await page.emulateMediaType('print');
    await page.evaluate(() => Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]));

    stage = 'generate-pdf';
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
    });

    const filename = `${wikiData.title.replace(/[^\p{L}\p{N}._ -]/gu, '').trim().replace(/\s+/g, '_').slice(0, 100) || 'tinywiki'}.pdf`;
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Length', pdf.length);
    return res.end(pdf);
  } catch (error) {
    console.error('PDF export failed:', error);
    const status = error.statusCode || 500;
    res.statusCode = status;
    res.setHeader('X-TinyWiki-PDF-Stage', stage);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ error: status === 413 ? error.message : 'Could not create the PDF. Please try again.' }));
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
