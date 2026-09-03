import { applyPostgresMigrations } from "./migrations.js";
import { NodePostgresDatabase } from "./node-postgres-database.js";

const DEV_RESET_GATE = "PRAXIS_ALLOW_DEV_RESTAURANT_STATE_RESET";

function requireLocalDevelopmentDatabase(connectionString: string): void {
  const url = new URL(connectionString);
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname)) {
    throw new Error("Restaurant development-state reset only permits a localhost DATABASE_URL");
  }
}

async function resetIncompatibleRestaurantDevelopmentState(): Promise<void> {
  if (process.env[DEV_RESET_GATE] !== "1") {
    throw new Error(`Set ${DEV_RESET_GATE}=1 to reset incompatible restaurant-state@7/@8 development data`);
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for Restaurant development-state reset");
  requireLocalDevelopmentDatabase(connectionString);

  const database = new NodePostgresDatabase({ connectionString });
  try {
    await applyPostgresMigrations(database);
    const deleted = await database.transaction((transaction) => transaction.query<{ id: string }>(
      `DELETE FROM tasks
        WHERE task_type = 'restaurant.booking'
        AND domain_state_schema_version IN ('7', '8', '9')
        RETURNING id`,
    ));
    console.log(`Reset ${deleted.affectedRows} incompatible restaurant-state@7/@8 development task(s).`);
  } finally {
    await database.close();
  }
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  void resetIncompatibleRestaurantDevelopmentState().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
