const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));

// Serve your Certificate Generator web app files
app.use(express.static(__dirname));

// ============================================================
// GET /api/health — Health check
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MCCIA Certificate Generator API',
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// POST /api/generate — Generate certificates
// Body: { recipients: [{Name, Course, Date, CredentialID}], format: "png" }
// Returns: { success: true, files: [{name, base64, recipient}] }
// ============================================================
app.post('/api/generate', async (req, res) => {
  const startTime = Date.now();
  console.log(`[API] Request: ${req.body.recipients?.length} recipients, format: ${req.body.format}`);

  try {
    const { recipients, format = 'png' } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'recipients array is required' });
    }

    // Launch headless browser
    const browser = await puppeteer.launch({
      headless: 'new',
      channel: 'chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Load your Certificate Generator app
    await page.goto('http://localhost:3000/index.html', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for app to be ready
    await page.waitForFunction(() => window.appReady === true, { timeout: 15000 });
    console.log('[API] App loaded and ready');

    // Load the built-in sample template
    await page.evaluate(() => {
      if (typeof loadSampleTemplate === 'function') {
        loadSampleTemplate();
      } else if (typeof window.loadTemplate === 'function') {
        window.loadTemplate();
      }
    });
    await new Promise(r => setTimeout(r, 1500));
    console.log('[API] Template loaded');

    // Load recipient data into the app
    await page.evaluate((recips) => {
      // Try different methods to load data
      if (typeof window.importRecipients === 'function') {
        window.importRecipients(recips);
        return;
      }
      if (typeof window.parseCSVData === 'function') {
        const csv = recips.map((r, i) => {
          if (i === 0) return Object.keys(r).join(',');
          return Object.values(r).join(',');
        }).join('\n');
        window.parseCSVData(csv);
        return;
      }
      // Fallback: set data via textarea
      const textarea = document.querySelector('#data-input, #csv-input, textarea');
      if (textarea) {
        const csv = recips.map((r, i) => {
          if (i === 0) return Object.keys(r).join(',');
          return Object.values(r).join(',');
        }).join('\n');
        textarea.value = csv;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, recipients);
    await new Promise(r => setTimeout(r, 2000));
    console.log('[API] Recipient data loaded');

    // Generate certificates one by one
    const files = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const safeName = (recipient.Name || `Certificate_${i + 1}`)
        .replace(/[^a-zA-Z0-9]/g, '_');

      console.log(`[API] Generating ${i + 1}/${recipients.length}: ${recipient.Name}`);

      // Switch to this recipient
      await page.evaluate((index) => {
        // Try different methods to select recipient
        if (typeof window.setCurrentRecipient === 'function') {
          window.setCurrentRecipient(index);
        }
        if (typeof window.selectRecipient === 'function') {
          window.selectRecipient(index);
        }
        // Fallback: click recipient in list
        const items = document.querySelectorAll(
          '.recipient-item, .preview-item, [data-recipient], .page-item'
        );
        if (items[index]) items[index].click();

        // Render
        if (typeof window.renderCertificate === 'function') window.renderCertificate();
        if (typeof window.updateCanvas === 'function') window.updateCanvas();
        if (typeof window.drawCertificate === 'function') window.drawCertificate();
        if (typeof window.render === 'function') window.render();
      }, i);

      await new Promise(r => setTimeout(r, 800));

      // Capture certificate as image
      let base64 = null;

      if (format === 'pdf') {
        // Export as PDF
        const pdfBuffer = await page.pdf({
          format: 'A4',
          landscape: true,
          printBackground: true,
          margin: { top: '0', bottom: '0', left: '0', right: '0' }
        });
        base64 = pdfBuffer.toString('base64');
      } else {
        // Export as PNG — try canvas first, then screenshot
        base64 = await page.evaluate(() => {
          // Try canvas element
          const canvas = document.querySelector(
            '#certificate-canvas, .certificate-stage canvas, canvas'
          );
          if (canvas && canvas.toDataURL) {
            return canvas.toDataURL('image/png').split(',')[1];
          }
          return null;
        });

        // Fallback: screenshot of the certificate area
        if (!base64) {
          const certElement = await page.$(
            '#canvas-workspace, #certificate-canvas, .certificate-stage, .canvas-board, .certificate-container'
          );
          if (certElement) {
            const screenshot = await certElement.screenshot({ type: 'png' });
            base64 = screenshot.toString('base64');
          } else {
            // Last resort: full page screenshot
            const screenshot = await page.screenshot({ type: 'png' });
            base64 = screenshot.toString('base64');
          }
        }
      }

      if (base64) {
        files.push({
          name: `${safeName}_Certificate.${format}`,
          base64: base64,
          recipient: recipient,
          mimeType: format === 'pdf' ? 'application/pdf' : 'image/png'
        });
      }
    }

    await browser.close();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[API] Done: ${files.length} certificates in ${elapsed}s`);

    res.json({
      success: true,
      count: files.length,
      elapsed: elapsed + 's',
      files: files
    });

  } catch (error) {
    console.error('[API] Error:', error.message);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// ============================================================
// Start server
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  MCCIA Certificate Generator API                 ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Web App:  http://localhost:${PORT}                  ║`);
  console.log(`║  API:      http://localhost:${PORT}/api/generate     ║`);
  console.log(`║  Health:   http://localhost:${PORT}/api/health        ║`);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
});
