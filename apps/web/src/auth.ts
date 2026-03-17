import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { Rol } from '@cospec/shared-types';

const API_URL = process.env['API_URL'] ?? 'http://localhost:3001/api/v1';
const WEB_ALLOWED_ROLES = new Set<Rol>([Rol.ADMIN, Rol.OPERADOR]);

type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  rol: Rol;
  accessToken: string;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env['AUTH_SECRET'] ?? 'development-secret-change-in-production',
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials): Promise<AuthenticatedUser | null> {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) return null;

          const data = await res.json() as {
            accessToken: string;
            user: {
              id: string;
              nombre: string;
              email: string;
              rol: Rol;
            };
          };

          return {
            id: data.user.id,
            name: data.user.nombre,
            email: data.user.email,
            rol: data.user.rol,
            accessToken: data.accessToken,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      return WEB_ALLOWED_ROLES.has(user.rol as Rol);
    },
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.rol = user.rol as Rol;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? '';
        if (token.rol) {
          session.user.rol = token.rol;
        }
      }
      session.accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
});
