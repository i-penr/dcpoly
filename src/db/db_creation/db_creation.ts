import { User } from "../tables/User";
import path from "path";
import { setupTestGame } from "../../utils/tests/setupTestGame";
import { sequelize } from "../db";
import { Game } from "../tables/Game";
import { Player } from "../tables/Player";
import { Square } from "../tables/Square";
import { Turn } from "../tables/Turn";
import fs from 'node:fs';
import { Property } from "../tables/Property";


export async function setupDatabase() {
    await sequelize.sync({ force: true });
    setupDatabaseAssociations();

    await Square.bulkCreate(JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'squares.json'), 'utf-8')));

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

    // Property-Player 1:N
    Player.hasMany(Property, {
        foreignKey: 'owner'
    });
    Property.hasOne(Player, {
        foreignKey: 'owner'
    });

    // Property-Game 1:N
    Game.hasMany(Property, {
        foreignKey: 'gameId'
    });
    Property.hasOne(Game, {
        foreignKey: 'gameId'
    });
}
