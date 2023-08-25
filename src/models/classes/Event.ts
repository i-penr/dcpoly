import { Client } from "discord.js";

export default class Event {
    name: string;
    once: boolean;
    execute: (p: any) => void;

    constructor(n: string, o: boolean, e: (p?: any) => void) {
        this.name = n;
        this.once = o;
        this.execute = e;
    }
}