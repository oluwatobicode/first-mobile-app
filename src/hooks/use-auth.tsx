import { router } from 'expo-router';
import { createContext, useContext, useState, type ReactNode } from 'react';

import { NIGERIA, type Country } from '@/data/countries';

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  birthday: string;
  phone?: { country: Country; number: string };
  password?: string;
};

/** How the person started logging in, carried between the auth screens. */
export type PendingLogin = { method: 'phone'; country: Country; number: string } | { method: 'email'; email: string };

const digits = (value: string) => value.replace(/\D/g, '');

// Frontend-only: accounts live in memory. This one exists so "log in" (not just "sign up") can be tried.
const DEMO_ACCOUNT: User = {
  id: 'demo',
  firstName: 'Ada',
  lastName: 'Obi',
  email: 'ada@example.com',
  birthday: '14/02/1995',
  phone: { country: NIGERIA, number: '0801 234 5678' },
  password: 'password1',
};

type AuthContextValue = {
  user: User | null;
  pending: PendingLogin | null;
  setPending: (pending: PendingLogin) => void;
  findByEmail: (email: string) => User | undefined;
  findByPhone: (country: Country, number: string) => User | undefined;
  signIn: (user: User) => void;
  register: (user: Omit<User, 'id'>) => User;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<User[]>([DEMO_ACCOUNT]);
  const [user, setUser] = useState<User | null>(null);
  const [pending, setPending] = useState<PendingLogin | null>(null);

  const value: AuthContextValue = {
    user,
    pending,
    setPending,
    findByEmail: (email) => accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase()),
    findByPhone: (country, number) =>
      accounts.find((a) => a.phone?.country.dial === country.dial && digits(a.phone.number) === digits(number)),
    signIn: (account) => {
      setUser(account);
      setPending(null);
    },
    register: (data) => {
      const account = { ...data, id: `user-${Date.now()}` };
      setAccounts((current) => [...current, account]);
      return account;
    },
    signOut: () => setUser(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export const DEMO_LOGIN = { email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password!, phone: DEMO_ACCOUNT.phone!.number };

/** Close the whole auth modal, wherever we are inside it. */
export function exitAuth() {
  router.dismissAll();
  router.back();
}
