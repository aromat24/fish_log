/**
 * Lightweight logging utility for Fish Log PWA
 * Respects environment settings and reduces console noise in production
 */

class Logger {
    constructor(isDevelopment = false) {
        this.isDevelopment = isDevelopment || 
            localStorage.getItem('fish-log-debug') === 'true' ||
            location.hostname === 'localhost' ||
            location.protocol === 'file:';
    }

    log(...args) {
        if (this.isDevelopment) {
            console.log(`[Fish-Log]`, ...args);
        }
    }

    warn(...args) {
        console.warn(`[Fish-Log]`, ...args);
    }

    error(...args) {
        console.error(`[Fish-Log]`, ...args);
    }

    debug(section, ...args) {
        if (this.isDevelopment) {
            console.log(`[Fish-Log:${section}]`, ...args);
        }
    }

    // Performance logging
    time(label) {
        if (this.isDevelopment) {
            console.time(`[Fish-Log] ${label}`);
        }
    }

    timeEnd(label) {
        if (this.isDevelopment) {
            console.timeEnd(`[Fish-Log] ${label}`);
        }
    }

    // Group logging for better organization
    group(label) {
        if (this.isDevelopment) {
            console.group(`[Fish-Log] ${label}`);
        }
    }

    groupEnd() {
        if (this.isDevelopment) {
            console.groupEnd();
        }
    }
}

// Global logger instance
window.logger = new Logger();