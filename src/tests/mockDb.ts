import { sequelize as baseSequelize } from "../db/db";
import { setupDatabaseAssociations } from "../db/db_creation/db_creation";
import { setupFakeTestGame } from "./setupFakeTestGame";

export async function mockDb() {
    const sequelize = Object.assign(baseSequelize);
    //sequelize.options.logging = console.log;
    sequelize.options.storage = ':memory:';

    await sequelize.sync({ force: true });
    setupDatabaseAssociations();
    await setupFakeTestGame();

    return sequelize;
}
