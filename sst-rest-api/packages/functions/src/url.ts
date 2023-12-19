import { ApiHandler } from 'sst/node/api';

export const handler = ApiHandler(async (event) => {
  const { url } = event.queryStringParameters || {};
  if (!url) {
    return {
      statusCode: 400,
      body: 'Missing URL parameter.',
    };
  }

  // Save the URL in the database or perform any other required operations

  return {
    statusCode: 200,
    body: url,
  };
});
