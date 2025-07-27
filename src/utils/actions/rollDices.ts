const DICE_SIZE = 6;

export function rollDices() {
	const result1 = rollDice();
	const result2 = rollDice();

	return { result1, result2 };
}

function rollDice() {
	return Math.floor(Math.random() * DICE_SIZE) + 1;
}
