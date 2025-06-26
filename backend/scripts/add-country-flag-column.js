import sequelize from "../database/db.js";
import { DataTypes } from "sequelize";

(async () => {
    const queryInterface = sequelize.getQueryInterface();
    try {
        await queryInterface.addColumn("users", "country_flag", {
            type: DataTypes.STRING(4),
            allowNull: true,
            comment: "Unicode emoji flag of the country",
        });
        console.log("✅ Added country_flag column to users table");
    } catch (error) {
        console.error("❌ Failed to add country_flag column:", error);
    } finally {
        await sequelize.close();
    }
})(); 