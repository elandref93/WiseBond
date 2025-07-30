import { Request, Response } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { sendWelcomeEmail } from './email';

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
 * OAuth provider configurations
 */
export const oauthProviders = {
  google: {
    name: 'Google',
    authorizeUrl: 'https://accounts.google.com/oauth/authorize',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: 'openid email profile',
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
  },
  facebook: {
    name: 'Facebook',
    authorizeUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/me?fields=id,name,email,picture',
    scope: 'email',
    clientId: () => process.env.FACEBOOK_CLIENT_ID,
    clientSecret: () => process.env.FACEBOOK_CLIENT_SECRET,
  },
};

/**
 * Generate OAuth authorization URL
 */
export function generateAuthUrl(provider: string, redirectUri: string): string {
  const config = oauthProviders[provider as keyof typeof oauthProviders];
  if (!config) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  const state = crypto.randomBytes(32).toString('hex');
  const params = new URLSearchParams({
    client_id: config.clientId()!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scope,
    state,
  });

  return `${config.authorizeUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(provider: string, code: string, redirectUri: string) {
  const config = oauthProviders[provider as keyof typeof oauthProviders];
  if (!config) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      client_id: config.clientId()!,
      client_secret: config.clientSecret()!,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange code for token: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get user info from OAuth provider
 */
export async function getUserInfo(provider: string, accessToken: string) {
  const config = oauthProviders[provider as keyof typeof oauthProviders];
  if (!config) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  const response = await fetch(config.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create or update user from OAuth profile
 */
export async function createOrUpdateOAuthUser(provider: string, profile: any) {
  let firstName = '';
  let lastName = '';
  let email = '';
  let image = '';
  let providerAccountId = '';

  // Parse profile based on provider
  if (provider === 'google') {
    firstName = profile.given_name || '';
    lastName = profile.family_name || '';
    email = profile.email || '';
    image = profile.picture || '';
    providerAccountId = profile.id;
  } else if (provider === 'facebook') {
    const parsedName = parseDisplayName(profile.name || '');
    firstName = parsedName.firstName;
    lastName = parsedName.lastName;
    email = profile.email || '';
    image = profile.picture?.data?.url || '';
    providerAccountId = profile.id;
  }

  if (!email) {
    throw new Error('Email is required from OAuth provider');
  }

  // Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    // Update existing user with OAuth info
    const updatedUser = await db
      .update(users)
      .set({
        providerId: provider,
        providerAccountId,
        image: image || existingUser[0].image,
        otpVerified: true, // OAuth users are pre-verified
      })
      .where(eq(users.id, existingUser[0].id))
      .returning();

    return updatedUser[0];
  } else {
    // Create new user
    const newUser = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        email,
        username: email.split('@')[0],
        providerId: provider,
        providerAccountId,
        image,
        otpVerified: true,
        profileComplete: false, // They'll need to complete additional profile info
      })
      .returning();

    // Send welcome email for new OAuth users
    try {
      await sendWelcomeEmail({
        firstName: firstName || 'User',
        email,
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    return newUser[0];
  }
}

/**
 * Get server-side session using existing session management
 */
export async function getServerSession(req: any, res: any) {
  // Use existing session-based authentication
  if (!req.session?.userId) {
    return null;
  }
  
  try {
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        image: users.image,
        profileComplete: users.profileComplete,
        otpVerified: users.otpVerified,
        providerId: users.providerId,
      })
      .from(users)
      .where(eq(users.id, req.session.userId))
      .limit(1);
    
    if (user.length === 0) {
      return null;
    }
    
    return {
      user: user[0],
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}