-- ==============================================================================
-- Aleppo Real Estate Platform - PostgreSQL Database Schema
-- Compatible with PostgreSQL 14 / 15 / 16 / 17 / 18 and pgAdmin 4
-- ==============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS "Users" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "Email" character varying(256) NOT NULL,
    "PasswordHash" text NOT NULL,
    "FirstName" character varying(100) NOT NULL,
    "LastName" character varying(100) NOT NULL,
    "PhoneNumber" character varying(50),
    "Role" character varying(50) NOT NULL DEFAULT 'Buyer',
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users" ("Email");

-- 2. Agencies Table
CREATE TABLE IF NOT EXISTS "Agencies" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "Name" character varying(200) NOT NULL,
    "Description" character varying(2000),
    "PhoneNumber" character varying(50),
    "Address" character varying(300),
    "CityArea" character varying(100),
    "LogoUrl" character varying(1000),
    "LicenseNumber" character varying(100),
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "IX_Agencies_Name" ON "Agencies" ("Name");
CREATE INDEX IF NOT EXISTS "IX_Agencies_CityArea" ON "Agencies" ("CityArea");

-- 3. Agent Profiles Table
CREATE TABLE IF NOT EXISTS "AgentProfiles" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "UserId" character varying(450) NOT NULL,
    "UserGuid" uuid NOT NULL,
    "AgencyId" uuid,
    "Bio" character varying(2000),
    "PublicPhone" character varying(50),
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    CONSTRAINT "FK_AgentProfiles_Users_UserGuid" FOREIGN KEY ("UserGuid") REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_AgentProfiles_Agencies_AgencyId" FOREIGN KEY ("AgencyId") REFERENCES "Agencies" ("Id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_AgentProfiles_UserId" ON "AgentProfiles" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_AgentProfiles_AgencyId" ON "AgentProfiles" ("AgencyId");

-- 4. Properties Table
CREATE TABLE IF NOT EXISTS "Properties" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "OwnerId" character varying(450),
    "OwnerGuid" uuid,
    "Title" character varying(200) NOT NULL,
    "Description" character varying(2000) NOT NULL,
    "Price" numeric(18,2) NOT NULL,
    "Category" character varying(50) NOT NULL,
    "Purpose" character varying(50) NOT NULL DEFAULT 'Sale',
    "City" character varying(100) NOT NULL DEFAULT 'حلب',
    "CityArea" character varying(100) NOT NULL,
    "Address" character varying(300) NOT NULL,
    "Bedrooms" integer NOT NULL,
    "Bathrooms" integer NOT NULL,
    "AreaSquareMeters" double precision NOT NULL,
    "ImageUrls" text,
    "Status" character varying(50) NOT NULL DEFAULT 'Available',
    "IsFeatured" boolean NOT NULL DEFAULT false,
    "Latitude" double precision,
    "Longitude" double precision,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    CONSTRAINT "FK_Properties_Users_OwnerGuid" FOREIGN KEY ("OwnerGuid") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "IX_Properties_OwnerId" ON "Properties" ("OwnerId");
CREATE INDEX IF NOT EXISTS "IX_Properties_Category_Status" ON "Properties" ("Category", "Status");
CREATE INDEX IF NOT EXISTS "IX_Properties_CityArea_Status" ON "Properties" ("CityArea", "Status");
CREATE INDEX IF NOT EXISTS "IX_Properties_Purpose_Status" ON "Properties" ("Purpose", "Status");
CREATE INDEX IF NOT EXISTS "IX_Properties_Price" ON "Properties" ("Price");
CREATE INDEX IF NOT EXISTS "IX_Properties_AreaSquareMeters" ON "Properties" ("AreaSquareMeters");
CREATE INDEX IF NOT EXISTS "IX_Properties_CreatedAt" ON "Properties" ("CreatedAt");

-- 5. Favorite Properties Table
CREATE TABLE IF NOT EXISTS "FavoriteProperties" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "UserId" uuid NOT NULL,
    "PropertyId" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    CONSTRAINT "FK_FavoriteProperties_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_FavoriteProperties_Properties_PropertyId" FOREIGN KEY ("PropertyId") REFERENCES "Properties" ("Id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_FavoriteProperties_UserId_PropertyId" ON "FavoriteProperties" ("UserId", "PropertyId");

-- 6. Property Inquiries Table
CREATE TABLE IF NOT EXISTS "PropertyInquiries" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "PropertyId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "PhoneNumber" character varying(50) NOT NULL,
    "Message" character varying(2000) NOT NULL,
    "Status" character varying(50) NOT NULL DEFAULT 'New',
    "AgentNotes" character varying(2000),
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    CONSTRAINT "FK_PropertyInquiries_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_PropertyInquiries_Properties_PropertyId" FOREIGN KEY ("PropertyId") REFERENCES "Properties" ("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_PropertyInquiries_PropertyId" ON "PropertyInquiries" ("PropertyId");
CREATE INDEX IF NOT EXISTS "IX_PropertyInquiries_UserId" ON "PropertyInquiries" ("UserId");

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS "Notifications" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "UserId" character varying(450) NOT NULL,
    "UserGuid" uuid,
    "Title" character varying(200) NOT NULL,
    "Message" character varying(1000) NOT NULL,
    "Type" character varying(50) NOT NULL,
    "ReferenceId" character varying(450),
    "IsRead" boolean NOT NULL DEFAULT false,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    CONSTRAINT "FK_Notifications_Users_UserGuid" FOREIGN KEY ("UserGuid") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "IX_Notifications_UserId_IsRead_CreatedAt" ON "Notifications" ("UserId", "IsRead", "CreatedAt");

-- 8. Chat Messages Table
CREATE TABLE IF NOT EXISTS "ChatMessages" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "SenderId" character varying(450) NOT NULL,
    "SenderGuid" uuid NOT NULL,
    "ReceiverId" character varying(450) NOT NULL,
    "ReceiverGuid" uuid NOT NULL,
    "PropertyId" uuid,
    "Message" character varying(4000) NOT NULL,
    "IsRead" boolean NOT NULL DEFAULT false,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    CONSTRAINT "FK_ChatMessages_Users_SenderGuid" FOREIGN KEY ("SenderGuid") REFERENCES "Users" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_ChatMessages_Users_ReceiverGuid" FOREIGN KEY ("ReceiverGuid") REFERENCES "Users" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_ChatMessages_Properties_PropertyId" FOREIGN KEY ("PropertyId") REFERENCES "Properties" ("Id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "IX_ChatMessages_SenderId_ReceiverId" ON "ChatMessages" ("SenderId", "ReceiverId");
CREATE INDEX IF NOT EXISTS "IX_ChatMessages_ReceiverId_IsRead" ON "ChatMessages" ("ReceiverId", "IsRead");
