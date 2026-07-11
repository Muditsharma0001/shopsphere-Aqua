import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
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

// POST /auth/register - Register customer
router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email address already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone: phone || null,
        role: 'CUSTOMER',
        provider: 'LOCAL',
        isVerified: true,
      },
    });

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

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server registration error.' });
  }
});

// POST /auth/login - User email/password login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    // Ensure default business owner is seeded
    const defaultOwnerEmail = 'owner@shopsphere.com';
    let defaultOwner = await prisma.user.findUnique({ where: { email: defaultOwnerEmail } });
    if (!defaultOwner) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('password123', salt);
      defaultOwner = await prisma.user.create({
        data: {
          email: defaultOwnerEmail,
          name: 'Store Owner',
          passwordHash: hash,
          role: 'BUSINESS_OWNER',
          isVerified: true,
        },
      });
      console.log('[Auth] Automatically seeded default business owner: owner@shopsphere.com');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(400).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials.' });
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

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server login error.' });
  }
});

// POST /auth/forgot-password - Forgot password placeholder
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }
  res.status(200).json({ success: true, message: 'Password reset link has been dispatched to your email address.' });
});

// POST /auth/reset-password - Reset password placeholder
router.post('/reset-password', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and new password are required.' });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });
    res.status(200).json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server reset error.' });
  }
});

// GET /auth/demo-login - Seeding and instant JWT cookie generation for demo mode
router.get('/demo-login', async (req: Request, res: Response) => {
  const roleParam = req.query.role || 'CUSTOMER';
  const role = (roleParam as string).toUpperCase();

  try {
    let email = 'demo.customer@hydraflow.com';
    let name = 'Demo Customer';

    if (role === 'BUSINESS_OWNER') {
      email = 'admin@hydraflow.com';
      name = 'Admin Owner';
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Create user automatically
      user = await prisma.user.create({
        data: {
          email,
          name,
          role: role as any,
          provider: 'LOCAL',
          isVerified: true,
          rewardPoints: role === 'CUSTOMER' ? 150 : 500,
          membershipLevel: role === 'CUSTOMER' ? 'SILVER' : 'GOLD',
        },
      });
      console.log(`[Demo Auth] Automatically created demo account: ${email} (${role})`);
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

    // Redirect target
    const redirectUrl = role === 'BUSINESS_OWNER' ? '/business/dashboard' : '/';
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}${redirectUrl}`);
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ success: false, message: 'Demo authentication failed.' });
  }
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

  const role = req.query.role as string;
  if (role) {
    res.cookie('authRole', role.toUpperCase(), { maxAge: 10 * 60 * 1000, httpOnly: true });
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

    const targetRole = (req.cookies?.authRole || 'CUSTOMER').toUpperCase() as Role;
    res.clearCookie('authRole');

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
          role: targetRole,
        },
      });
      console.log(`[Google Auth] Created new user: ${user.email} with role ${user.role}`);
    } else {
      // Link Google profile if existing user registered locally
      const updateData: any = {
        isVerified: true,
      };
      if (!user.googleId) {
        updateData.googleId = payload.sub;
        updateData.provider = 'GOOGLE';
      }
      if (payload.picture && user.avatarUrl !== payload.picture) {
        updateData.avatarUrl = payload.picture;
      }
      if (user.role !== targetRole) {
        updateData.role = targetRole;
      }

      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
      console.log(`[Google Auth] Logged in user: ${user.email} with role ${user.role}`);
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

    // Redirect user to their corresponding route
    const redirectPath = targetRole === 'BUSINESS_OWNER' ? '/business/dashboard' : '/';
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}${redirectPath}`);
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
    else if (roleParam === 'BUSINESS_OWNER') redirectPath = '/business/dashboard';

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
