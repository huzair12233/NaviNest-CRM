-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "altPhone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "leadType" TEXT NOT NULL DEFAULT 'Buyer',
    "interest" TEXT NOT NULL DEFAULT 'SALE',
    "status" TEXT NOT NULL DEFAULT 'New',
    "temperature" TEXT NOT NULL DEFAULT 'Warm',
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "propertyType" TEXT,
    "bhk" REAL,
    "locations" TEXT,
    "preferredProject" TEXT,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "areaMin" INTEGER,
    "areaMax" INTEGER,
    "furnishing" TEXT,
    "parkingReq" BOOLEAN NOT NULL DEFAULT false,
    "floorPref" TEXT,
    "possessionReq" TEXT,
    "moveInDate" DATETIME,
    "loanRequired" BOOLEAN NOT NULL DEFAULT false,
    "occupancy" TEXT,
    "requirementNotes" TEXT,
    "rentMin" INTEGER,
    "rentMax" INTEGER,
    "depositMax" INTEGER,
    "sourceId" TEXT,
    "channelPartnerId" TEXT,
    "contactId" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT,
    "lostReason" TEXT,
    "lastActivityAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "LeadSource" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_channelPartnerId_fkey" FOREIGN KEY ("channelPartnerId") REFERENCES "ChannelPartner" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Lead" ("altPhone", "areaMax", "areaMin", "assignedToId", "bhk", "budgetMax", "budgetMin", "channelPartnerId", "code", "contactId", "createdAt", "createdById", "depositMax", "email", "floorPref", "fullName", "furnishing", "id", "interest", "lastActivityAt", "leadType", "loanRequired", "locations", "lostReason", "moveInDate", "occupancy", "parkingReq", "phone", "possessionReq", "preferredProject", "priority", "propertyType", "rentMax", "rentMin", "requirementNotes", "sourceId", "status", "temperature", "updatedAt", "whatsapp") SELECT "altPhone", "areaMax", "areaMin", "assignedToId", "bhk", "budgetMax", "budgetMin", "channelPartnerId", "code", "contactId", "createdAt", "createdById", "depositMax", "email", "floorPref", "fullName", "furnishing", "id", "interest", "lastActivityAt", "leadType", "loanRequired", "locations", "lostReason", "moveInDate", "occupancy", "parkingReq", "phone", "possessionReq", "preferredProject", "priority", "propertyType", "rentMax", "rentMin", "requirementNotes", "sourceId", "status", "temperature", "updatedAt", "whatsapp" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
CREATE UNIQUE INDEX "Lead_code_key" ON "Lead"("code");
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
CREATE INDEX "Lead_interest_idx" ON "Lead"("interest");
CREATE INDEX "Lead_assignedToId_idx" ON "Lead"("assignedToId");
CREATE INDEX "Lead_temperature_idx" ON "Lead"("temperature");
CREATE TABLE "new_Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "listingType" TEXT NOT NULL DEFAULT 'SALE',
    "segment" TEXT NOT NULL DEFAULT 'Residential',
    "propertyType" TEXT NOT NULL DEFAULT 'Apartment',
    "bhk" REAL,
    "projectId" TEXT,
    "location" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL DEFAULT 'Navi Mumbai',
    "carpetArea" INTEGER,
    "builtupArea" INTEGER,
    "floor" INTEGER,
    "totalFloors" INTEGER,
    "furnishing" TEXT NOT NULL DEFAULT 'Unfurnished',
    "parking" INTEGER NOT NULL DEFAULT 0,
    "bathrooms" INTEGER,
    "balcony" INTEGER,
    "ageYears" INTEGER,
    "possession" TEXT NOT NULL DEFAULT 'Ready',
    "salePrice" INTEGER,
    "rent" INTEGER,
    "deposit" INTEGER,
    "maintenance" INTEGER,
    "ownerId" TEXT,
    "listingSource" TEXT NOT NULL DEFAULT 'Direct',
    "addedById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "description" TEXT,
    "amenities" TEXT,
    "photos" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Property_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Property" ("addedById", "address", "ageYears", "amenities", "balcony", "bathrooms", "bhk", "builtupArea", "carpetArea", "city", "code", "createdAt", "deposit", "description", "floor", "furnishing", "id", "listingSource", "listingType", "location", "maintenance", "ownerId", "parking", "photos", "possession", "projectId", "propertyType", "rent", "salePrice", "segment", "status", "title", "totalFloors", "updatedAt") SELECT "addedById", "address", "ageYears", "amenities", "balcony", "bathrooms", "bhk", "builtupArea", "carpetArea", "city", "code", "createdAt", "deposit", "description", "floor", "furnishing", "id", "listingSource", "listingType", "location", "maintenance", "ownerId", "parking", "photos", "possession", "projectId", "propertyType", "rent", "salePrice", "segment", "status", "title", "totalFloors", "updatedAt" FROM "Property";
DROP TABLE "Property";
ALTER TABLE "new_Property" RENAME TO "Property";
CREATE UNIQUE INDEX "Property_code_key" ON "Property"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
