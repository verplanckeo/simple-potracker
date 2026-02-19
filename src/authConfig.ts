import type { Configuration, RedirectRequest } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env["VITE_AZURE_CLIENT_ID"] ?? "",
    authority: `https://login.microsoftonline.com/${import.meta.env["VITE_AZURE_TENANT_ID"] ?? "common"}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
  },
};

export const loginRequest: RedirectRequest = {
  scopes: ["User.Read", "https://storage.azure.com/user_impersonation"],
  prompt: "select_account",
};

export const apiTokenRequest: RedirectRequest = {
  scopes: [import.meta.env["VITE_API_SCOPE"] ?? "User.Read"],
};
