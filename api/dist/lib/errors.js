export class AppError extends Error {
    status;
    code;
    constructor(status, message, code = 'APP_ERROR') {
        super(message);
        this.status = status;
        this.code = code;
    }
}
