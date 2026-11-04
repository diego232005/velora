export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Velora API',
    version: '0.2.0',
    description:
      'API de la casa de apuestas de demostración Velora (Liga BetPlay). No opera dinero real.',
  },
  servers: [{ url: 'http://localhost:4000', description: 'Local' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'token' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: false },
          error: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        summary: 'Health MySQL + estado multi-BD opcional',
        parameters: [
          {
            name: 'all',
            in: 'query',
            schema: { type: 'string', enum: ['1', 'true'] },
          },
        ],
        responses: { 200: { description: 'OK' }, 500: { description: 'MySQL caído' } },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Login correo/contraseña',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['identifier', 'password'],
                properties: {
                  identifier: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Sesión' }, 401: { description: 'Credenciales' } },
      },
    },
    '/api/sports/clubs': {
      get: { summary: 'Clubes Liga BetPlay (MySQL)', responses: { 200: { description: 'Lista' } } },
    },
    '/api/sports/players': {
      get: {
        summary: 'Jugadores (MySQL)',
        parameters: [{ name: 'clubId', in: 'query', schema: { type: 'integer' } }],
        responses: { 200: { description: 'Lista' } },
      },
    },
    '/api/sports/matches': {
      get: {
        summary: 'Partidos colombianos',
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['live', 'upcoming', 'finished'] },
          },
        ],
        responses: { 200: { description: 'Lista' } },
      },
    },
    '/api/sports/sync': {
      post: {
        summary: 'Sincroniza MySQL → PostgreSQL',
        responses: { 200: { description: 'Sync OK' }, 500: { description: 'Fallo' } },
      },
    },
    '/api/bets/place': {
      post: {
        summary: 'Confirmar cupón (PostgreSQL + libro)',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Creada' }, 409: { description: 'Conflicto' } },
      },
    },
    '/api/bets/mine': {
      get: {
        summary: 'Historial de apuestas',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Lista' } },
      },
    },
    '/api/wallet/me': {
      get: {
        summary: 'Saldo simulación',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Wallet' } },
      },
    },
    '/api/payments/wompi/status': {
      get: { summary: 'Estado integración Wompi', responses: { 200: { description: 'Modo' } } },
    },
    '/api/payments/wompi/deposits': {
      post: {
        summary: 'Iniciar depósito de prueba',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Referencia creada' } },
      },
    },
    '/api/oauth/providers': {
      get: { summary: 'Estado Google/Microsoft OAuth', responses: { 200: { description: 'OK' } } },
    },
    '/api/drive/status': {
      get: { summary: 'Estado Google Drive', responses: { 200: { description: 'OK' } } },
    },
  },
};
