import { HfInference, FeatureExtractionOutput } from '@huggingface/inference';
import pool from './models/embedding.model';
import config from '../config';

const hf = new HfInference(config.HF_TOKEN);

export const generateEmbeddings = async (): Promise<number[]> => {
  const output: FeatureExtractionOutput = await hf.featureExtraction({
    model: 'ggrn/e5-small-v2',
    inputs: 'You',
  });

  if (Array.isArray(output)) {
    return output as number[];
  } else {
    throw new Error('Invalid output format');
  }
};

export const storeEmbedding = async (embedding: number[]): Promise<void> => {
  const client = await pool.connect();
  console.log('Connected to the database.');

  try {
    const formattedEmbedding = JSON.stringify(embedding);
    const query = 'INSERT INTO items1 (embedding) VALUES ($1)';
    await client.query(query, [formattedEmbedding]);
    console.log('Embedding stored in the database.');
  } catch (error) {
    console.error('Error storing embedding:', error);
  } finally {
    client.release();
  }
};
