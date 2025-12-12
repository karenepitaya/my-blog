import { Request, Response, NextFunction } from 'express';

export const responseWrapper = (req: Request, res: Response, next: NextFunction) => {
  res.success = (data: any) => {
    return res.status(200).json({
      success: true,
      data,
      error: null,
    });
  };

  res.error = (statusCode: number, code: string, message: string) => {
    return res.status(statusCode).json({
      success: false,
      data: null,
      error: { code, message },
    });
  };

  next();
};
