const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  console.log('Navigating to https://porikkhaloy.com/questions...');

  // Intercept network responses
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api/v1') && (url.includes('questions') || url.includes('search') || url.includes('que'))) {
      console.log(`\n[API Found] URL: ${url}`);
      console.log(`Status: ${response.status()}`);
      try {
        const data = await response.json();
        console.log('Data structure preview:', JSON.stringify(data).substring(0, 500) + '...');
      } catch (e) {
        console.log('Response is not JSON or could not be parsed.');
      }
    }
  });

  await page.goto('https://porikkhaloy.com/questions', {
    waitUntil: 'networkidle2',
  });

  console.log('\nPage Loaded. Looking for questions in DOM...');

  // Check for common question containers or text
  const questionsCount = await page.evaluate(() => {
    // This is a guess based on the previous curl
    return document.querySelectorAll('div').length; 
  });
  console.log(`Total divs on page: ${questionsCount}`);

  // Look for "Load More" button
  const loadMoreText = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const loadMore = buttons.find(b => b.innerText.includes('আরও') || b.innerText.toLowerCase().includes('load') || b.innerText.toLowerCase().includes('more'));
    return loadMore ? loadMore.innerText : 'Not found';
  });
  console.log(`Load More button text: ${loadMoreText}`);

  // Take a screenshot to see what it looks like (useful for debugging)
  await page.screenshot({ path: 'screenshot.png' });
  console.log('Screenshot saved as screenshot.png');

  await browser.close();
})();
