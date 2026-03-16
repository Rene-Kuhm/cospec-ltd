import { DefaultSession, DefaultJWT } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken: string;
    user: {
      id: string;
      rol: string;
    } & DefaultSession['user'];
  }

  interface JWT extends DefaultJWT {
    accessToken: string;
    rol: string;
    id: string;
  }
}
