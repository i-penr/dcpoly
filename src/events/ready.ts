import { Events } from "discord.js";
import Event from "../models/classes/Event";
import { User } from "../db/tables/User";
import { Game } from "../db/tables/Game";
import { Players } from "../db/tables/Player";
import { sequelize } from "../db/db";

const event = new Event(Events.ClientReady, true, (client) => {
    setupDatabase();

    console.log(`Connected. Logged in as ${client.user!.tag}`);
});

function setupDatabase() {
    sequelize.sync({ force: true });
    
    setupDatabaseAssociations();
}

function setupDatabaseAssociations() {
    User.belongsToMany(Game, { through: Players });
    Game.belongsToMany(User, { through: Players });
}

export { event };