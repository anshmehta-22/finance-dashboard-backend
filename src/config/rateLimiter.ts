import rateLimit from 'express-rate-limit';

const fifteenMinutes = 15 * 60 * 1000;

const generalMessage = {
  error: 'Too many requests, please try again later.',
};

const authMessage = {
  error: 'Too many auth attempts, please try again in 15 minutes.',
};

export const generalLimiter = rateLimit({
  windowMs: fifteenMinutes,
  max: 100,
  message: generalMessage,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(generalMessage);
  },
});

export const authLimiter = rateLimit({
  windowMs: fifteenMinutes,
  max: 10,
  message: authMessage,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(authMessage);
  },
});