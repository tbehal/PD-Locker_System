-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bookings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cycle_id" INTEGER NOT NULL,
    "station_id" INTEGER NOT NULL,
    "shift" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "trainee_name" TEXT NOT NULL,
    "contact_id" TEXT,
    "booked_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bookings_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "cycles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bookings_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_bookings" ("booked_at", "contact_id", "cycle_id", "id", "shift", "station_id", "trainee_name", "week") SELECT "booked_at", "contact_id", "cycle_id", "id", "shift", "station_id", "trainee_name", "week" FROM "bookings";
DROP TABLE "bookings";
ALTER TABLE "new_bookings" RENAME TO "bookings";
CREATE INDEX "bookings_cycle_id_shift_week_idx" ON "bookings"("cycle_id", "shift", "week");
CREATE INDEX "bookings_contact_id_idx" ON "bookings"("contact_id");
CREATE INDEX "bookings_cycle_id_station_id_idx" ON "bookings"("cycle_id", "station_id");
CREATE UNIQUE INDEX "bookings_cycle_id_station_id_shift_week_key" ON "bookings"("cycle_id", "station_id", "shift", "week");
CREATE TABLE "new_cycle_weeks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cycle_id" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "start_date" DATETIME,
    "end_date" DATETIME,
    CONSTRAINT "cycle_weeks_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "cycles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_cycle_weeks" ("cycle_id", "end_date", "id", "start_date", "week") SELECT "cycle_id", "end_date", "id", "start_date", "week" FROM "cycle_weeks";
DROP TABLE "cycle_weeks";
ALTER TABLE "new_cycle_weeks" RENAME TO "cycle_weeks";
CREATE INDEX "cycle_weeks_cycle_id_idx" ON "cycle_weeks"("cycle_id");
CREATE UNIQUE INDEX "cycle_weeks_cycle_id_week_key" ON "cycle_weeks"("cycle_id", "week");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
