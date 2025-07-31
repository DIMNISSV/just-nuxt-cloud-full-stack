-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."AssetStatus" AS ENUM ('PENDING', 'PROCESSING', 'AVAILABLE', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."AssetType" AS ENUM ('MEDIA_SOURCE', 'PERSONAL');

-- CreateEnum
CREATE TYPE "public"."StreamType" AS ENUM ('VIDEO', 'AUDIO', 'SUBTITLE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."file_assets" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" "public"."AssetStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "assetType" "public"."AssetType" NOT NULL,

    CONSTRAINT "file_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."media_file_meta" (
    "id" SERIAL NOT NULL,
    "assetId" INTEGER NOT NULL,
    "linkedEpisodeId" INTEGER,

    CONSTRAINT "media_file_meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."personal_file_meta" (
    "id" SERIAL NOT NULL,
    "assetId" INTEGER NOT NULL,
    "folderId" INTEGER,

    CONSTRAINT "personal_file_meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."personal_folders" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "parentId" INTEGER,

    CONSTRAINT "personal_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."media_streams" (
    "id" SERIAL NOT NULL,
    "type" "public"."StreamType" NOT NULL,
    "filePath" TEXT NOT NULL,
    "qualityLabel" TEXT NOT NULL,
    "codecInfo" TEXT,
    "language" TEXT,
    "sourceMediaFileId" INTEGER NOT NULL,

    CONSTRAINT "media_streams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."compositions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "audioOffsetMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "episodeId" INTEGER NOT NULL,
    "videoStreamId" INTEGER NOT NULL,
    "audioStreamId" INTEGER NOT NULL,
    "subtitleStreamId" INTEGER,
    "translatorId" INTEGER,

    CONSTRAINT "compositions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."translators" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "translators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."series" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "posterUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "externalIds" JSONB,

    CONSTRAINT "series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."seasons" (
    "id" SERIAL NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seriesId" INTEGER NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."episodes" (
    "id" SERIAL NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seasonId" INTEGER NOT NULL,
    "externalIds" JSONB,

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "file_assets_uuid_key" ON "public"."file_assets"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "file_assets_s3Key_key" ON "public"."file_assets"("s3Key");

-- CreateIndex
CREATE UNIQUE INDEX "media_file_meta_assetId_key" ON "public"."media_file_meta"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "personal_file_meta_assetId_key" ON "public"."personal_file_meta"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "personal_folders_userId_parentId_name_key" ON "public"."personal_folders"("userId", "parentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "translators_name_key" ON "public"."translators"("name");

-- CreateIndex
CREATE UNIQUE INDEX "series_title_key" ON "public"."series"("title");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_seriesId_seasonNumber_key" ON "public"."seasons"("seriesId", "seasonNumber");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_seasonId_episodeNumber_key" ON "public"."episodes"("seasonId", "episodeNumber");

-- AddForeignKey
ALTER TABLE "public"."file_assets" ADD CONSTRAINT "file_assets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media_file_meta" ADD CONSTRAINT "media_file_meta_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."file_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media_file_meta" ADD CONSTRAINT "media_file_meta_linkedEpisodeId_fkey" FOREIGN KEY ("linkedEpisodeId") REFERENCES "public"."episodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."personal_file_meta" ADD CONSTRAINT "personal_file_meta_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."file_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."personal_file_meta" ADD CONSTRAINT "personal_file_meta_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."personal_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."personal_folders" ADD CONSTRAINT "personal_folders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."personal_folders" ADD CONSTRAINT "personal_folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."personal_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media_streams" ADD CONSTRAINT "media_streams_sourceMediaFileId_fkey" FOREIGN KEY ("sourceMediaFileId") REFERENCES "public"."media_file_meta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."compositions" ADD CONSTRAINT "compositions_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "public"."episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."compositions" ADD CONSTRAINT "compositions_videoStreamId_fkey" FOREIGN KEY ("videoStreamId") REFERENCES "public"."media_streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."compositions" ADD CONSTRAINT "compositions_audioStreamId_fkey" FOREIGN KEY ("audioStreamId") REFERENCES "public"."media_streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."compositions" ADD CONSTRAINT "compositions_subtitleStreamId_fkey" FOREIGN KEY ("subtitleStreamId") REFERENCES "public"."media_streams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."compositions" ADD CONSTRAINT "compositions_translatorId_fkey" FOREIGN KEY ("translatorId") REFERENCES "public"."translators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."seasons" ADD CONSTRAINT "seasons_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "public"."series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."episodes" ADD CONSTRAINT "episodes_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "public"."seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
