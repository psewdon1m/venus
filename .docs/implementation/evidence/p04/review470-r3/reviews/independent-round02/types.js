export class EngineError extends Error {
    code;
    constructor(code) {
        super(code);
        this.code = code;
    }
}
export function assertEngine(condition, code) { if (!condition)
    throw new EngineError(code); }
