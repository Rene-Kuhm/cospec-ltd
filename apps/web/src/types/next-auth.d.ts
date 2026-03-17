import NextAuth, { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { Rol } from '@cospec/shared-types';

declare module 'next-auth' {
  interface User {
    id: string;
    rol: Rol;
    accessToken: string;
  }

  interface Session extends DefaultSession {
    accessToken?: string;
    user: {
      id: string;
      rol?: Rol;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    rol?: Rol;
    id?: string;
  }
}
