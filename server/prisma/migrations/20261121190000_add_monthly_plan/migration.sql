-- CreateTable
CREATE TABLE "MonthlyPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "intentions" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyPlan_year_month_key" ON "MonthlyPlan"("year", "month");
