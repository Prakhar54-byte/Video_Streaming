import apiClient from "./api";

const backendOrigin = (() => {
  const base = (apiClient.defaults.baseURL || "").toString();
  if (base) return base.replace(/\/api\/v1\/?$/, "");
  const envBase = (process.env.NEXT_PUBLIC_BACKEND_URL || "").toString();
  if (envBase) return envBase.replace(/\/api\/v1\/?$/, "");
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "").toString();
  if (apiUrl) return apiUrl.replace(/\/api\/v1\/?$/, "");
  return "http://localhost:8000";
})();

const toBackendAssetUrl = (maybePath?: string) => {
  if (!maybePath) return "";
  if (/^https?:\/\//i.test(maybePath)) return maybePath;
  const normalized = maybePath.replace(/\\/g, "/").replace(/^\//, "");
  const withoutPublic = normalized.startsWith("public/")
    ? normalized.slice("public/".length)
    : normalized;
  return `${backendOrigin}/${withoutPublic}`;
};

export { toBackendAssetUrl };
