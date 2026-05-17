import { setAuthToken } from "@/lib/api/authToken";
import { ApiError } from "@/lib/api/client";
import { getProviderApprovalStatusByEmail } from "@/data/healthcare/providerOnboardingStore";
import { authApi, loginUser, registerUser, type BackendUser } from "@/services/api/authApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthUser, UserRole } from "@/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const AUTH_TOKEN_KEY = "auth.token";
const AUTH_USER_KEY = "auth.user";

type AuthState = {
  user: AuthUser | null;
  authLoading: boolean;
  signIn: (params: { email: string; password: string }) => Promise<AuthUser>;
  signUp: (params: { name: string; email: string; password: string; role: UserRole; phone?: string }) => Promise<AuthUser>;
  updateUserName: (name: string) => void;
  signOut: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthState | null>(null);

function mapBackendUser(u: BackendUser): AuthUser {
  // Backend treats non-approved providers as blocked; never default to "approved" when the API omits the field.
  const providerApproval =
    u.role === "provider"
      ? (u.onboarding_status ?? getProviderApprovalStatusByEmail(u.email) ?? "pending")
      : undefined;
  return {
    id: String(u.id),
    name: u.full_name,
    email: u.email,
    role: u.role,
    phone: u.phone ?? undefined,
    approvalStatus: u.role === "provider" ? providerApproval : undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const persistSession = useCallback(async (token: string, nextUser: AuthUser) => {
    await AsyncStorage.multiSet([
      [AUTH_TOKEN_KEY, token],
      [AUTH_USER_KEY, JSON.stringify(nextUser)],
    ]);
  }, []);

  const signIn = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      const res = await loginUser({ identifier: email.trim().toLowerCase(), password });
      setAuthToken(res.token);
      const nextUser = mapBackendUser(res.user);
      setUser(nextUser);
      await persistSession(res.token, nextUser);
      return nextUser;
    },
    [persistSession],
  );

  const signUp = useCallback(
    async ({ name, email, password, role, phone }: { name: string; email: string; password: string; role: UserRole; phone?: string }) => {
      const res = await registerUser({
        full_name: name.trim(),
        email: email.trim(),
        password,
        role,
        phone: phone?.trim() || null,
      });
      setAuthToken(res.token);
      const nextUser = mapBackendUser(res.user);
      setUser(nextUser);
      await persistSession(res.token, nextUser);
      return nextUser;
    },
    [persistSession],
  );

  const updateUserName = useCallback((name: string) => {
    setUser((prev) => (prev ? { ...prev, name: name.trim() || prev.name } : prev));
  }, []);

  const signOut = useCallback(() => {
    void AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
    setAuthToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [[, savedToken], [, savedUserJson]] = await AsyncStorage.multiGet([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
        if (!savedToken) {
          if (alive) setUser(null);
          return;
        }
        setAuthToken(savedToken);
        if (savedUserJson) {
          try {
            const parsed = JSON.parse(savedUserJson) as AuthUser;
            if (alive) setUser(parsed);
          } catch {
            // ignore damaged cache and continue with /auth/me
          }
        }
        // Backend-т токен хүчинтэй эсэхийг баталгаажуулна.
        const me = await authApi.me();
        if (!alive) return;
        const nextUser = mapBackendUser(me);
        setUser(nextUser);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
      } catch (error) {
        if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
          // /auth/me endpoint байхгүй орчинд cache-тай сессийг түр хадгалж нэвтрэлтийг үргэлжлүүлнэ.
          return;
        }
        if (!alive) return;
        setAuthToken(null);
        setUser(null);
        await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
      } finally {
        if (alive) setAuthLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      authLoading,
      signIn,
      signUp,
      updateUserName,
      signOut,
      isAuthenticated: Boolean(user),
    }),
    [user, authLoading, signIn, signUp, updateUserName, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return ctx;
}
