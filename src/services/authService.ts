import type { IPublicClientApplication, AuthenticationResult } from "@azure/msal-browser";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { apiTokenRequest } from "../authConfig";

export async function getAccessToken(
  instance: IPublicClientApplication
): Promise<string> {
  const account = instance.getAllAccounts()[0];
  if (!account) {
    throw new Error("No authenticated account found");
  }

  try {
    const response: AuthenticationResult = await instance.acquireTokenSilent({
      ...apiTokenRequest,
      account,
    });
    return response.accessToken;
  } catch (error: unknown) {
    if (error instanceof InteractionRequiredAuthError) {
      await instance.acquireTokenRedirect(apiTokenRequest);
      return "";
    }
    throw error;
  }
}

export function getAuthHeader(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  };
}
