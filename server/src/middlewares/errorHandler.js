import { ApiError } from "../utils/ApiError.js";
import { ZodError } from "zod";
import { env } from "../config/env.js";

// Runs when no route matched the request
export const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

// Runs whenever an error is thrown or passed to next(err)
export const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = "Internal server error";
  let details = null;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    details = err.flatten().fieldErrors;
  } else if (err.code === "P2002") {
    // Prisma: unique constraint violated (e.g. email already used)
    statusCode = 409;
    message = "Resource already exists";
  } else if (err.type === "entity.parse.failed") {
    // Invalid JSON in the request body
    statusCode = 400;
    message = "Invalid JSON body";
  }

  // Unexpected errors are bugs: log them, never show internals to the client
  if (statusCode === 500) {
    req.log.error({ err }, "Unhandled error");
  }
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      details,
      ...(env.NODE_ENV === "development" &&
        statusCode === 500 && { stack: err.stack }),
    },
  });
};
