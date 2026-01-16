-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TimeBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "activity" TEXT NOT NULL DEFAULT '',
    "dayId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TimeBlock_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TimeBlock" ("activity", "createdAt", "dayId", "done", "endTime", "id", "startTime", "updatedAt") SELECT "activity", "createdAt", "dayId", "done", "endTime", "id", "startTime", "updatedAt" FROM "TimeBlock";
DROP TABLE "TimeBlock";
ALTER TABLE "new_TimeBlock" RENAME TO "TimeBlock";
CREATE INDEX "TimeBlock_dayId_idx" ON "TimeBlock"("dayId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
