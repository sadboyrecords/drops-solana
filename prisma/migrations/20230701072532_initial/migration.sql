-- CreateEnum
CREATE TYPE "DropStep" AS ENUM ('METADATA_UPLOAD', 'CREATE_COLLECTION', 'CREATE_CANDY_MACHINE', 'INSERT_ITEMS', 'SAVE_DATA', 'LAUNCHED');

-- CreateTable
CREATE TABLE "Example" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Example_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "magicSolanaAddress" TEXT,
    "walletAddress" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Drop" (
    "id" TEXT NOT NULL,
    "candyMachineId" TEXT,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "defaultStartDate" TIMESTAMP(3) NOT NULL,
    "defaultEndDate" TIMESTAMP(3),
    "ownerWalletAddress" TEXT NOT NULL,
    "lowestPrice" DOUBLE PRECISION,
    "defaultPrice" DOUBLE PRECISION,
    "audioUri" TEXT,
    "audioIpfsHash" TEXT,
    "imageIpfsHash" TEXT NOT NULL,
    "imageUri" TEXT,
    "jsonIpfsHash" TEXT,
    "description" TEXT NOT NULL,
    "dropName" TEXT NOT NULL,
    "collectionAddress" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "items" INTEGER,
    "formSubmission" JSONB NOT NULL,
    "step" "DropStep" NOT NULL DEFAULT 'METADATA_UPLOAD',
    "metadataHash" DOUBLE PRECISION[],

    CONSTRAINT "Drop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DropToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_magicSolanaAddress_key" ON "User"("magicSolanaAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Drop_candyMachineId_key" ON "Drop"("candyMachineId");

-- CreateIndex
CREATE UNIQUE INDEX "Drop_slug_key" ON "Drop"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Drop_ownerWalletAddress_slug_key" ON "Drop"("ownerWalletAddress", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "_DropToUser_AB_unique" ON "_DropToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_DropToUser_B_index" ON "_DropToUser"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drop" ADD CONSTRAINT "Drop_ownerWalletAddress_fkey" FOREIGN KEY ("ownerWalletAddress") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DropToUser" ADD CONSTRAINT "_DropToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Drop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DropToUser" ADD CONSTRAINT "_DropToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
