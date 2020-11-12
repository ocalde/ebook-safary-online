require('dotenv').config();

const puppeteer = require('puppeteer');

const { OREILLY_LOGIN_URL, SSO_BUTTON_TEXT, BOOK_TO_DOWNLOAD, BROWSER_LAUNCH_HEADLESS } = process.env;

const prepareBrowser = async () => {
    const browser = await puppeteer.launch({ headless: BROWSER_LAUNCH_HEADLESS === 'true' });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1200,
        height: 600,
        deviceScaleFactor: 1,
    });

    page.on('pageerror', (err) => {
        console.error(err);
    });

    return page;
};

const loginIntoPlatform = async (page) => {
    await page.goto(OREILLY_LOGIN_URL);

    await page.waitForSelector("[name='email']");
    await page.type("[name='email']", `${process.argv[2]}@acm.org`);
    await page.waitForSelector("[name='password']");
    await page.type("[name='password']", 'dummy');

    await page.waitForTimeout(2000);

    const [button] = await page.$x(`//button[contains(., '${SSO_BUTTON_TEXT}')]`);
    if (button) {
        await button.click();
    }

    await page.waitForSelector("[name='j_username']");
    await page.type("[name='j_username']", process.argv[2]);
    await page.keyboard.down('Tab');
    await page.keyboard.type(process.argv[3]);

    await page.waitForSelector("[name='_eventId_proceed']");
    await page.click("[name='_eventId_proceed']");
    await page.waitForSelector(".orm-Logo-root");
};

const copyPageContent = async (page) => {
    const inner_html = await page.$eval('#sbo-rt-content div.annotator-wrapper', element => element.innerHTML);
    console.log(inner_html);
};

const loadBook = async (page, bookURL) => {
    await page.goto(bookURL);

    await page.waitForSelector(".t-isbn");
    await page.click(".js-position-book");

    await page.waitForTimeout(4000);

    await page.waitForSelector(".sbo-toc-thumb");
    await page.click(".sbo-toc-thumb");

    await page.waitForTimeout(2000);

    await page.waitForSelector("li.toc-level1 a.js-toc-link.toc-link");
    await page.click("li.toc-level1 a.js-toc-link.toc-link");

    await copyPageContent(page);
};

(async () => {
    const page = await prepareBrowser();

    await loginIntoPlatform(page);
    await loadBook(page, BOOK_TO_DOWNLOAD);
    
    //setTimeout(async () => { await browser.close(); }, 2000);
})();