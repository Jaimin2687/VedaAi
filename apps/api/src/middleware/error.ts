import type { NextFunction, Request, Response } from "express";

export const notFound = (req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({ error: "Route not found" });
};

export const errorHandler = (
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = err.status ?? 500;
  const message = status >= 500 ? "Unexpected server error" : err.message;
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(status).json({ error: message });
};
