import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function getUser(email: string) {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) {
                        console.log('User not found in DB:', email);
                        return null;
                    }

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    console.log('Password Match Result:', passwordsMatch);

                    if (passwordsMatch) {
                        // Update tracking
                        await prisma.user.update({
                            where: { id: user.id },
                            data: {
                                isOnline: true,
                                lastActive: new Date(),
                                loginCount: { increment: 1 }
                            }
                        });
                        
                        return user;
                    }
                }

                console.log('Invalid credentials or Zod parsing failed');
                return null;
            },
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user }: any) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.mustChangePassword = user.mustChangePassword;
                token.passHash = user.password ? user.password.substring(0, 10) : undefined;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (token && session.user) {
                session.user.id = token.id as string;
                // @ts-ignore
                session.user.role = token.role as string;
                // @ts-ignore
                session.user.mustChangePassword = token.mustChangePassword as boolean;

                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: token.id as string },
                        select: { isActive: true, password: true, avatarUrl: true }
                    });
                    if (!dbUser || !dbUser.isActive) {
                        (session as any).error = "Revoked";
                    } else if (token.passHash && !dbUser.password.startsWith(token.passHash as string)) {
                        (session as any).error = "Revoked";
                    } else {
                        // Always populate the session with the latest avatar from DB
                        session.user.image = dbUser.avatarUrl || null;
                    }
                } catch (e) {
                    console.error("Session verification failed", e);
                }
            }
            return session;
        }
    },
});
