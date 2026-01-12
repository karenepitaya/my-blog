declare namespace Express {
  interface Response {
    success: (data: any, statusCode?: number) => Response;
    error: (statusCode: number, code: string, message: string, details?: unknown) => Response;
  }
}

declare namespace Express {
  interface Request {
    user?: {
      id: string;
      role: 'admin' | 'author';
      status?: 'ACTIVE' | 'BANNED' | 'PENDING_DELETE';
      impersonatorAdminId?: string;
    };

    validated?: {
      params?: unknown;
      query?: unknown;
      body?: unknown;
    };
  }
}
