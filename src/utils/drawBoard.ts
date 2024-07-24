import { AttachmentBuilder, CommandInteraction } from "discord.js";
import Canvas from '@napi-rs/canvas';
import path from "node:path";
import { request } from "undici";

const TOKEN_SIZE = 33;
const BOARD_SIZE = 1173;
const SQUARE_WIDTH = 90;
const TOKEN_HEIGHT_POSITION = 153;

export async function drawBoard(interaction: CommandInteraction) {
    const canvas = Canvas.createCanvas(BOARD_SIZE, BOARD_SIZE);
    const context = canvas.getContext('2d');
    const background = await Canvas.loadImage(path.join(__dirname, '..', '..', 'assets', 'board.png'));
    context.drawImage(background, 0, 0, canvas.width, canvas.height);
    await drawTokens(context, interaction);

    return new AttachmentBuilder(await canvas.encode('png'), { name: 'board.png' });
}

async function drawTokens(context: Canvas.SKRSContext2D, interaction: CommandInteraction) {
    const { body } = await request(interaction.user.displayAvatarURL({ extension: 'jpg' }));
    const avatar = await Canvas.loadImage(await body.arrayBuffer());

    for (let i = 0; i < 40; i++) {
        const coords = getCoords(i);
        context.save();
        circle(context, coords);
        context.drawImage(avatar, coords.x, coords.y, TOKEN_SIZE, TOKEN_SIZE);
        context.restore();
    }

}

function getCoords(square: number) {
    // Bottom-right corner
    const coords = new Coordinates(BOARD_SIZE - TOKEN_HEIGHT_POSITION, TOKEN_HEIGHT_POSITION - TOKEN_SIZE);

    if (square >= 0 && square <= 10) {
        coords.y = BOARD_SIZE - 100;
        coords.x -= SQUARE_WIDTH * square;
    } else if (square > 10 && square <= 20) {
        coords.x = 100 - TOKEN_SIZE;
        coords.y += SQUARE_WIDTH * (square%10);
    } else if (square > 20 && square < 30) {
        coords.y = 100 - TOKEN_SIZE;
        coords.x -= SQUARE_WIDTH * (square%10);
    } else {
        coords.x = BOARD_SIZE - 100;
        coords.y += SQUARE_WIDTH * (square%10);
    }

    return coords;
}

function circle(context: Canvas.SKRSContext2D, coords: Coordinates) {
    context.strokeStyle = "green";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(coords.x + TOKEN_SIZE/2, coords.y + TOKEN_SIZE/2, TOKEN_SIZE/2, 0, Math.PI * 2);
    context.stroke();
    context.clip();
}

class Coordinates {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}