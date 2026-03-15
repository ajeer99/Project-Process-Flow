import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnAdmin = nextUrl.pathname.startsWith('/admin');
            const isOnForceReset = nextUrl.pathname === '/login/force-reset';
            const role = (auth?.user as any)?.role;
            const mustChangePassword = (auth?.user as any)?.mustChangePassword;

            if (isLoggedIn && mustChangePassword && !isOnForceReset) {
                 return Response.redirect(new URL('/login/force-reset', nextUrl));
            }
            if (isLoggedIn && !mustChangePassword && isOnForceReset) {
                 return Response.redirect(new URL('/admin/dashboard', nextUrl));
            }

            if (isOnAdmin) {
                if (isLoggedIn) {
                    if (role === 'DEVELOPER') {
                        if (!nextUrl.pathname.startsWith('/admin/workspace')) {
                            return Response.redirect(new URL('/admin/workspace', nextUrl));
                        }
                    } else if (role === 'TESTER') {
                        if (!nextUrl.pathname.startsWith('/admin/workspace')) {
                            return Response.redirect(new URL('/admin/workspace', nextUrl));
                        }
                    }
                    return true;
                }
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn && nextUrl.pathname === '/login') {
                if (role === 'DEVELOPER') {
                    return Response.redirect(new URL('/admin/workspace/developer', nextUrl));
                } else if (role === 'TESTER') {
                    return Response.redirect(new URL('/admin/workspace/tester', nextUrl));
                }
                return Response.redirect(new URL('/admin/dashboard', nextUrl));
            }
            return true;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
