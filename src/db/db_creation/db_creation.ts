import { User } from "../tables/User";
import { setupTestGame } from "../../tests/setupRealTestGame";
import { sequelize } from "../db";
import { Game } from "../tables/Game";
import { Player } from "../tables/Player";
import { Turn } from "../tables/Turn";
import { PropertyGame } from "../tables/PropertyGame";

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

    // Property-Player 1:N
    Player.hasMany(PropertyGame, {
        foreignKey: 'ownerId',
        sourceKey: 'userId'
    });
    PropertyGame.belongsTo(Player, {
        foreignKey: 'ownerId',
        targetKey: 'userId'
    });

    // Property-Game 1:N
    Game.hasMany(PropertyGame, {
        foreignKey: 'gameId'
    });
    PropertyGame.belongsTo(Game, {
        foreignKey: 'gameId'
    });
}
