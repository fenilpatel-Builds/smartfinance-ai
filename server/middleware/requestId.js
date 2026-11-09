import crypto from 'crypto';

/**
 * Request correlation ID middleware.
 * Attaches a unique correlation ID to incoming requests and sets response headers.
 */
export const requestId = (req, res, next) => {
  const incomingId = req.header('X-Correlation-ID') || req.header('X-Request-ID');
  const correlationId = incomingId || crypto.randomUUID();
  req.id = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  next();
};

export default requestId;
