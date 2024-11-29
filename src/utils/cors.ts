import Cors from 'cors';

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3001'];

export const cors = Cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

export async function runMiddleware(req: Request, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, {
      end: resolve,
      next: resolve,
    }).catch(reject);
  });
}
