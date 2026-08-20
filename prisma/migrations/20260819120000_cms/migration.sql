-- The CMS tables, plus the four columns the fuller enquiry form adds.
--
-- Generated with `migrate diff` against the previous schema and hand-checked, the
-- same way GalleryFlow does it. Additive only: every new column is nullable or has
-- a default, so this applies to a live database with rows in Inquiry without a
-- rewrite. `services TEXT[]` defaults to an empty array in Postgres, which is what
-- an existing enquiry with no ticked services should read as.

-- CreateEnum
CREATE TYPE "PortfolioCategory" AS ENUM ('WEDDING', 'PRE_WEDDING', 'ENGAGEMENT', 'MATERNITY', 'BABY', 'EVENTS', 'FILMS');

-- CreateEnum
CREATE TYPE "VideoProvider" AS ENUM ('YOUTUBE', 'VIMEO', 'MP4');

-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "budget" TEXT,
ADD COLUMN     "eventCount" TEXT,
ADD COLUMN     "eventLocation" TEXT,
ADD COLUMN     "services" TEXT[];

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "blurb" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "inclusions" TEXT[],
    "imagePath" TEXT,
    "imageAlt" TEXT,
    "imageBrief" TEXT,
    "imageRatio" TEXT NOT NULL DEFAULT 'landscape',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioImage" (
    "id" UUID NOT NULL,
    "category" "PortfolioCategory" NOT NULL,
    "imagePath" TEXT,
    "imageAlt" TEXT,
    "imageBrief" TEXT,
    "imageRatio" TEXT NOT NULL DEFAULT 'portrait',
    "story" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceLabel" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "badge" TEXT,
    "features" TEXT[],
    "ctaLabel" TEXT NOT NULL DEFAULT 'Enquire Now',
    "pricePending" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComparisonRow" (
    "id" UUID NOT NULL,
    "feature" TEXT NOT NULL,
    "essential" TEXT NOT NULL DEFAULT '—',
    "signature" TEXT NOT NULL DEFAULT '—',
    "luxury" TEXT NOT NULL DEFAULT '—',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComparisonRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" UUID NOT NULL,
    "quote" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "eventLabel" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "isPlaceholder" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryChapter" (
    "id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imagePath" TEXT,
    "imageAlt" TEXT,
    "imageBrief" TEXT,
    "imageRatio" TEXT NOT NULL DEFAULT 'portrait',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryChapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Film" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "provider" "VideoProvider" NOT NULL DEFAULT 'YOUTUBE',
    "videoRef" TEXT NOT NULL DEFAULT '',
    "imagePath" TEXT,
    "imageAlt" TEXT,
    "imageBrief" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Film_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqItem" (
    "id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramItem" (
    "id" UUID NOT NULL,
    "imagePath" TEXT,
    "imageAlt" TEXT,
    "imageBrief" TEXT,
    "permalink" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_published_sortOrder_idx" ON "Service"("published", "sortOrder");

-- CreateIndex
CREATE INDEX "PortfolioImage_published_category_sortOrder_idx" ON "PortfolioImage"("published", "category", "sortOrder");

-- CreateIndex
CREATE INDEX "PortfolioImage_published_featured_sortOrder_idx" ON "PortfolioImage"("published", "featured", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Package_slug_key" ON "Package"("slug");

-- CreateIndex
CREATE INDEX "Package_published_sortOrder_idx" ON "Package"("published", "sortOrder");

-- CreateIndex
CREATE INDEX "ComparisonRow_published_sortOrder_idx" ON "ComparisonRow"("published", "sortOrder");

-- CreateIndex
CREATE INDEX "Testimonial_published_sortOrder_idx" ON "Testimonial"("published", "sortOrder");

-- CreateIndex
CREATE INDEX "StoryChapter_published_sortOrder_idx" ON "StoryChapter"("published", "sortOrder");

-- CreateIndex
CREATE INDEX "Film_published_sortOrder_idx" ON "Film"("published", "sortOrder");

-- CreateIndex
CREATE INDEX "FaqItem_published_sortOrder_idx" ON "FaqItem"("published", "sortOrder");

-- CreateIndex
CREATE INDEX "InstagramItem_published_sortOrder_idx" ON "InstagramItem"("published", "sortOrder");

