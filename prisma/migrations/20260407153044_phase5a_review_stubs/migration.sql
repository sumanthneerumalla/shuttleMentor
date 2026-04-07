-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "maxBookingHours" INTEGER DEFAULT 2;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "revenueCategoryId" TEXT,
ADD COLUMN     "taxRateId" TEXT;

-- AlterTable
ALTER TABLE "ProductCategory" ADD COLUMN     "revenueCategoryId" TEXT,
ADD COLUMN     "taxRateId" TEXT;

-- CreateTable
CREATE TABLE "RevenueCategory" (
    "revenueCategoryId" TEXT NOT NULL,
    "clubShortName" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    "parentId" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueCategory_pkey" PRIMARY KEY ("revenueCategoryId")
);

-- CreateTable
CREATE TABLE "TaxRate" (
    "taxRateId" TEXT NOT NULL,
    "clubShortName" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxRate_pkey" PRIMARY KEY ("taxRateId")
);

-- CreateIndex
CREATE INDEX "RevenueCategory_clubShortName_idx" ON "RevenueCategory"("clubShortName");

-- CreateIndex
CREATE INDEX "RevenueCategory_parentId_idx" ON "RevenueCategory"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueCategory_clubShortName_code_key" ON "RevenueCategory"("clubShortName", "code");

-- CreateIndex
CREATE INDEX "TaxRate_clubShortName_idx" ON "TaxRate"("clubShortName");

-- CreateIndex
CREATE UNIQUE INDEX "TaxRate_clubShortName_code_key" ON "TaxRate"("clubShortName", "code");

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_revenueCategoryId_fkey" FOREIGN KEY ("revenueCategoryId") REFERENCES "RevenueCategory"("revenueCategoryId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_taxRateId_fkey" FOREIGN KEY ("taxRateId") REFERENCES "TaxRate"("taxRateId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueCategory" ADD CONSTRAINT "RevenueCategory_clubShortName_fkey" FOREIGN KEY ("clubShortName") REFERENCES "Club"("clubShortName") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueCategory" ADD CONSTRAINT "RevenueCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "RevenueCategory"("revenueCategoryId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxRate" ADD CONSTRAINT "TaxRate_clubShortName_fkey" FOREIGN KEY ("clubShortName") REFERENCES "Club"("clubShortName") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_revenueCategoryId_fkey" FOREIGN KEY ("revenueCategoryId") REFERENCES "RevenueCategory"("revenueCategoryId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_taxRateId_fkey" FOREIGN KEY ("taxRateId") REFERENCES "TaxRate"("taxRateId") ON DELETE SET NULL ON UPDATE CASCADE;
