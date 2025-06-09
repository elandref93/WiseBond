import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { users, accounts, sessions, verificationTokens } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Smart name parsing utility for handling display names from OAuth providers
 * Handles various formats: "John Doe", "John", "Dr. John Doe", "John van der Merwe"
 */
function parseDisplayName(displayName: string): { firstName: string; lastName: string } {
  if (!displayName || displayName.trim() === '') {
    return { firstName: '', lastName: '' };
  }

  const nameParts = displayName.trim().split(/\s+/);
  
  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: '' };
  }
  
  if (nameParts.length === 2) {
    return { firstName: nameParts[0], lastName: nameParts[1] };
  }
  
  // Handle titles like Dr., Mr., Mrs., Prof.
  const titles = ['dr', 'mr', 'mrs', 'ms', 'prof', 'professor', 'doctor'];
  let startIndex = 0;
  
  if (titles.includes(nameParts[0].toLowerCase().replace('.', ''))) {
    startIndex = 1;
  }
  
  // Handle compound surnames (van der, de la, etc.)
  const connectors = ['van', 'der', 'de', 'la', 'du', 'von', 'mac', 'mc', 'o'];
  
  if (nameParts.length > 2) {
    // Check if we have compound surnames
    for (let i = startIndex + 1; i < nameParts.length - 1; i++) {
      if (connectors.includes(nameParts[i].toLowerCase())) {
        // Found connector, everything from here is surname
        return {
          firstName: nameParts.slice(startIndex, i).join(' '),
          lastName: nameParts.slice(i).join(' ')
        };
      }
    }
    
    // No connectors found, assume first part is first name, rest is surname
    return {
      firstName: nameParts[startIndex],
      lastName: nameParts.slice(startIndex + 1).join(' ')
    };
  }
  
  return {
    firstName: nameParts[startIndex] || '',
    lastName: nameParts[startIndex + 1] || ''
  };
}

/**
 * NextAuth.js configuration with Google and Facebook OAuth
 */
export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          firstName: profile.given_name || '',
          lastName: profile.family_name || '',
          image: profile.picture,
          providerId: 'google',
          providerAccountId: profile.sub,
          username: profile.email?.split('@')[0] || '',
          otpVerified: true, // OAuth users are pre-verified
          profileComplete: false, // They'll need to complete additional profile info
        };
      },
    }),
    
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      profile(profile) {
        const { firstName, lastName } = parseDisplayName(profile.name || '');
        
        return {
          id: profile.id,
          email: profile.email,
          firstName,
          lastName,
          image: profile.picture?.data?.url,
          providerId: 'facebook',
          providerAccountId: profile.id,
          username: profile.email?.split('@')[0] || '',
          otpVerified: true, // OAuth users are pre-verified
          profileComplete: false, // They'll need to complete additional profile info
        };
      },
    }),
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Check if user already exists in our database
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email!))
          .limit(1);
        
        if (existingUser.length > 0) {
          // User exists, update OAuth info if needed
          await db
            .update(users)
            .set({
              providerId: account?.provider,
              providerAccountId: account?.providerAccountId,
              image: user.image || existingUser[0].image,
            })
            .where(eq(users.id, existingUser[0].id));
          
          return true;
        }
        
        // New user - will be created by the adapter
        return true;
      } catch (error) {
        console.error('Error during sign in:', error);
        return false;
      }
    },
    
    async session({ session, user }) {
      // Add custom user data to session
      if (user) {
        const dbUser = await db
          .select()
          .from(users)
          .where(eq(users.id, parseInt(user.id)))
          .limit(1);
        
        if (dbUser.length > 0) {
          session.user = {
            ...session.user,
            id: dbUser[0].id.toString(),
            firstName: dbUser[0].firstName,
            lastName: dbUser[0].lastName,
            profileComplete: dbUser[0].profileComplete,
            otpVerified: dbUser[0].otpVerified,
          };
        }
      }
      
      return session;
    },
    
    async jwt({ token, user, account }) {
      // Persist user ID in JWT
      if (user) {
        token.userId = user.id;
      }
      
      return token;
    },
  },
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  session: {
    strategy: 'database',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  
  events: {
    async createUser({ user }) {
      console.log('New user created via OAuth:', user.email);
    },
    
    async signIn({ user, account, isNewUser }) {
      console.log('User signed in:', user.email, 'via', account?.provider);
      
      if (isNewUser) {
        // Send welcome email for new OAuth users
        try {
          const { sendWelcomeEmail } = await import('./email');
          await sendWelcomeEmail({
            firstName: user.firstName || 'User',
            email: user.email!,
          });
        } catch (error) {
          console.error('Failed to send welcome email:', error);
        }
      }
    },
  },
  
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Get server-side session
 */
export async function getServerSession(req: any, res: any) {
  // Import getServerSession from next-auth when available
  // For now, implement basic session validation
  const sessionToken = req.cookies?.['next-auth.session-token'] || 
                      req.cookies?.['__Secure-next-auth.session-token'];
  
  if (!sessionToken) {
    return null;
  }
  
  try {
    const session = await db
      .select({
        sessionToken: sessions.sessionToken,
        userId: sessions.userId,
        expires: sessions.expires,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        image: users.image,
        profileComplete: users.profileComplete,
        otpVerified: users.otpVerified,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id.toString()))
      .where(eq(sessions.sessionToken, sessionToken))
      .limit(1);
    
    if (session.length === 0 || session[0].expires < new Date()) {
      return null;
    }
    
    return {
      user: {
        id: session[0].userId,
        email: session[0].email,
        firstName: session[0].firstName,
        lastName: session[0].lastName,
        image: session[0].image,
        profileComplete: session[0].profileComplete,
        otpVerified: session[0].otpVerified,
      },
      expires: session[0].expires.toISOString(),
    };
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}