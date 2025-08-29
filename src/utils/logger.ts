enum LogLevel {
    ERROR = 'ERROR',
    WARN = 'WARN',
    INFO = 'INFO',
    DEBUG = 'DEBUG'
}

class Logger {
    private formatTimestamp(): string {
        const now = new Date();
        return now.toISOString().replace('T', ' ').substring(0, 19);
    }

    private formatMessage(level: LogLevel, context: string, message: any, ...args: any[]): string {
        const timestamp = this.formatTimestamp();
        const formattedArgs = args.length > 0 ? ' ' + args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ') : '';

        return `[${timestamp}] [${level}] [${context}] ${message}${formattedArgs}`;
    }

    error(context: string, message: any, ...args: any[]): void {
        console.error(this.formatMessage(LogLevel.ERROR, context, message, ...args));
    }

    warn(context: string, message: any, ...args: any[]): void {
        console.warn(this.formatMessage(LogLevel.WARN, context, message, ...args));
    }

    info(context: string, message: any, ...args: any[]): void {
        console.log(this.formatMessage(LogLevel.INFO, context, message, ...args));
    }

    debug(context: string, message: any, ...args: any[]): void {
        if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
            console.log(this.formatMessage(LogLevel.DEBUG, context, message, ...args));
        }
    }
}

export const logger = new Logger();
