import { Pool } from 'pg';
import dotenv from 'dotenv';
 import config from '../../config';
dotenv.config();

dotenv.config();

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;
