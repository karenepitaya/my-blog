declare namespace Express {
  interface Response {
    success: (data: any) => Response;
    error: (statusCode: number, code: string, message: string) => Response;
  }
}

declare namespace Express {
  interface Request {
    user?: {
      id: string;
      role: 'admin' | 'author';
    };
  }
}
