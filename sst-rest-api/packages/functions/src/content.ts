import { firefox, chromium, webkit, Browser, BrowserType } from 'playwright';import puppeteer from 'puppeteer';
import { URL } from 'url';
import { ApiHandler } from 'sst/node/api';

async function extractDomain(url: string): Promise<string> {
  const parsedUrl = new URL(url);
  return parsedUrl.hostname;
}

async function scrapeInternalLinks(pageUrl: string): Promise<string[]> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(pageUrl);

  const domain = await extractDomain(pageUrl);
  const links: string[] = [];

  const pageLinks = await page.$$('a');
  for (const linkElement of pageLinks) {
    const href = await linkElement.evaluate(element => element.getAttribute('href'));
    if (href && !href.startsWith('http') && !href.startsWith('mailto')) {
      const absoluteUrl = new URL(href, pageUrl).href;
      if (await extractDomain(absoluteUrl) === domain) {
        links.push(absoluteUrl);
      }
    }
  }

  await browser.close();
  return links;
}

async function startScraping(sitemapUrl: string | null, homepageUrl: string): Promise<{ links: string[]; content: string }> {
  const scrappedLinks = new Set<string>();
  const toBeScrappedLinks = new Set<string>();
  const scrappedDataMap = new Map<string, string>();
  const thirdPartyLinks: string[] = [];

  if (sitemapUrl) {
    try {
      const sitemapLinks = await scrapeInternalLinks(sitemapUrl);
      sitemapLinks.forEach(link => {
        toBeScrappedLinks.add(link);
      });
    } catch (error) {
      console.error('Failed to scrape sitemap:', error);
      console.log('Scraping homepage instead...');
      toBeScrappedLinks.add(homepageUrl);
    }
  } else {
    toBeScrappedLinks.add(homepageUrl);
  }

  const maxIterations = 4;

  async function scrapeNextBatch() {
    let iterationCount = 0;

    while (toBeScrappedLinks.size > 0 && iterationCount < maxIterations) {
      const linksToScrape = Array.from(toBeScrappedLinks).slice(0, maxIterations - iterationCount);
      iterationCount += linksToScrape.length;

      for (const currentUrl of linksToScrape) {
        if (!scrappedLinks.has(currentUrl)) {
          console.log(`Scraping: ${currentUrl}`);
          try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto(currentUrl);
            const scrappedData = await page.content();

            scrappedLinks.add(currentUrl);
            scrappedDataMap.set(currentUrl, scrappedData);
            console.log(`Page: ${currentUrl}`);
            console.log(scrappedData);

            const newLinks = await scrapeInternalLinks(currentUrl);
            for (const link of newLinks) {
              if (!scrappedLinks.has(link) && !toBeScrappedLinks.has(link)) {
                const linkDomain = await extractDomain(link);
                const homeDomain = await extractDomain(homepageUrl);

                if (linkDomain !== homeDomain && !linkDomain.endsWith(`.${homeDomain}`)) {
                  thirdPartyLinks.push(link);
                }

                toBeScrappedLinks.add(link);
              }
            }

            await browser.close();
          } catch (error) {
            console.error(`Failed to scrape URL: ${currentUrl}`, error);
          }
        }
        toBeScrappedLinks.delete(currentUrl);
      }
    }

    if (toBeScrappedLinks.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 1 * 60 * 1000)); // 1 minute
      await scrapeNextBatch(); // Call the function again after 1 minute
    } else {
      console.log('Scraping complete!');
      console.log('Scrapped Links:\n', Array.from(scrappedLinks).join('\n'));

      // Log third-party links of different domains
      console.log('Third-party links of different domains:');
      console.log(thirdPartyLinks.join('\n'));
    }
  }

  await scrapeNextBatch();

  // Return the scraped links and content
  return {
    links: Array.from(scrappedLinks),
    content: Array.from(scrappedDataMap.values()).join('\n\n'),
  };
}

async function getSitemapUrl(homepageUrl: string): Promise<string | null> {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(homepageUrl);
    const sitemapLinks = await page.$$('link[rel="sitemap"]');

    if (sitemapLinks.length > 0) {
      const sitemapUrl = await sitemapLinks[0].evaluate(linkElement => linkElement.getAttribute('href'));
      await browser.close();
      return sitemapUrl || null;
    } else {
      await browser.close();
      return null;
    }
  } catch (error) {
    console.error('Failed to fetch homepage:', error);
    return null;
  }
}

// Controller functions for different browsers

async function puppeteerController(websiteUrl: string) {
  const browser = await puppeteer.launch();
  return browser;
}

async function playwrightFirefoxController(websiteUrl: string) {
  return firefox;
}

async function playwrightChromeController(websiteUrl: string) {
  return chromium;
}

async function playwrightSafariController(websiteUrl: string) {
  return webkit;
}

// Handler function for AWS Lambda
export const handler = ApiHandler(async event => {
  const homepageUrl = event.queryStringParameters?.url || '';
  const browserType = event.queryStringParameters?.browser || ''; // 'puppeteer', 'firefox', 'chrome', or 'safari'

  if (!homepageUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing homepage URL in query parameters.' }),
    };
  }

  let scraper: (websiteUrl: string) => Promise<Browser | BrowserType<{}>>;
  if (browserType === 'puppeteer') {
    scraper = puppeteerController;
  } else if (browserType === 'firefox') {
    scraper = playwrightFirefoxController;
  } else if (browserType === 'chrome') {
    scraper = playwrightChromeController;
  } else if (browserType === 'safari') {
    scraper = playwrightSafariController;
  } else {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid browser type.' }),
    };
  }

  const { links, content } = await startScraping(scraper, homepageUrl);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Scraping started successfully.', links, content }),
  };
});