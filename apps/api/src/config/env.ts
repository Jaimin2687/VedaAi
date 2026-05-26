import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { z } from "zod";

const envCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "..", "..", ".env")
];

const envPath = envCandidates.find((candidate) => fs.existsSync(candidate));

if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.string().default("4000"),
    MONGODB_URI: z.string().min(1),
    REDIS_URL: z.string().optional(),
    UPSTASH_REDIS_URL: z.string().optional(),
    GROQ_API_KEY: z.string().min(1),
    GROQ_MODEL: z.string().optional(),
    CORS_ORIGIN: z.string().optional(),
    JOB_TTL_SECONDS: z.string().optional(),
    MAX_UPLOAD_MB: z.string().optional(),
    PDF_STORAGE_DIR: z.string().optional()
  })
  .refine((data) => data.REDIS_URL || data.UPSTASH_REDIS_URL, {
    message: "REDIS_URL or UPSTASH_REDIS_URL is required",
    path: ["REDIS_URL"]
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast on missing env variables to avoid running insecure defaults.
  const fieldErrors = parsed.error.flatten().fieldErrors;
  // eslint-disable-next-line no-console
  console.error("Invalid environment configuration", fieldErrors);
  // NOTE: Do NOT use process.exit() in serverless environments — it crashes the
  // entire Vercel function invocation with FUNCTION_INVOCATION_FAILED.
  throw new Error(
    `Missing or invalid environment variables: ${Object.keys(fieldErrors).join(", ")}`
  );
}

const env = parsed.data;

export const config = {
  nodeEnv: env.NODE_ENV,
  port: Number(env.PORT),
  mongoUri: env.MONGODB_URI,
  redisUrl: env.REDIS_URL ?? env.UPSTASH_REDIS_URL ?? "",
  groqApiKey: env.GROQ_API_KEY,
  groqModel: env.GROQ_MODEL ?? "llama3-70b-8192",
  corsOrigin: env.CORS_ORIGIN ?? "http://localhost:3000",
  jobTtlSeconds: env.JOB_TTL_SECONDS ? Number(env.JOB_TTL_SECONDS) : 3600,
  maxUploadMb: env.MAX_UPLOAD_MB ? Number(env.MAX_UPLOAD_MB) : 10,
  pdfStorageDir: env.PDF_STORAGE_DIR ?? "storage/pdfs"
};
