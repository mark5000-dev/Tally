import type { Request } from "express";

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  role: "member" | "admin";
}

declare global {
  namespace Express {
    interface Request {
      auth?: {
        user: AuthenticatedUser;
        sessionId: string;
      };
    }
  }
}

export type AuthenticatedRequest = Request & {
  auth: { user: AuthenticatedUser; sessionId: string };
};
