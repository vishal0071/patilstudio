-- Location pages: /wedding-photographer/<slug> for Pune localities, Maharashtra cities
-- and the region.
--
-- Additive only — one new table and one new enum, nothing existing is touched, so this
-- applies to the live database while it is serving. Rows arrive unpublished; see the
-- note on the model for why an area with thin copy is treated as non-existent.

-- CreateEnum
CREATE TYPE "AreaTier" AS ENUM ('NEIGHBOURHOOD', 'CITY', 'REGION');

-- CreateTable
CREATE TABLE "ServiceArea" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "AreaTier" NOT NULL DEFAULT 'NEIGHBOURHOOD',
    "parent" TEXT,
    "intro" TEXT NOT NULL DEFAULT '',
    "venues" TEXT[],
    "notes" TEXT NOT NULL DEFAULT '',
    "seoTitle" TEXT NOT NULL DEFAULT '',
    "seoDescription" TEXT NOT NULL DEFAULT '',
    "imagePath" TEXT,
    "imageAlt" TEXT,
    "imageBrief" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceArea_slug_key" ON "ServiceArea"("slug");

-- CreateIndex
CREATE INDEX "ServiceArea_published_tier_sortOrder_idx" ON "ServiceArea"("published", "tier", "sortOrder");

