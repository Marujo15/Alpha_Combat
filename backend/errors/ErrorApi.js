export class ErrorApi extends Error {
    status;

    constructor({ message, status }) {
        super(message);
        this.status = status;
        this.name = "ErrorApi";
    }
}