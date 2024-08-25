import { Events } from "discord.js";
import Event from "../models/classes/Event";
import { User } from "../db/tables/User";
import { Game } from "../db/tables/Game";
import { sequelize } from "../db/db";
import { Player } from "../db/tables/Player";
import { Turn } from "../db/tables/Turn";
import { Square } from "../db/tables/Square";
import fs from "fs";
import path from "path";
import { setupTestGame } from "../utils/tests/setupTestGame";

const event = new Event(Events.ClientReady, true, async (client) => {
    try {
        await setupDatabase();
        console.log(`Connected. Logged in as ${client.user!.tag}`);
    } catch (err: any) {
        console.error('There was an error with the ClientReady event: ', { err });
    }
});

async function setupDatabase() {
    await sequelize.sync({ force: true });
    setupDatabaseAssociations();

    await Square.bulkCreate(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'db', 'data', 'squares.json'), 'utf-8')));

    // tests
    await setupTestGame();
}

function setupDatabaseAssociations() {
    // User-Player 1:N
    User.hasMany(Player, {
        foreignKey: {
            allowNull: false
        }
    });
    Player.belongsTo(User, { foreignKey: 'userId', targetKey: 'id' });

    // Game-Player 1:N
    Game.hasMany(Player, {
        foreignKey: {
            allowNull: false
        }
    })
    Player.belongsTo(Game, { foreignKey: 'gameId', targetKey: 'id' });

    // Game-Turn 1:1
    Game.hasOne(Turn);
    Turn.belongsTo(Game);

    // Player-Turn 1:1
    Player.hasOne(Turn, {
        foreignKey: 'userId'
    });
    Turn.belongsTo(Player, {
        foreignKey: 'userId'
    });

    // Player-Square N:1
    Player.belongsTo(Square, {
        foreignKey: 'current_square'
    });
    Square.hasMany(Player, {
        foreignKey: 'current_square'
    });
}

export { event };