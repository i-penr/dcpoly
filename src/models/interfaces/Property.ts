import { ColorResolvable } from "discord.js";

export default interface Property {
    id: number;
    name: string;
    price: number;
    mortgage: number;
    color: ColorResolvable;
    rentProg: Array<number>;
    buildingCost: number;
}