import { Request, Response, NextFunction } from 'express';

export const responseWrapper = (req: Request, res: Response, next: NextFunction) => {
  res.success = (data: any, statusCode: number = 200) => {
    return res.status(statusCode).json({
      success: true,
      data,
      error: null,
    });
  };

  res.error = (statusCode: number, code: string, message: string, details?: unknown) => {
    return res.status(statusCode).json({
      success: false,
      data: null,
      error: details === undefined ? { code, message } : { code, message, details },
    });
  };

  next();
};
