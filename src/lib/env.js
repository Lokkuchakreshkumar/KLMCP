const readEnv = (name) => {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
};

export const getTokenSecret = () => readEnv("KLMCP_TOKEN_SECRET");

export const getAppUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://klmcp.vercel.app";

export const getGosynkApiBaseUrl = () => readEnv("GOSYNK_API_BASE_URL");

// GoSynk owns the ERP scraping implementation. Keep this configurable so an
// upstream route rename does not require a KLMCP code deployment.
export const getGosynkAcademicSummaryPath = () =>
  process.env.GOSYNK_ACADEMIC_SUMMARY_PATH?.trim() || "/erp/academic-summary";

export const getErpBaseUrl = () =>
  process.env.ERP_BASE_URL?.trim() || "https://newerp.kluniversity.in";

export const getLmsBaseUrl = () =>
  process.env.LMS_BASE_URL?.trim() || "https://lms.kluniversity.in";

export const getMongodbUri = () => readEnv("MONGODB_URI");
