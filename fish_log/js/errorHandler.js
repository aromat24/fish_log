// Advanced Error Handling System for Fish Log App
// Implements comprehensive error boundaries, custom error classes, and recovery strategies

// Custom Error Classes
class FishLogError extends Error {
    constructor(message, cause = null) {
        super(message);
        this.name = 'FishLogError';
        this.cause = cause;
        this.timestamp = new Date().toISOString();
    }
}

class DatabaseError extends FishLogError {
    constructor(message, cause = null, operation = null) {
        super(message, cause);
        this.name = 'DatabaseError';
        this.operation = operation;
    }
}

class StorageError extends FishLogError {
    constructor(message, cause = null, storageType = null) {
        super(message, cause);
        this.name = 'StorageError';
        this.storageType = storageType;
    }
}

class CalculationError extends FishLogError {
    constructor(message, cause = null, species = null, inputData = null) {
        super(message, cause);
        this.name = 'CalculationError';
        this.species = species;
        this.inputData = inputData;
    }
}

class ValidationError extends FishLogError {
    constructor(message, field = null, value = null) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
        this.value = value;
    }
}

class NetworkError extends FishLogError {
    constructor(message, cause = null, url = null, status = null) {
        super(message, cause);
        this.name = 'NetworkError';
        this.url = url;
        this.status = status;
    }
}

class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.setupGlobalHandlers();
    }

    setupGlobalHandlers() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.logError(event.reason, 'UnhandledPromiseRejection');
            
            // Prevent default behavior (console error)
            event.preventDefault();
            
            // Show user-friendly error message
            this.showUserError('An unexpected error occurred. Please try again.');
        });

        // Handle global errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.logError(event.error, 'GlobalError');
            
            // Show user-friendly error message
            this.showUserError('An unexpected error occurred. Please refresh the page.');
        });

        // Handle IndexedDB errors specifically
        window.addEventListener('error', (event) => {
            if (event.target && event.target.constructor.name === 'IDBRequest') {
                this.handleIndexedDBError(event.target.error, event.target);
            }
        });
    }

    logError(error, context = 'Unknown') {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            context,
            error: {
                name: error.name || 'Unknown',
                message: error.message || 'Unknown error',
                stack: error.stack || 'No stack trace',
                cause: error.cause || null
            }
        };

        this.errorLog.push(errorEntry);

        // Keep log size manageable
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxLogSize);
        }

        // Log to console with structured format
        console.error(`[${context}] ${error.name}: ${error.message}`, error);
    }

    handleIndexedDBError(error, request) {
        console.error('IndexedDB error:', error);
        
        // Specific handling for different IndexedDB errors
        if (error.name === 'ConstraintError') {
            this.logError(new DatabaseError('Constraint violation in database operation', error, 'constraint'));
            return false; // Don't show user error for constraint violations
        }
        
        if (error.name === 'TransactionInactiveError') {
            this.logError(new DatabaseError('Transaction became inactive', error, 'transaction'));
            this.showUserError('Database operation timed out. Please try again.');
            return true;
        }
        
        if (error.name === 'QuotaExceededError') {
            this.logError(new StorageError('Storage quota exceeded', error, 'IndexedDB'));
            this.showUserError('Storage space is full. Please clear some data.');
            return true;
        }

        // Generic database error
        this.logError(new DatabaseError('Database operation failed', error));
        this.showUserError('Database error occurred. Please try again.');
        return true;
    }

    // Error boundary wrapper for async operations
    async withErrorBoundary(operation, context = 'Operation', options = {}) {
        try {
            const result = await operation();
            return { success: true, result };
        } catch (error) {
            this.logError(error, context);
            
            if (options.showUserError !== false) {
                this.showUserError(options.userMessage || 'An error occurred. Please try again.');
            }
            
            if (options.rethrow) {
                throw error;
            }
            
            return { success: false, error };
        }
    }

    // Error boundary wrapper for synchronous operations
    withSyncErrorBoundary(operation, context = 'Operation', options = {}) {
        try {
            const result = operation();
            return { success: true, result };
        } catch (error) {
            this.logError(error, context);
            
            if (options.showUserError !== false) {
                this.showUserError(options.userMessage || 'An error occurred. Please try again.');
            }
            
            if (options.rethrow) {
                throw error;
            }
            
            return { success: false, error };
        }
    }

    // Show user-friendly error messages
    showUserError(message, severity = 'error') {
        console.warn(`User error (${severity}):`, message);
        
        // Try to find existing error display element
        let errorElement = document.getElementById('error-message');
        
        if (!errorElement) {
            // Create error display element if it doesn't exist
            errorElement = document.createElement('div');
            errorElement.id = 'error-message';
            errorElement.className = 'error-toast';
            errorElement.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f44336;
                color: white;
                padding: 12px 16px;
                border-radius: 4px;
                z-index: 10000;
                max-width: 400px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                font-family: Arial, sans-serif;
                font-size: 14px;
                line-height: 1.4;
            `;
            document.body.appendChild(errorElement);
        }

        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }, 5000);
    }

    // Validation helpers
    validateRequired(value, fieldName) {
        if (value === null || value === undefined || value === '') {
            throw new ValidationError(`${fieldName} is required`, fieldName, value);
        }
    }

    validateNumber(value, fieldName, min = null, max = null) {
        if (isNaN(value) || !isFinite(value)) {
            throw new ValidationError(`${fieldName} must be a valid number`, fieldName, value);
        }
        
        if (min !== null && value < min) {
            throw new ValidationError(`${fieldName} must be at least ${min}`, fieldName, value);
        }
        
        if (max !== null && value > max) {
            throw new ValidationError(`${fieldName} must be at most ${max}`, fieldName, value);
        }
    }

    validateString(value, fieldName, minLength = null, maxLength = null) {
        if (typeof value !== 'string') {
            throw new ValidationError(`${fieldName} must be a string`, fieldName, value);
        }
        
        if (minLength !== null && value.length < minLength) {
            throw new ValidationError(`${fieldName} must be at least ${minLength} characters long`, fieldName, value);
        }
        
        if (maxLength !== null && value.length > maxLength) {
            throw new ValidationError(`${fieldName} must be at most ${maxLength} characters long`, fieldName, value);
        }
    }

    // Recovery strategies
    async retryOperation(operation, maxRetries = 3, delay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                if (i === maxRetries - 1) {
                    throw error;
                }
                
                console.warn(`Operation failed (attempt ${i + 1}/${maxRetries}):`, error.message);
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
            }
        }
    }

    // Get error statistics
    getErrorStats() {
        const stats = {
            totalErrors: this.errorLog.length,
            errorsByType: {},
            errorsByContext: {},
            recentErrors: this.errorLog.slice(-10)
        };

        this.errorLog.forEach(entry => {
            const errorType = entry.error.name;
            const context = entry.context;
            
            stats.errorsByType[errorType] = (stats.errorsByType[errorType] || 0) + 1;
            stats.errorsByContext[context] = (stats.errorsByContext[context] || 0) + 1;
        });

        return stats;
    }

    // Clear error log
    clearErrorLog() {
        this.errorLog = [];
    }
}

// Create global error handler instance
const errorHandler = new ErrorHandler();

// Export for use in other modules
window.ErrorHandler = ErrorHandler;
window.errorHandler = errorHandler;
window.FishLogError = FishLogError;
window.DatabaseError = DatabaseError;
window.StorageError = StorageError;
window.CalculationError = CalculationError;
window.ValidationError = ValidationError;
window.NetworkError = NetworkError;

console.log('Advanced Error Handler initialized');
