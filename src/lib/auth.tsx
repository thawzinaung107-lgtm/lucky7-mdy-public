import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getBotInfo, getMe, logout, telegramLogin } from '@/lib/store.functions';
import { useI18n } from '@/lib/i18n';

export const SESSION_KEY = 'storefront-session-token';
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,128}$/;

export interface BuyerProfile {
  telegramUserId: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  customerGroup: string;
}

interface AuthValue {
  profile: BuyerProfile | null;
  ready: boolean;
  signInFailed: boolean;
  botUsername: string | null;
  signIn: (authData: Record<string, string>) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseProfile(value: unknown): BuyerProfile | null {
  if (!isRecord(value)) return null;
  const { telegramUserId, username, firstName, lastName, customerGroup } = value;
  if (
    typeof telegramUserId !== 'number' ||
    typeof customerGroup !== 'string' ||
    (username !== null && typeof username !== 'string') ||
    (firstName !== null && typeof firstName !== 'string') ||
    (lastName !== null && typeof lastName !== 'string')
  ) {
    return null;
  }
  return { telegramUserId, username, firstName, lastName, customerGroup };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [signInFailed, setSignInFailed] = useState(false);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const callAuth = useCallback(
    async (route: 'login' | 'me' | 'logout', init?: { body?: string }): Promise<unknown> => {
      const token = window.localStorage.getItem(SESSION_KEY) ?? '';
      if (route === 'login') {
        const { authData } = JSON.parse(init?.body ?? '{}') as { authData: unknown };
        return telegramLogin({ data: { authData } });
      }
      if (route === 'me') return getMe({ data: { token } });
      return logout({ data: { token } });
    },
    [],
  );

  useEffect(() => {
    let active = true;
    getBotInfo()
      .then((data) => {
        if (active && isRecord(data) && typeof data.botUsername === 'string') {
          setBotUsername(data.botUsername);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const token = window.localStorage.getItem(SESSION_KEY);
    if (!token || !TOKEN_PATTERN.test(token)) {
      loadedRef.current = true;
      setReady(true);
      return;
    }
    callAuth('me')
      .then((data) => {
        if (!active) return;
        if (isRecord(data) && isRecord(data.profile)) {
          setProfile(parseProfile(data.profile));
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          loadedRef.current = true;
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, [callAuth]);

  const signIn = useCallback(
    async (authData: Record<string, string>): Promise<boolean> => {
      try {
        const data = await callAuth('login', { body: JSON.stringify({ authData }) });
        if (!isRecord(data) || typeof data.token !== 'string' || !isRecord(data.profile)) {
          setSignInFailed(true);
          return false;
        }
        window.localStorage.setItem(SESSION_KEY, data.token);
        setProfile(parseProfile(data.profile));
        setSignInFailed(false);
        return true;
      } catch {
        setSignInFailed(true);
        return false;
      }
    },
    [callAuth],
  );

  const signOut = useCallback(async () => {
    const token = window.localStorage.getItem(SESSION_KEY);
    if (token) {
      await callAuth('logout').catch(() => undefined);
    }
    window.localStorage.removeItem(SESSION_KEY);
    setProfile(null);
  }, [callAuth]);

  const value = useMemo<AuthValue>(
    () => ({ profile, ready, signInFailed, botUsername, signIn, signOut }),
    [profile, ready, signInFailed, botUsername, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export function TelegramLoginButton() {
  const { t } = useI18n();
  const { signIn, botUsername } = useAuth();

  useEffect(() => {
    if (!botUsername) return;
    const widgetName = 'telegramLoginWidget';
    const container = document.getElementById(widgetName);
    if (!container || container.firstChild) return;

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '24');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-onauth', 'telegramLogin(user)');
    script.setAttribute('data-request-access', 'write');
    container.appendChild(script);

    (window as unknown as Record<string, unknown>).telegramLogin = (user: Record<string, unknown>) => {
      const authData: Record<string, string> = {};
      for (const [key, value] of Object.entries(user)) {
        authData[key] = String(value);
      }
      window.dispatchEvent(new CustomEvent('telegram-login-success', { detail: authData }));
    };
    return () => {
      container.replaceChildren();
      delete (window as unknown as Record<string, unknown>).telegramLogin;
    };
  }, [botUsername, signIn]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<Record<string, string>>).detail;
      if (detail) void signIn(detail);
    };
    window.addEventListener('telegram-login-success', handler);
    return () => window.removeEventListener('telegram-login-success', handler);
  }, [signIn]);

  if (!botUsername) {
    return <p className="py-3 text-sm text-neutral-500">{t('loginLoading')}</p>;
  }

  return <div id="telegramLoginWidget" className="flex justify-center" />;
}
