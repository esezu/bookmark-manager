import { Context } from 'hono';

interface ResponseData {
  code: number;
  message: string;
  data?: any;
}

export function success(c: Context, data?: any, message = 'success') {
  return c.json<ResponseData>({
    code: 0,
    message,
    data
  });
}

export function error(c: Context, message: string, code = 1) {
  return c.json<ResponseData>({
    code,
    message
  }, 400);
}

export function unauthorized(c: Context, message = 'Unauthorized') {
  return c.json<ResponseData>({
    code: 401,
    message
  }, 401);
}

export function forbidden(c: Context, message = 'Forbidden') {
  return c.json<ResponseData>({
    code: 403,
    message
  }, 403);
}

export function notFound(c: Context, message = 'Not found') {
  return c.json<ResponseData>({
    code: 404,
    message
  }, 404);
}
