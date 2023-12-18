import { Request, Response, NextFunction } from 'express';

const catchAsync = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err: any) => {
      let errName = err.name;
      console.error({ errName });
      let errMessage = err.message;
      if (!errMessage) errMessage = err;
      console.error('CaughtError:', err);
      console.error('ErrorStack:', err.stack);
      console.error('ErrorPayload:', JSON.stringify(req.body));
      console.error('ErrorParams:', req.params);
      console.error('--------------------xxxxxx--------------------');
      console.error(err.stack);
      let responseStatusCode = 500;
      if (err.statusCode) responseStatusCode = err.statusCode;

      try {
        errMessage = JSON.parse(errMessage);
        errMessage = errMessage.map((ex: any) => ex.message).join(',');
      } catch (e) {}

      return res.status(responseStatusCode).json({
        success: false,
        message: errMessage,
      });
    });
};

export default catchAsync;
