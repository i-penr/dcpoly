import { User } from "../tables/User";
import { setupTestGame } from "../../tests/setupRealTestGame";
import { sequelize } from "../db";
import { Game } from "../tables/Game";
import { Player } from "../tables/Player";
import { Square } from "../tables/Square";
import { Turn } from "../tables/Turn";
import { Property } from "../tables/Property";


export async function setupDatabase() {
    await sequelize.sync({ force: true });
    setupDatabaseAssociations();

    // tests
    await setupTestGame();
}

export function setupDatabaseAssociations() {
    // User-Player 1:N
    User.hasMany(Player, {
        foreignKey: {
            allowNull: false
        }
    });
    Player.belongsTo(User, { foreignKey: 'userId' });

    // Game-Player 1:N
    Game.hasMany(Player, {
        foreignKey: {
            allowNull: false
        }
    })
    Player.belongsTo(Game, { foreignKey: 'gameId' });

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
    Property.belongsTo(Player, {
        foreignKey: 'owner'
    });
    Player.hasMany(Property, {
        foreignKey: 'gameId'
    });
    Property.belongsTo(Player, {
        foreignKey: 'gameId'
    });

    // Property-Game 1:N
    Game.hasMany(Property, {
        foreignKey: 'gameId'
    });
    Property.belongsTo(Game, {
        foreignKey: 'gameId'
    });
}
