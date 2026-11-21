import { AuthUserPayload } from '../services/auth.service.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export {};
