-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'product',
    "barcode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("barcode", "code", "createdAt", "description", "id", "price", "updatedAt") SELECT "barcode", "code", "createdAt", "description", "id", "price", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
