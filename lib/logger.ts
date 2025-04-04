import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const { combine, timestamp, printf, colorize, align, json } = winston.format;

// Custom log format for console
const consoleLogFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  align(),
  printf((info) => `[${info.timestamp}] ${info.level}: ${(info.message as string).trim()} ${
    info.metadata && Object.keys(info.metadata).length ? JSON.stringify(info.metadata) : ''
  }`)
);

// Custom log format for file
const fileLogFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  json() // Log as JSON in the file
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: fileLogFormat, // Default format for transports
  transports: [
    // Console transport (only in non-production or if explicitly enabled)
    new winston.transports.Console({
      format: consoleLogFormat,
      level: 'debug', // Show debug logs in console during development
      silent: process.env.NODE_ENV === 'production' && !process.env.ENABLE_CONSOLE_LOGGING,
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      level: 'debug', // Log everything to the file
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File transport for error logs
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'exceptions.log') })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'rejections.log') })
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

// Helper function to log messages with metadata
const log = (level: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly', message: string, metadata?: object) => {
  logger.log(level, message, { metadata });
};

export const loggerInstance = logger; // Export the raw instance if needed
export const logError = (message: string, metadata?: object) => log('error', message, metadata);
export const logWarn = (message: string, metadata?: object) => log('warn', message, metadata);
export const logInfo = (message: string, metadata?: object) => log('info', message, metadata);
export const logDebug = (message: string, metadata?: object) => log('debug', message, metadata);

export default {
  error: logError,
  warn: logWarn,
  info: logInfo,
  debug: logDebug,
  stream: {
    write: (message: string) => {
      // Use for morgan logging middleware if needed
      logger.info(message.trim());
    },
  },
};
