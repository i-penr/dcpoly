import { AttachmentBuilder } from 'discord.js';
import Canvas from '@napi-rs/canvas';
import path from 'node:path';
import { Player } from '../db/tables/Player';
import Client from '../models/classes/Client';
import { PropertyGame } from '../db/tables/PropertyGame';

const TOKEN_SIZE = 33;
const BOARD_SIZE = 1173;
const SQUARE_WIDTH = 90;
const STARTING_POSITION = BOARD_SIZE - 137;

export async function drawBoard(players: Player[]) {
	const canvas = Canvas.createCanvas(BOARD_SIZE, BOARD_SIZE);
	const context = canvas.getContext('2d');
	const background = await Canvas.loadImage(
		path.join(__dirname, '..', '..', 'assets', 'board.png'),
	);
	context.drawImage(background, 0, 0, canvas.width, canvas.height);

	await drawBuildings(players[0]!.gameId, context);

	for (let i = 0; i < 40; i++) {
		const dcUser = await Client.getInstance().users.fetch('220525113404030987');
		const avatarUrl = dcUser.displayAvatarURL({ extension: 'png' });

		const avatar = await Canvas.loadImage(avatarUrl);
		await drawToken(context, avatar, i);
	}

	return new AttachmentBuilder(await canvas.encode('png'), { name: 'board.png' });
}

async function drawToken(context: Canvas.SKRSContext2D, avatar: Canvas.Image, square: number) {
	const coords = getCoordsFromSquare(square, TOKEN_SIZE);
	context.save();
	circle(context, coords);
	context.drawImage(avatar, coords.x, coords.y, TOKEN_SIZE, TOKEN_SIZE);
	context.restore();
}

async function drawBuildings(gameId: number, context: Canvas.SKRSContext2D) {
	const properties = await PropertyGame.findAll({ where: { gameId: gameId } });

	properties.forEach(async (property) => {
		const houseOrHotel = property.numBuildings === 5 ? 'hotel' : 'house';
		const buildingIcon = await Canvas.loadImage(path.join(__dirname, '..', '..', 'assets', `${houseOrHotel}-icon.png`));
		const coords = getCoordsFromSquare(property.id, buildingIcon.height, new Coordinates(0, 75));

		context.drawImage(buildingIcon, coords.x, coords.y, buildingIcon.width, buildingIcon.height);
	})
}

function circle(context: Canvas.SKRSContext2D, coords: Coordinates) {
	context.strokeStyle = 'green';
	context.lineWidth = 3;
	context.beginPath();
	context.arc(coords.x + TOKEN_SIZE / 2, coords.y + TOKEN_SIZE / 2, TOKEN_SIZE / 2, 0, Math.PI * 2);
	context.stroke();
	context.clip();
}

/**
 * Offset is considering the first row (horizontal: x, vertical: y)
 * So in the first row, it is the same, in the second row, the y becomes the x and viceversa
 * */
function getCoordsFromSquare(square: number, imageSize: number, offset?: Coordinates) {
	const coords = new Coordinates(
		STARTING_POSITION - imageSize / 2,
		STARTING_POSITION - imageSize / 2,
	);

	offset = offset ?? new Coordinates(0, 0);

	if (square < 10) {
		coords.y = BOARD_SIZE - 100 - offset.y;
		coords.x -= SQUARE_WIDTH * square;
	} else if (square < 20) {
		coords.x = 100 + offset.y - imageSize;
		coords.y -= SQUARE_WIDTH * (square % 10);
	} else if (square < 30) {
		coords.y = 100 + offset.y - imageSize;
		coords.x -= SQUARE_WIDTH * (10 - (square % 10));
	} else {
		coords.x = BOARD_SIZE - 100 - offset.y;
		coords.y -= SQUARE_WIDTH * (10 - (square % 10));
	}

	return coords;
}

class Coordinates {
	x: number;
	y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}
}
