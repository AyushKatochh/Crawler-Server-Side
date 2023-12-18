import dotenv from "dotenv";
dotenv.config()
const config = {
    DATABASE_URL: process.env.DATABASE_URL,
    PORT: process.env.PORT || 5000,
    HF_TOKEN: process.env.HF_TOKEN
  };
  
  export default config;
  