import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { Role } from '@prisma/client';
import { ApiResponse } from '@shopsphere/shared-types';

const router = Router();

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = `${process.env.API_URL || 'http://localhost:5001'}/auth/google/callback`;

const oauth2Client = new OAuth2Client(
  googleClientId,
  googleClientSecret,
  redirectUri
);

// Helper to set cookie options
const getCookieOptions = (maxAgeMs: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: maxAgeMs,
});

// GET /auth/google - Start OAuth flow
router.get('/google', (req: Request, res: Response) => {
  if (!googleClientId || !googleClientSecret) {
    console.error('[Google Auth Config Error]: Missing client variables.');
    return res.status(500).json({
      success: false,
      message: 'Google Authentication is currently misconfigured.',
    });
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'consent',
  });

  res.redirect(authUrl);
});

// GET /auth/google/callback - Handle OAuth redirect
router.get('/google/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(400).redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=no_code`
    );
  }

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (!tokens.id_token) {
      throw new Error('Google did not return an id_token');
    }

    // Verify ID Token and parse profile payload
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      throw new Error('Invalid ID Token payload from Google');
    }

    // Check if user exists (by googleId or email)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: payload.sub },
          { email: payload.email },
        ],
      },
    });

    if (!user) {
      // Create user automatically
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim() || 'Google User',
          googleId: payload.sub,
          avatarUrl: payload.picture,
          provider: 'GOOGLE',
          isVerified: true,
        },
      });
      console.log(`[Google Auth] Created new user: ${user.email}`);
    } else {
      // Link Google profile if existing user registered locally
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: payload.sub,
            avatarUrl: payload.picture || user.avatarUrl,
            provider: 'GOOGLE',
            isVerified: true,
          },
        });
        console.log(`[Google Auth] Linked Google login to existing user: ${user.email}`);
      } else {
        // Update profile picture if it has changed
        if (payload.picture && user.avatarUrl !== payload.picture) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl: payload.picture },
          });
        }
        console.log(`[Google Auth] Logged in existing user: ${user.email}`);
      }
    }

    // Generate JWT access & refresh tokens
    const jwtSecret = process.env.JWT_SECRET || 'fallback_access_secret_key';
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key';

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      jwtRefreshSecret,
      { expiresIn: '7d' }
    );

    // Set secure HTTP-only cookies
    res.cookie('accessToken', accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    // Redirect user to the frontend home
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
  } catch (error: any) {
    console.error('[Google Callback Error]:', error);
    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`
    );
  }
});

// GET /auth/me - Retrieve current logged-in user profile
router.get('/me', async (req: Request, res: Response) => {
  const token = req.cookies.accessToken;
  if (!token) {
    const errorResponse: ApiResponse = {
      success: false,
      message: 'Unauthenticated. Access token is missing.',
    };
    return res.status(401).json(errorResponse);
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback_access_secret_key';
    const decoded = jwt.verify(token, jwtSecret) as { id: string; email: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        avatarUrl: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User session invalid. User not found.',
      });
    }

    const response: ApiResponse = {
      success: true,
      data: user,
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.error('[Auth Me Error]:', error.message);
    const code = error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
    res.status(401).json({
      success: false,
      message: 'Session invalid or expired.',
      errors: [code],
    });
  }
});

// POST /auth/refresh - Rotate tokens
router.post('/refresh', async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token is missing.',
    });
  }

  try {
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key';
    const decoded = jwt.verify(token, jwtRefreshSecret) as { id: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session.',
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback_access_secret_key';
    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '15m' }
    );

    res.cookie('accessToken', newAccessToken, getCookieOptions(15 * 60 * 1000));

    res.status(200).json({
      success: true,
      message: 'Session refreshed successfully.',
    });
  } catch (error: any) {
    console.error('[Auth Refresh Error]:', error.message);
    res.status(401).json({
      success: false,
      message: 'Refresh session expired.',
    });
  }
});

// GET /auth/dev-login - Bypass logic for developer authentication
router.get('/dev-login', async (req: Request, res: Response) => {
  const roleParam = (req.query.role as string || 'CUSTOMER').toUpperCase() as Role;
  const email = `${roleParam.toLowerCase()}-dev@shopsphere.com`;
  const name = `Dev ${roleParam.charAt(0) + roleParam.slice(1).toLowerCase()}`;

  try {
    let user = await prisma.user.findFirst({
      where: { role: roleParam },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          role: roleParam,
          rewardPoints: 500,
          membershipLevel: 'GOLD',
          isVerified: true,
        },
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback_access_secret_key';
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key';

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      jwtRefreshSecret,
      { expiresIn: '7d' }
    );

    res.cookie('accessToken', accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    // Redirect to matching portal
    let redirectPath = '/dashboard';
    if (roleParam === 'ADMIN') redirectPath = '/admin/dashboard';
    else if (roleParam === 'SELLER') redirectPath = '/seller/dashboard';
    else if (roleParam === 'ENTERPRISE') redirectPath = '/enterprise/dashboard';

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}${redirectPath}`);
  } catch (error) {
    console.error('Dev login error:', error);
    res.status(500).json({ success: false, message: 'Dev login error' });
  }
});

// POST /auth/logout - Clear session
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

export default router;
