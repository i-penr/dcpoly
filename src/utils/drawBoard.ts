import { AttachmentBuilder } from "discord.js";
import Canvas from '@napi-rs/canvas';
import path from "node:path";

export async function drawBoard() {
    const canvas = Canvas.createCanvas(1137, 1137);
    const context = canvas.getContext('2d');
    const background = await Canvas.loadImage(path.join(__dirname, '..', '..', 'assets', 'board.png'));
    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    return new AttachmentBuilder(await canvas.encode('png'), { name: 'board.png' });
}