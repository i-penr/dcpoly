import { Player } from "../../db/tables/Player";

export async function goToJail(player: Player) {
    await player.update({ current_square: 10, jailStatus: 3 });
    await player.update({ doubleRollStreak: 0 });
}