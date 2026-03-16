import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const API_URL = process.env['API_URL'] ?? 'http://localhost:3001/api/v1';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
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

          const data = await res.json() as { accessToken: string; user: { id: string; nombre: string; email: string; rol: string; activo: boolean } };
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
    async jwt({ token, user }) {
      if (user) {
        token['accessToken'] = (user as { accessToken?: string }).accessToken;
        token['rol'] = (user as { rol?: string }).rol;
        token['id'] = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token['id'] as string;
      session.user.rol = token['rol'] as string;
      (session as { accessToken?: string }).accessToken = token['accessToken'] as string;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
});
