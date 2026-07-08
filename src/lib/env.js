const readEnv = (name) => {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
};

export const getTokenSecret = () => readEnv("KLMCP_TOKEN_SECRET");

export const getAppUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

export const getGosynkApiBaseUrl = () => readEnv("GOSYNK_API_BASE_URL");

export const getErpBaseUrl = () =>
  process.env.ERP_BASE_URL?.trim() || "https://newerp.kluniversity.in";

export const getLmsBaseUrl = () =>
  process.env.LMS_BASE_URL?.trim() || "https://lms.kluniversity.in";

export const getMongodbUri = () => readEnv("MONGODB_URI");
