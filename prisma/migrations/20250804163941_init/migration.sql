-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."NodeType" AS ENUM ('FILE', 'FOLDER');

-- CreateEnum
CREATE TYPE "public"."NodeStatus" AS ENUM ('PENDING', 'PROCESSING', 'AVAILABLE', 'ERROR');

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
CREATE TABLE "public"."storage_nodes" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "type" "public"."NodeType" NOT NULL,
    "name" TEXT NOT NULL,
    "s3Key" TEXT,
    "mimeType" TEXT,
    "sizeBytes" BIGINT,
    "status" "public"."NodeStatus" NOT NULL DEFAULT 'AVAILABLE',
    "meta" JSONB,
    "ownerId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."episode_media_sources" (
    "id" SERIAL NOT NULL,
    "episodeId" INTEGER NOT NULL,
    "storageNodeId" INTEGER NOT NULL,

    CONSTRAINT "episode_media_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."compositions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "audioOffsetMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "episodeId" INTEGER NOT NULL,
    "videoStreamNodeId" INTEGER NOT NULL,
    "audioStreamNodeId" INTEGER NOT NULL,
    "subtitleStreamNodeId" INTEGER,
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
CREATE UNIQUE INDEX "storage_nodes_uuid_key" ON "public"."storage_nodes"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "storage_nodes_s3Key_key" ON "public"."storage_nodes"("s3Key");

-- CreateIndex
CREATE UNIQUE INDEX "storage_nodes_ownerId_parentId_name_key" ON "public"."storage_nodes"("ownerId", "parentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "episode_media_sources_episodeId_storageNodeId_key" ON "public"."episode_media_sources"("episodeId", "storageNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "translators_name_key" ON "public"."translators"("name");

-- CreateIndex
CREATE UNIQUE INDEX "series_title_key" ON "public"."series"("title");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_seriesId_seasonNumber_key" ON "public"."seasons"("seriesId", "seasonNumber");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_seasonId_episodeNumber_key" ON "public"."episodes"("seasonId", "episodeNumber");

-- AddForeignKey
ALTER TABLE "public"."storage_nodes" ADD CONSTRAINT "storage_nodes_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."storage_nodes" ADD CONSTRAINT "storage_nodes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."storage_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."episode_media_sources" ADD CONSTRAINT "episode_media_sources_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "public"."episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."episode_media_sources" ADD CONSTRAINT "episode_media_sources_storageNodeId_fkey" FOREIGN KEY ("storageNodeId") REFERENCES "public"."storage_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."compositions" ADD CONSTRAINT "compositions_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "public"."episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."compositions" ADD CONSTRAINT "compositions_videoStreamNodeId_fkey" FOREIGN KEY ("videoStreamNodeId") REFERENCES "public"."storage_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."compositions" ADD CONSTRAINT "compositions_audioStreamNodeId_fkey" FOREIGN KEY ("audioStreamNodeId") REFERENCES "public"."storage_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."compositions" ADD CONSTRAINT "compositions_subtitleStreamNodeId_fkey" FOREIGN KEY ("subtitleStreamNodeId") REFERENCES "public"."storage_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."compositions" ADD CONSTRAINT "compositions_translatorId_fkey" FOREIGN KEY ("translatorId") REFERENCES "public"."translators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."seasons" ADD CONSTRAINT "seasons_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "public"."series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."episodes" ADD CONSTRAINT "episodes_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "public"."seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
