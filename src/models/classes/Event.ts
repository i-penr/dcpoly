export default class Event {
    name: string;
    once: boolean;
    execute: (p: unknown) => void;

    constructor(n: string, o: boolean, e: (p?: unknown) => void) {
        this.name = n;
        this.once = o;
        this.execute = e;
    }
}