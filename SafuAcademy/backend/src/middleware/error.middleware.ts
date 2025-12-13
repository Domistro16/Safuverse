import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { config } from '../config/index.js';

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export function errorMiddleware(
    err: AppError,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
): void {
    console.error('Error:', err);

    // Handle Zod validation errors
    if (err instanceof ZodError) {
        res.status(400).json({
            error: 'Validation error',
            details: err.errors.map(e => ({
                path: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }

    // Handle known operational errors
    if (err.isOperational) {
        res.status(err.statusCode || 500).json({
            error: err.message,
        });
        return;
    }

    // Handle Prisma errors
    if (err.name === 'PrismaClientKnownRequestError') {
        res.status(400).json({
            error: 'Database operation failed',
            details: config.nodeEnv === 'development' ? err.message : undefined,
        });
        return;
    }

    // Default error response
    res.status(500).json({
        error: config.nodeEnv === 'production'
            ? 'Internal server error'
            : err.message,
    });
}

export function notFoundMiddleware(req: Request, res: Response): void {
    res.status(404).json({
        error: 'Not found',
        path: req.path,
    });
}

export class HttpError extends Error implements AppError {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
