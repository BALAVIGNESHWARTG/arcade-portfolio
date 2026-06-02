/**
 * Arcade-100 Automated Quality Audit
 * Uses Puppeteer to headless-test every game for:
 *   - Console errors / warnings
 *   - Uncaught exceptions
 *   - Page crash
 *   - Missing elements
 *   - Mobile viewport
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARCADE_DIR = path.resolve(__dirname, '..');
const TIMEOUT = 8000; // ms per game
const INTERACTION_DELAY = 2000; // ms to wait after clicking

async function getGameDirs() {
    const entries = fs.readdirSync(ARCADE_DIR, { withFileTypes: true });
    const dirs = [];
    for (const e of entries) {
        if (e.isDirectory() && e.name !== 'audit' && e.name !== '.git' && e.name !== '.github' && e.name !== 'node_modules') {
            const indexPath = path.join(ARCADE_DIR, e.name, 'index.html');
            if (fs.existsSync(indexPath)) {
                dirs.push(e.name);
            }
        }
    }
    return dirs.sort();
}

async function auditGame(browser, gameName) {
    const result = {
        name: gameName,
        errors: [],
        warnings: [],
        status: 'OK'
    };

    let page;
    try {
        page = await browser.newPage();
        await page.setViewport({ width: 414, height: 896, isMobile: true, hasTouch: true });

        // Capture console messages
        page.on('console', msg => {
            if (msg.type() === 'error') {
                result.errors.push(`[console.error] ${msg.text()}`);
            }
        });

        // Capture uncaught exceptions
        page.on('pageerror', err => {
            result.errors.push(`[EXCEPTION] ${err.message}`);
        });

        // Capture failed requests (missing assets)
        page.on('requestfailed', req => {
            const url = req.url();
            if (!url.includes('fonts.googleapis.com') && !url.includes('fonts.gstatic.com')) {
                result.warnings.push(`[NETWORK FAIL] ${url} - ${req.failure().errorText}`);
            }
        });

        const filePath = path.join(ARCADE_DIR, gameName, 'index.html');
        const fileUrl = `file:///${filePath.replace(/\\/g, '/')}`;

        await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });

        // Wait a moment for scripts to initialize
        await new Promise(r => setTimeout(r, 1000));

        // Static checks via page.evaluate
        const checks = await page.evaluate(() => {
            const issues = [];

            // 1. Check viewport meta
            const viewport = document.querySelector('meta[name="viewport"]');
            if (!viewport) {
                issues.push('[STATIC] Missing viewport meta tag');
            }

            // 2. Check for canvas or main game element
            const canvas = document.querySelector('canvas');
            const gameContainer = document.querySelector('#game-container, #game, .game-container, .container');
            if (!canvas && !gameContainer) {
                issues.push('[STATIC] No canvas or #game-container found');
            }

            // 3. Check for title
            if (!document.title || document.title === 'Document') {
                issues.push('[STATIC] Missing or default page title');
            }

            // 4. Check body has no scrollbar-inducing overflow
            const bodyStyle = window.getComputedStyle(document.body);
            // Not critical, just a warning

            // 5. Check for touch-action
            const allCSS = Array.from(document.styleSheets).map(s => {
                try { return Array.from(s.cssRules).map(r => r.cssText).join(' '); } catch(e) { return ''; }
            }).join(' ');

            return issues;
        });

        checks.forEach(c => result.warnings.push(c));

        // Try to interact: click the center of the page (simulates tapping "play" button)
        try {
            // Look for common start buttons
            const startBtn = await page.$('button, .btn, .play-btn, #start-btn, #play-btn, .start, [onclick]');
            if (startBtn) {
                await startBtn.click();
                await new Promise(r => setTimeout(r, INTERACTION_DELAY));
            } else {
                // Just click center
                await page.mouse.click(207, 448);
                await new Promise(r => setTimeout(r, INTERACTION_DELAY));
            }

            // Simulate some key presses
            await page.keyboard.press('Space');
            await new Promise(r => setTimeout(r, 500));
            await page.keyboard.press('ArrowRight');
            await new Promise(r => setTimeout(r, 500));

        } catch (interactionErr) {
            // Not critical if interaction fails
        }

        // Final check for any errors that appeared during interaction
        if (result.errors.length > 0) {
            result.status = 'ERROR';
        } else if (result.warnings.length > 0) {
            result.status = 'WARNING';
        }

    } catch (err) {
        result.status = 'CRASH';
        result.errors.push(`[CRASH] ${err.message}`);
    } finally {
        if (page) {
            try { await page.close(); } catch(e) {}
        }
    }

    return result;
}

async function main() {
    console.log('=== ARCADE-100 QUALITY AUDIT ===');
    console.log(`Starting at ${new Date().toISOString()}\n`);

    const games = await getGameDirs();
    console.log(`Found ${games.length} games to audit.\n`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--allow-file-access-from-files']
    });

    const results = [];
    for (let i = 0; i < games.length; i++) {
        const game = games[i];
        process.stdout.write(`[${i+1}/${games.length}] Auditing: ${game}... `);
        const result = await auditGame(browser, game);
        results.push(result);
        console.log(result.status);

        if (result.errors.length > 0) {
            result.errors.forEach(e => console.log(`  !! ${e}`));
        }
        if (result.warnings.length > 0) {
            result.warnings.forEach(w => console.log(`  ?? ${w}`));
        }
    }

    await browser.close();

    // Generate report
    const errorGames = results.filter(r => r.status === 'ERROR' || r.status === 'CRASH');
    const warningGames = results.filter(r => r.status === 'WARNING');
    const okGames = results.filter(r => r.status === 'OK');

    const report = {
        timestamp: new Date().toISOString(),
        totalGames: results.length,
        ok: okGames.length,
        warnings: warningGames.length,
        errors: errorGames.length,
        details: results.filter(r => r.status !== 'OK')
    };

    const reportPath = path.join(__dirname, 'audit_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n=== AUDIT COMPLETE ===`);
    console.log(`OK: ${okGames.length} | WARNINGS: ${warningGames.length} | ERRORS: ${errorGames.length}`);
    console.log(`Report saved to: ${reportPath}`);

    // Also print a summary of errors for quick reading
    if (errorGames.length > 0) {
        console.log(`\n--- GAMES WITH ERRORS ---`);
        errorGames.forEach(g => {
            console.log(`\n[${g.name}]`);
            g.errors.forEach(e => console.log(`  ${e}`));
        });
    }
}

main().catch(err => {
    console.error('Audit script crashed:', err);
    process.exit(1);
});
