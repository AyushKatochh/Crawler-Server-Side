import express, { Request, Response } from 'express';
import pool from './models/embedding.model';
import axios from 'axios';
import catchAsync from './utils/response.util';
import config from '../config';
import { generateEmbeddings, storeEmbedding } from './embeddings';

const app = express();
const port = config.PORT;
const urlParam = 'https://www.netflix.com/in';


app.get('/', catchAsync(async (_req: Request, res: Response) => {
  const client = await pool.connect();
  console.log('Connected to the database.');

  const result = await client.query('SELECT * FROM website_url');
  const data = result.rows;

  res.json({ data });
}));

app.get('/route', catchAsync(async (_req: Request, res: Response) => {
  const embedding = await generateEmbeddings();
  await storeEmbedding(embedding);

  res.json({ embedding });
}));

app.get('/url', catchAsync(async (_req: Request, res: Response) => {
  const url = 'https://zitvdndgyk.execute-api.us-east-1.amazonaws.com/getUrl'; 

  try {
    const response = await axios.get(url, {
      params: {
        url: urlParam, // Replace with your desired query parameter value
      },
    });

    const dataToInsert = response.data; 

    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to the database.');

    // Insert data into the table
    const query = 'INSERT INTO website_url (url) VALUES ($1)';
    const values = [dataToInsert.url]; 
    await client.query(query, values);

    console.log('URL added  into website_url table.');

    res.json({ response: response.data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
}));

app.get('/content', catchAsync(async (_req: Request, res: Response) => {
  const url = 'https://zitvdndgyk.execute-api.us-east-1.amazonaws.com/getContent'; 
  const timeoutInMilliseconds = 8 * 60 * 1000; // 8 minutes in milliseconds

  try {
    const response = await axios.get(url, {
      params: {
        url: urlParam, 
      },
      timeout: timeoutInMilliseconds, // Set the custom timeout
    });

    const { links, content } = response.data;

    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to the database.');

    // Insert the scraped content into the website_content table
    const contentQuery = 'INSERT INTO website_content (content) VALUES ($1)';
    const contentValues = [content];
    await client.query(contentQuery, contentValues);

    console.log('Scraped content added to website_content table.');

    // Insert the scraped links into the website_links table
    const linksQuery = 'INSERT INTO website_links (webpages) VALUES ($1)';
    const linksValues: Array<[string]> = links.map((link: string) => [link]);
    await Promise.all(linksValues.map((value: [string]) => client.query(linksQuery, value)));

    console.log('Scraped links added to website_links table.');

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
}));


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
