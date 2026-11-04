import { Router } from 'express';
import crypto from 'crypto';
import { createSessionToken } from '../middleware/auth.js';
import { upsertOAuthUser } from '../services/oauthUsers.js';

export const oauthRouter = Router();

const pendingStates = new Map();

function providersConfigured() {
  return {
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    microsoft: Boolean(
      process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET,
    ),
  };
}

function frontendRedirect(pathQuery) {
  const base = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
  return `${base}${pathQuery}`;
}

function rememberState(provider) {
  const state = `${provider}-${crypto.randomBytes(16).toString('hex')}`;
  pendingStates.set(state, { provider, at: Date.now() });
  return state;
}

function consumeState(state, provider) {
  const entry = pendingStates.get(state);
  pendingStates.delete(state);
  if (!entry || entry.provider !== provider) return false;
  if (Date.now() - entry.at > 10 * 60 * 1000) return false;
  return true;
}

oauthRouter.get('/providers', (_request, response) => {
  const p = providersConfigured();
  response.json({
    ok: true,
    providers: {
      google: {
        configured: p.google,
        clientIdPresent: Boolean(process.env.GOOGLE_CLIENT_ID),
        secretPresent: Boolean(process.env.GOOGLE_CLIENT_SECRET),
        authUrl: p.google ? '/api/oauth/google/start' : null,
      },
      microsoft: {
        configured: p.microsoft,
        authUrl: p.microsoft ? '/api/oauth/microsoft/start' : null,
      },
    },
    note: p.google
      ? 'Google listo.'
      : process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_SECRET
        ? 'Falta GOOGLE_CLIENT_SECRET en backend/.env'
        : 'Faltan variables OAuth. Ver docs/AUTENTICACION.md',
  });
});

oauthRouter.get('/google/start', (_request, response) => {
  if (!providersConfigured().google) {
    return response.status(503).json({
      ok: false,
      error: process.env.GOOGLE_CLIENT_ID
        ? 'Falta GOOGLE_CLIENT_SECRET. Cópialo desde Google Cloud Console → Credenciales → tu cliente OAuth.'
        : 'Google OAuth no configurado. Defina GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.',
    });
  }
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/oauth/google/callback';
  const state = rememberState('google');
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    include_granted_scopes: 'true',
    prompt: 'select_account',
    state,
  });
  response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

oauthRouter.get('/google/callback', async (request, response) => {
  const { code, state, error } = request.query;
  if (error) {
    return response.redirect(
      frontendRedirect(`/login?oauth_error=${encodeURIComponent(String(error))}`),
    );
  }
  if (!code || !consumeState(String(state || ''), 'google')) {
    return response.redirect(
      frontendRedirect('/login?oauth_error=state_invalido'),
    );
  }
  if (!providersConfigured().google) {
    return response.redirect(
      frontendRedirect('/login?oauth_error=google_no_configurado'),
    );
  }

  try {
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/oauth/google/callback';
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Google token error:', tokenData);
      return response.redirect(
        frontendRedirect(
          `/login?oauth_error=${encodeURIComponent(tokenData.error || 'token_exchange')}`,
        ),
      );
    }

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    if (!profileRes.ok || !profile.sub) {
      return response.redirect(
        frontendRedirect('/login?oauth_error=perfil_google'),
      );
    }

    const user = await upsertOAuthUser({
      provider: 'google',
      subject: profile.sub,
      email: profile.email,
      firstName: profile.given_name || profile.name?.split(' ')[0] || 'Usuario',
      lastName:
        profile.family_name ||
        profile.name?.split(' ').slice(1).join(' ') ||
        'Google',
      pictureUrl: profile.picture || null,
    });
    const token = createSessionToken(user.id, {
      email: user.email,
      passwordHash: 'oauth:google',
      roleId: 3,
    });
    const userB64 = Buffer.from(JSON.stringify(user), 'utf8').toString('base64url');
    return response.redirect(
      frontendRedirect(`/login?oauth=google&token=${token}&user=${userB64}`),
    );
  } catch (err) {
    console.error('Google OAuth callback:', err.message);
    return response.redirect(
      frontendRedirect(`/login?oauth_error=${encodeURIComponent(err.message)}`),
    );
  }
});

oauthRouter.get('/microsoft/start', (_request, response) => {
  if (!providersConfigured().microsoft) {
    return response.status(503).json({
      ok: false,
      error: 'Microsoft OAuth no configurado. Defina MICROSOFT_CLIENT_ID y MICROSOFT_CLIENT_SECRET.',
    });
  }
  const tenant = process.env.MICROSOFT_TENANT || 'common';
  const state = rememberState('microsoft');
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
    response_mode: 'query',
    scope: 'openid email profile',
    state,
  });
  response.redirect(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params}`,
  );
});

oauthRouter.get('/microsoft/callback', async (request, response) => {
  const { code, state, error } = request.query;
  if (error) {
    return response.redirect(
      frontendRedirect(`/login?oauth_error=${encodeURIComponent(String(error))}`),
    );
  }
  if (!code || !consumeState(String(state || ''), 'microsoft')) {
    return response.redirect(frontendRedirect('/login?oauth_error=state_invalido'));
  }
  if (!providersConfigured().microsoft) {
    return response.redirect(frontendRedirect('/login?oauth_error=microsoft_no_configurado'));
  }

  try {
    const tenant = process.env.MICROSOFT_TENANT || 'common';
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET,
          code: String(code),
          redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      },
    );
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return response.redirect(
        frontendRedirect(
          `/login?oauth_error=${encodeURIComponent(tokenData.error || 'token_exchange')}`,
        ),
      );
    }

    const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    const email =
      profile.mail || profile.userPrincipalName || profile.otherMails?.[0];
    const user = await upsertOAuthUser({
      provider: 'microsoft',
      subject: profile.id,
      email,
      firstName: profile.givenName || profile.displayName || 'Usuario',
      lastName: profile.surname || 'Microsoft',
      pictureUrl: null,
    });
    const token = createSessionToken(user.id, {
      email: user.email,
      passwordHash: 'oauth:microsoft',
      roleId: 3,
    });
    const userB64 = Buffer.from(JSON.stringify(user), 'utf8').toString('base64url');
    return response.redirect(
      frontendRedirect(`/login?oauth=microsoft&token=${token}&user=${userB64}`),
    );
  } catch (err) {
    console.error('Microsoft OAuth callback:', err.message);
    return response.redirect(
      frontendRedirect(`/login?oauth_error=${encodeURIComponent(err.message)}`),
    );
  }
});

oauthRouter.post('/link-demo', async (request, response) => {
  if (process.env.ALLOW_OAUTH_LINK_DEMO !== 'true') {
    return response.status(403).json({
      ok: false,
      error: 'Deshabilitado. Active ALLOW_OAUTH_LINK_DEMO=true solo en desarrollo.',
    });
  }
  const email = String(request.body?.email || '').trim().toLowerCase();
  const provider = String(request.body?.provider || '').toLowerCase();
  const subject = String(request.body?.subject || '').trim();
  if (!email || !['google', 'microsoft'].includes(provider) || !subject) {
    return response.status(400).json({ ok: false, error: 'email, provider y subject requeridos.' });
  }

  try {
    const user = await upsertOAuthUser({
      provider,
      subject,
      email,
      firstName: request.body?.firstName,
      lastName: request.body?.lastName,
    });
    const token = createSessionToken(user.id, {
      email: user.email,
      passwordHash: `oauth:${provider}`,
      roleId: 3,
    });
    return response.json({
      ok: true,
      token,
      user,
      note: 'Vinculación demo.',
    });
  } catch (error) {
    return response.status(error.status || 500).json({
      ok: false,
      error: error.message,
    });
  }
});
