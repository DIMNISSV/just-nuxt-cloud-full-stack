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

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "storage_nodes_uuid_key" ON "public"."storage_nodes"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "storage_nodes_s3Key_key" ON "public"."storage_nodes"("s3Key");

-- CreateIndex
CREATE UNIQUE INDEX "storage_nodes_ownerId_parentId_name_key" ON "public"."storage_nodes"("ownerId", "parentId", "name");

-- AddForeignKey
ALTER TABLE "public"."storage_nodes" ADD CONSTRAINT "storage_nodes_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."storage_nodes" ADD CONSTRAINT "storage_nodes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."storage_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
