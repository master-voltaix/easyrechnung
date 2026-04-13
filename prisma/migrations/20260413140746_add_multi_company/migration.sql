-- DropIndex
DROP INDEX "CompanyProfile_userId_key";

-- AlterTable
ALTER TABLE "CompanyProfile" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profileName" TEXT NOT NULL DEFAULT 'Hauptfirma';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "companyProfileId" TEXT;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyProfileId_fkey" FOREIGN KEY ("companyProfileId") REFERENCES "CompanyProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
