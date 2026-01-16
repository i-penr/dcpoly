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
	await drawPlayerTokens(players, context);

	return new AttachmentBuilder(await canvas.encode('png'), { name: 'board.png' });
}

export async function drawCroppedBoardBySquare(
  square: number,
  players: Player[]
): Promise<AttachmentBuilder> {
  const boardAttachment = await drawBoard(players);
  const boardBuffer = boardAttachment.attachment as Buffer;

  const CROPPED_SIZE = 250;
  const croppedCanvas = Canvas.createCanvas(CROPPED_SIZE, CROPPED_SIZE);
  const croppedCtx = croppedCanvas.getContext('2d');

  const boardImg = await Canvas.loadImage(boardBuffer);

  const { x, y } = getCoordsFromSquare(square, TOKEN_SIZE);

  croppedCtx.drawImage(
    boardImg,
    x - CROPPED_SIZE / 2 + 20,
    y - CROPPED_SIZE / 2 + 20,
    CROPPED_SIZE,
    CROPPED_SIZE,
    0,
    0,
    CROPPED_SIZE,
    CROPPED_SIZE
  );

  const croppedPng = await croppedCanvas.encode('png');
  return new AttachmentBuilder(croppedPng, { name: 'square.png' });
}

async function drawPlayerTokens(players: Player[], context: Canvas.SKRSContext2D) {
	const grouped: Record<number, string[]> = {};

	players.forEach(player => {
		if (!grouped[player.current_square]) {
			grouped[player.current_square] = [];
		} 
		grouped[player.current_square]!.push(player.userId);
	});

	for (const [square, playerIds] of Object.entries(grouped)) {
		for (let i = 0; i < playerIds.length; i++) {
			const dcUser = await Client.getInstance().users.fetch(playerIds[i]!);
			const avatarUrl = dcUser.displayAvatarURL({ extension: 'png' });
			const avatar = await Canvas.loadImage(avatarUrl);
			const offset = new Coordinates(i % 2 * 11, (playerIds.length / 2) + 11*i - 11*playerIds.length/2);
			const coords = getCoordsFromSquare(parseInt(square), TOKEN_SIZE, offset);

			await circleToken(context, avatar, coords);
		};
	}
}

async function circleToken(context: Canvas.SKRSContext2D, avatar: Canvas.Image, coords: Coordinates) {
	context.save();
	circle(context, coords);
	context.drawImage(avatar, coords.x, coords.y, TOKEN_SIZE, TOKEN_SIZE);
	context.restore();
}

async function drawBuildings(gameId: number, context: Canvas.SKRSContext2D) {
	const properties = await PropertyGame.findAll({ where: { gameId: gameId } });

	properties.forEach(async (property) => {
		const actualNumBuldings = property.numBuildings === 5 ? 1 : property.numBuildings;
		const houseOrHotel = property.numBuildings === 5 ? 'hotel' : 'house';
		const buildingIcon = await Canvas.loadImage(path.join(__dirname, '..', '..', 'assets', `${houseOrHotel}-icon.png`));

		for (let i = 0; i < actualNumBuldings; i++) {
			// Kind of magic formula... Basically, it centers the whole building row.
			const xPosition = -(actualNumBuldings - 1) * 10 + i * 22 - 2;
			const coords = getCoordsFromSquare(property.id, buildingIcon.height, new Coordinates(xPosition, 75));
			context.drawImage(buildingIcon, coords.x, coords.y, buildingIcon.width, buildingIcon.height);
		}
	});
}

function circle(context: Canvas.SKRSContext2D, coords: Coordinates) {
	context.strokeStyle = 'purple';
	context.lineWidth = 5;
	context.beginPath();
	context.arc(coords.x + TOKEN_SIZE / 2, coords.y + TOKEN_SIZE / 2, TOKEN_SIZE / 2, 0, Math.PI * 2);
	context.stroke();
	context.clip();
}

/**
 * Offset is considering the first row (horizontal: x, vertical: y)
 * So in the first row, it is the same, in the second row, the y becomes the x and viceversa
 * 
 * The "base position" is STARTING_POSITION, which is the position of the token in the first square.
 * 
 * This is good for positioning multiple images in the same square, or adding the offsest in
 * buildings.
 * */
function getCoordsFromSquare(square: number, imageSize: number, offset?: Coordinates) {
	const coords = new Coordinates(
		STARTING_POSITION - imageSize / 2,
		STARTING_POSITION - imageSize / 2,
	);

	offset = offset ?? new Coordinates(0, 0);

	if (square < 10) {
		coords.y = BOARD_SIZE - 100 - offset.y;
		coords.x -= SQUARE_WIDTH * square - offset.x;
	} else if (square < 20) {
		coords.x = 100 + offset.y - imageSize;
		coords.y -= SQUARE_WIDTH * (square % 10) - offset.x;
	} else if (square < 30) {
		coords.y = 100 + offset.y - imageSize;
		coords.x -= SQUARE_WIDTH * (10 - (square % 10)) - offset.x;
	} else {
		coords.x = BOARD_SIZE - 100 - offset.y;
		coords.y -= SQUARE_WIDTH * (10 - (square % 10)) - offset.x;
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
