import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_TOKEN_KEY = "auth.token";

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export async function getAuthTokenFromStorage(): Promise<string | null> {
  if (authToken) return authToken;
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    authToken = token;
  }
  return token;
}
