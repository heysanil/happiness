/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * @class HappinessError
 * A generic error class that also adds an HTTP status code
 */
export class HappinessError extends Error {
    constructor(
        /** The message to return */
        public message: string,
        /** The HTTP status code */
        public status: number = 500,
        /** The debug information to return */
        public debug?: Record<string, any>,
        /** The name of the error; defaults to `HappinessError` */
        public name: string = 'HappinessError',
    ) {
        super(message);
        this.name = name;
        this.status = status;
        this.debug = debug;
    }
}
