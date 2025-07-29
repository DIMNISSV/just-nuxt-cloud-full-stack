-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."UploadStatus" AS ENUM ('NEW', 'DOWNLOADING', 'PROCESSING', 'COMPLETED', 'ERROR');

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
CREATE TABLE "public"."Upload" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "status" "public"."UploadStatus" NOT NULL DEFAULT 'NEW',
    "statusMessage" TEXT,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "originalFilename" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "linkedEpisodeId" INTEGER,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MediaStream" (
    "id" SERIAL NOT NULL,
    "type" "public"."StreamType" NOT NULL,
    "filePath" TEXT NOT NULL,
    "codecInfo" TEXT,
    "title" TEXT,
    "language" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadId" INTEGER NOT NULL,

    CONSTRAINT "MediaStream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Composition" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "audioOffsetMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "episodeId" INTEGER NOT NULL,
    "videoStreamId" INTEGER NOT NULL,
    "audioStreamId" INTEGER NOT NULL,
    "translatorId" INTEGER NOT NULL,

    CONSTRAINT "Composition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Translator" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Translator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Series" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "posterUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "externalIds" JSONB,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Season" (
    "id" SERIAL NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seriesId" INTEGER NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Episode" (
    "id" SERIAL NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seasonId" INTEGER NOT NULL,
    "externalIds" JSONB,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Upload_uuid_key" ON "public"."Upload"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Translator_name_key" ON "public"."Translator"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Series_title_key" ON "public"."Series"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Season_seriesId_seasonNumber_key" ON "public"."Season"("seriesId", "seasonNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_seasonId_episodeNumber_key" ON "public"."Episode"("seasonId", "episodeNumber");

-- AddForeignKey
ALTER TABLE "public"."Upload" ADD CONSTRAINT "Upload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Upload" ADD CONSTRAINT "Upload_linkedEpisodeId_fkey" FOREIGN KEY ("linkedEpisodeId") REFERENCES "public"."Episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MediaStream" ADD CONSTRAINT "MediaStream_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "public"."Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Composition" ADD CONSTRAINT "Composition_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "public"."Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Composition" ADD CONSTRAINT "Composition_videoStreamId_fkey" FOREIGN KEY ("videoStreamId") REFERENCES "public"."MediaStream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Composition" ADD CONSTRAINT "Composition_audioStreamId_fkey" FOREIGN KEY ("audioStreamId") REFERENCES "public"."MediaStream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Composition" ADD CONSTRAINT "Composition_translatorId_fkey" FOREIGN KEY ("translatorId") REFERENCES "public"."Translator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Season" ADD CONSTRAINT "Season_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "public"."Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Episode" ADD CONSTRAINT "Episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "public"."Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
