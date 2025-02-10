import { beforeEach, describe, it } from "bun:test";
import { mockDb } from "../mockDb";

describe('/property command tests', async () => {
    let spy: any, sequelize: any;

    beforeEach(async () => {
        sequelize = await mockDb();
    });

    it('should error (property not found)', async () => {
        
    })
});