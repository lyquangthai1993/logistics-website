const { chromium } = require('../frontend/node_modules/@playwright/test');
const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, '..', 'docs', 'railway_guide', 'images');
fs.mkdirSync(imgDir, { recursive: true });

async function main() {
    console.log('Starting Railway Screenshot Capture...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 2
    });
    const page = await context.newPage();

    console.log('1. Navigating to https://railway.com/login...');
    await page.goto('https://railway.com/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const step1Path = path.join(imgDir, 'step1_login_home.png');
    await page.screenshot({ path: step1Path });
    console.log('✅ Step 1 captured:', step1Path);

    // Look for 'Log in using email' button
    const emailLoginBtn = page.getByRole('button', { name: /Log in using email/i });
    if (await emailLoginBtn.isVisible()) {
        console.log('2. Clicking "Log in using email"...');
        await emailLoginBtn.click();
        await page.waitForTimeout(1500);

        const step2Path = path.join(imgDir, 'step2_email_form.png');
        await page.screenshot({ path: step2Path });
        console.log('✅ Step 2 captured:', step2Path);

        const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
        if (await emailInput.isVisible()) {
            console.log('3. Typing Gmail address...');
            await emailInput.fill('doanhnghiep.tms@gmail.com');
            await page.waitForTimeout(1000);

            const step3Path = path.join(imgDir, 'step3_email_entered.png');
            await page.screenshot({ path: step3Path });
            console.log('✅ Step 3 captured:', step3Path);

            // Check both Google and Email options
            const continueWithEmailBtn = page.getByRole('button', { name: 'Continue with Email' });
            const continueWithGoogleBtn = page.getByRole('button', { name: 'Continue with Google' });

            console.log('Continue with Google visible:', await continueWithGoogleBtn.isVisible());
            console.log('Continue with Email visible:', await continueWithEmailBtn.isVisible());

            if (await continueWithEmailBtn.isVisible()) {
                console.log('4. Clicking "Continue with Email"...');
                await continueWithEmailBtn.click();
                await page.waitForTimeout(3000);

                const step4Path = path.join(imgDir, 'step4_check_email.png');
                await page.screenshot({ path: step4Path });
                console.log('✅ Step 4 captured:', step4Path);
            }
        } else {
            console.log('Email input not found');
        }
    } else {
        console.log('Email login button not found');
    }

    await browser.close();
    console.log('Capture completed successfully!');
}

main().catch(err => {
    console.error('Error during capture:', err);
    process.exit(1);
});
