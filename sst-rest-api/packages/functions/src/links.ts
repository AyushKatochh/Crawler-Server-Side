import axios, { AxiosResponse } from 'axios';
import cheerio from 'cheerio';
import { URL } from 'url';
import { ApiHandler } from 'sst/node/api';

// Function to extract domain from URL
function extractDomain(url: string): string {
  const parsedUrl = new URL(url);
  return parsedUrl.hostname;
}

// Function to scrape internal links from a webpage
async function scrapeInternalLinks(pageUrl: string): Promise<Set<string>> {
  const response: AxiosResponse<string> = await axios.get(pageUrl);
  const $ = cheerio.load(response.data);
  const domain = extractDomain(pageUrl);
  const internalLinks = new Set<string>();
  const thirdPartyLinks = new Set<string>();

  // Extract all anchor tags
  $('a').each((_idx, element) => {
    const href = $(element).attr('href');
    if (href && !href.startsWith('http') && !href.startsWith('mailto')) {
      // Convert relative URLs to absolute URLs
      const absoluteUrl = new URL(href, pageUrl).href;
      if (extractDomain(absoluteUrl) === domain) {
        internalLinks.add(absoluteUrl);
      } else {
        thirdPartyLinks.add(absoluteUrl);
      }
    }
  });

  console.log(`Internal Links (${internalLinks.size}):`);
  internalLinks.forEach((link) => {
    console.log(link);
  });

  console.log(`Third-Party Links (${thirdPartyLinks.size}):`);
  thirdPartyLinks.forEach((link) => {
    console.log(link);
  });

  return internalLinks;
}

// Function to start scraping from the sitemap or homepage
async function startScraping(sitemapUrl: string | null, homepageUrl: string): Promise<void> {
  const scrappedLinks = new Set<string>();
  const toBeScrappedLinks = new Set<string>();

  if (sitemapUrl) {
    try {
      const sitemapLinks = await scrapeInternalLinks(sitemapUrl);
      sitemapLinks.forEach((link) => {
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

  while (toBeScrappedLinks.size > 0) {
    const currentUrl = toBeScrappedLinks.values().next().value;
    toBeScrappedLinks.delete(currentUrl);

    console.log(`Scraping: ${currentUrl}`);
    try {
      const response: AxiosResponse<string> = await axios.get(currentUrl);
      const scrappedData = response.data;

      scrappedLinks.add(currentUrl);

      // Log scrapped data for the current page
      console.log(`Page: ${currentUrl}`);
      console.log(scrappedData);

      const internalLinks = await scrapeInternalLinks(currentUrl);
      internalLinks.forEach((link) => {
        if (!scrappedLinks.has(link) && !toBeScrappedLinks.has(link)) {
          toBeScrappedLinks.add(link);
        }
      });
    } catch (error) {
      console.error(`Failed to scrape URL: ${currentUrl}`, error);
    }
  }
}

export const handler = ApiHandler(async (event) => {
  const { url } = event.queryStringParameters || {};
  if (!url) {
    return {
      statusCode: 400,
      body: 'Missing URL parameter.',
    };
  }

  const homepageUrl: string = url;
  const sitemapUrl: string | null = await getSitemapUrl(homepageUrl);

  await startScraping(sitemapUrl, homepageUrl);

  return {
    statusCode: 200,
    body: 'Scraping completed.',
  };
});

// Function to fetch the sitemap URL dynamically
async function getSitemapUrl(homepageUrl: string): Promise<string | null> {
  try {
    const response: AxiosResponse<string> = await axios.get(homepageUrl);
    const $ = cheerio.load(response.data);

    // Find the sitemap URL from the homepage
    const sitemapLink = $('a[href*="sitemap.xml"]').attr('href');

    if (sitemapLink) {
      // Append the sitemap URL to the homepage URL
      const sitemapUrl = new URL(sitemapLink, homepageUrl).href;
      return sitemapUrl;
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
}
