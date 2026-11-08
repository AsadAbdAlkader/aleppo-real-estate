-- ==============================================================================
-- Aleppo Real Estate SaaS - Multi-Tenant Platform Database Schema
-- Architecture: Multi-Tenant with Shared Database & Shared Schema (Tenant Identifier: AgencyId)
-- Target: PostgreSQL 14+ (Compatible with PostgreSQL 18)
-- Version: 2.0 (SaaS Multi-Tenant Full Architecture - 17 Tables)
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- GROUP 1: IDENTITY, AGENCIES & PERMISSIONS
-- ==============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS "Users" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "Email" character varying(256) NOT NULL,
    "PasswordHash" text NOT NULL,
    "FirstName" character varying(100) NOT NULL,
    "LastName" character varying(100) NOT NULL,
    "PhoneNumber" character varying(30),
    "ProfileImageUrl" text,
    "PlatformRole" character varying(30) NOT NULL DEFAULT 'User',
    "Role" character varying(50) NOT NULL DEFAULT 'Buyer',
    "IsActive" boolean NOT NULL DEFAULT true,
    "EmailConfirmed" boolean NOT NULL DEFAULT true,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" timestamp with time zone
);

ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "ProfileImageUrl" text;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "PlatformRole" character varying(30) NOT NULL DEFAULT 'User';
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "IsActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "EmailConfirmed" boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS "UX_Users_Email" ON "Users" (LOWER("Email"));

-- 2. Agencies Table (Tenants)
CREATE TABLE IF NOT EXISTS "Agencies" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "Name" character varying(200) NOT NULL,
    "Slug" character varying(200),
    "Description" text,
    "PhoneNumber" character varying(30),
    "Email" character varying(256),
    "Address" character varying(500),
    "City" character varying(100) NOT NULL DEFAULT 'حلب',
    "CityArea" character varying(100),
    "LogoUrl" text,
    "LicenseNumber" character varying(100),
    "CreatedByUserId" uuid,
    "IsActive" boolean NOT NULL DEFAULT true,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" timestamp with time zone
);

ALTER TABLE "Agencies" ADD COLUMN IF NOT EXISTS "Slug" character varying(200);
ALTER TABLE "Agencies" ADD COLUMN IF NOT EXISTS "Email" character varying(256);
ALTER TABLE "Agencies" ADD COLUMN IF NOT EXISTS "City" character varying(100) NOT NULL DEFAULT 'حلب';
ALTER TABLE "Agencies" ADD COLUMN IF NOT EXISTS "CreatedByUserId" uuid;
ALTER TABLE "Agencies" ADD COLUMN IF NOT EXISTS "IsActive" boolean NOT NULL DEFAULT true;

-- Ensure default unique slugs for existing agencies
UPDATE "Agencies" SET "Slug" = 'al-noor' WHERE "Id" = '3fa85f64-5717-4562-b3fc-2c963f66b333';
UPDATE "Agencies" SET "Slug" = 'al-amal' WHERE "Id" = '3fa85f64-5717-4562-b3fc-2c963f66b444';
UPDATE "Agencies" SET "Slug" = 'agency-' || SUBSTRING("Id"::text, 25) WHERE "Slug" IS NULL OR "Slug" = 'agency-3fa85f64';

CREATE UNIQUE INDEX IF NOT EXISTS "UX_Agencies_Slug" ON "Agencies" ("Slug");
CREATE INDEX IF NOT EXISTS "IX_Agencies_CityArea" ON "Agencies" ("CityArea");

-- 3. AgencyMembers Table (N:M Membership)
CREATE TABLE IF NOT EXISTS "AgencyMembers" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "AgencyId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Role" character varying(30) NOT NULL DEFAULT 'Agent',
    "MembershipStatus" character varying(30) NOT NULL DEFAULT 'Active',
    "JoinedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "InvitedByUserId" uuid,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_AgencyMembers_Agencies_AgencyId" FOREIGN KEY ("AgencyId") REFERENCES "Agencies" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_AgencyMembers_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_AgencyMembers_Users_InvitedBy" FOREIGN KEY ("InvitedByUserId") REFERENCES "Users" ("Id") ON DELETE SET NULL,
    CONSTRAINT "UQ_AgencyMembers_Agency_User" UNIQUE ("AgencyId", "UserId"),
    CONSTRAINT "CK_AgencyMembers_Role" CHECK ("Role" IN ('Owner', 'Admin', 'Agent', 'Employee', 'Viewer')),
    CONSTRAINT "CK_AgencyMembers_Status" CHECK ("MembershipStatus" IN ('Invited', 'Active', 'Suspended', 'Removed'))
);

CREATE INDEX IF NOT EXISTS "IX_AgencyMembers_UserId" ON "AgencyMembers" ("UserId");
CREATE UNIQUE INDEX IF NOT EXISTS "UX_AgencyMembers_OneOwner" ON "AgencyMembers" ("AgencyId") WHERE "Role" = 'Owner' AND "MembershipStatus" = 'Active';

-- 4. AgentProfiles Table (Per-Agency Agent Profile)
CREATE TABLE IF NOT EXISTS "AgentProfiles" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "AgencyId" uuid NOT NULL,
    "UserId" character varying(450) NOT NULL,
    "UserGuid" uuid NOT NULL,
    "PublicTitle" character varying(150),
    "Bio" text,
    "PublicPhone" character varying(30),
    "ProfileImageUrl" text,
    "IsPublic" boolean NOT NULL DEFAULT true,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" timestamp with time zone
);

ALTER TABLE "AgentProfiles" ADD COLUMN IF NOT EXISTS "PublicTitle" character varying(150);
ALTER TABLE "AgentProfiles" ADD COLUMN IF NOT EXISTS "ProfileImageUrl" text;
ALTER TABLE "AgentProfiles" ADD COLUMN IF NOT EXISTS "IsPublic" boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "IX_AgentProfiles_AgencyId" ON "AgentProfiles" ("AgencyId");
CREATE INDEX IF NOT EXISTS "IX_AgentProfiles_UserGuid" ON "AgentProfiles" ("UserGuid");

-- 5. AgencyInvitations Table
CREATE TABLE IF NOT EXISTS "AgencyInvitations" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "AgencyId" uuid NOT NULL,
    "Email" character varying(256) NOT NULL,
    "Role" character varying(30) NOT NULL,
    "TokenHash" text NOT NULL,
    "InvitedByUserId" uuid,
    "ExpiresAt" timestamp with time zone NOT NULL,
    "AcceptedAt" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_AgencyInvitations_Agencies" FOREIGN KEY ("AgencyId") REFERENCES "Agencies" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_AgencyInvitations_Users_InvitedBy" FOREIGN KEY ("InvitedByUserId") REFERENCES "Users" ("Id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "IX_AgencyInvitations_AgencyId" ON "AgencyInvitations" ("AgencyId");
CREATE INDEX IF NOT EXISTS "IX_AgencyInvitations_Email" ON "AgencyInvitations" ("Email");

-- 6. AgencySettings Table
CREATE TABLE IF NOT EXISTS "AgencySettings" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "AgencyId" uuid NOT NULL UNIQUE,
    "PublicPhone" character varying(30),
    "PublicEmail" character varying(256),
    "WebsiteUrl" text,
    "AboutText" text,
    "WorkingHours" jsonb,
    "SocialLinks" jsonb,
    "AllowPublicInquiries" boolean NOT NULL DEFAULT true,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" timestamp with time zone,
    CONSTRAINT "FK_AgencySettings_Agencies" FOREIGN KEY ("AgencyId") REFERENCES "Agencies" ("Id") ON DELETE CASCADE
);

-- ==============================================================================
-- GROUP 2: PROPERTIES & MEDIA
-- ==============================================================================

-- 7. Properties Table
CREATE TABLE IF NOT EXISTS "Properties" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "AgencyId" uuid,
    "CreatedByUserId" uuid,
    "OwnerId" character varying(450),
    "OwnerGuid" uuid,
    "Title" character varying(250) NOT NULL,
    "Description" text NOT NULL,
    "Price" numeric(18,2) NOT NULL,
    "Currency" character varying(10) NOT NULL DEFAULT 'SYP',
    "Category" character varying(30) NOT NULL,
    "Purpose" character varying(20) NOT NULL DEFAULT 'Sale',
    "City" character varying(100) NOT NULL DEFAULT 'حلب',
    "CityArea" character varying(100) NOT NULL,
    "District" character varying(100),
    "Address" character varying(500) NOT NULL,
    "Bedrooms" integer NOT NULL DEFAULT 0,
    "Bathrooms" integer NOT NULL DEFAULT 0,
    "AreaSquareMeters" double precision NOT NULL,
    "Floor" integer,
    "Latitude" double precision,
    "Longitude" double precision,
    "Status" character varying(30) NOT NULL DEFAULT 'Available',
    "IsFeatured" boolean NOT NULL DEFAULT false,
    "PublishedAt" timestamp with time zone,
    "ImageUrls" text,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" timestamp with time zone
);

ALTER TABLE "Properties" ADD COLUMN IF NOT EXISTS "AgencyId" uuid;
ALTER TABLE "Properties" ADD COLUMN IF NOT EXISTS "CreatedByUserId" uuid;
ALTER TABLE "Properties" ADD COLUMN IF NOT EXISTS "Currency" character varying(10) NOT NULL DEFAULT 'SYP';
ALTER TABLE "Properties" ADD COLUMN IF NOT EXISTS "District" character varying(100);
ALTER TABLE "Properties" ADD COLUMN IF NOT EXISTS "Floor" integer;
ALTER TABLE "Properties" ADD COLUMN IF NOT EXISTS "Latitude" double precision;
ALTER TABLE "Properties" ADD COLUMN IF NOT EXISTS "Longitude" double precision;
ALTER TABLE "Properties" ADD COLUMN IF NOT EXISTS "PublishedAt" timestamp with time zone;

-- Link existing properties with a default agency if AgencyId is null
DO $$
DECLARE
    default_agency_id uuid;
BEGIN
    SELECT "Id" INTO default_agency_id FROM "Agencies" LIMIT 1;
    IF default_agency_id IS NOT NULL THEN
        UPDATE "Properties" SET "AgencyId" = default_agency_id WHERE "AgencyId" IS NULL;
    END IF;
END $$;

-- Enforce Composite Unique Key for Agency Multi-Tenancy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UQ_Properties_Agency_Id'
    ) THEN
        ALTER TABLE "Properties" ADD CONSTRAINT "UQ_Properties_Agency_Id" UNIQUE ("AgencyId", "Id");
    END IF;
END $$;

-- Value check constraints on Properties
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CK_Properties_Price') THEN
        ALTER TABLE "Properties" ADD CONSTRAINT "CK_Properties_Price" CHECK ("Price" >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CK_Properties_Area') THEN
        ALTER TABLE "Properties" ADD CONSTRAINT "CK_Properties_Area" CHECK ("AreaSquareMeters" > 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CK_Properties_Bedrooms') THEN
        ALTER TABLE "Properties" ADD CONSTRAINT "CK_Properties_Bedrooms" CHECK ("Bedrooms" >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CK_Properties_Bathrooms') THEN
        ALTER TABLE "Properties" ADD CONSTRAINT "CK_Properties_Bathrooms" CHECK ("Bathrooms" >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CK_Properties_Status') THEN
        ALTER TABLE "Properties" ADD CONSTRAINT "CK_Properties_Status" CHECK ("Status" IN ('Draft', 'PendingReview', 'Published', 'Available', 'Reserved', 'Sold', 'Rented', 'Archived'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "IX_Properties_Agency_Status" ON "Properties" ("AgencyId", "Status", "CreatedAt" DESC);
CREATE INDEX IF NOT EXISTS "IX_Properties_Public_Search" ON "Properties" ("City", "Purpose", "Category", "Price") WHERE "Status" IN ('Published', 'Available');
CREATE INDEX IF NOT EXISTS "IX_Properties_Price" ON "Properties" ("Price");
CREATE INDEX IF NOT EXISTS "IX_Properties_CityArea" ON "Properties" ("CityArea");

-- 8. PropertyImages Table
CREATE TABLE IF NOT EXISTS "PropertyImages" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "AgencyId" uuid NOT NULL,
    "PropertyId" uuid NOT NULL,
    "ImageUrl" text NOT NULL,
    "IsPrimary" boolean NOT NULL DEFAULT false,
    "SortOrder" integer NOT NULL DEFAULT 0,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_PropertyImages_Property" FOREIGN KEY ("AgencyId", "PropertyId") REFERENCES "Properties" ("AgencyId", "Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_PropertyImages_PropertyId" ON "PropertyImages" ("PropertyId");

-- 9. FavoriteProperties Table
CREATE TABLE IF NOT EXISTS "FavoriteProperties" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "AgencyId" uuid,
    "UserId" uuid NOT NULL,
    "PropertyId" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" timestamp with time zone,
    CONSTRAINT "FK_FavoriteProperties_Users" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_FavoriteProperties_Properties" FOREIGN KEY ("PropertyId") REFERENCES "Properties" ("Id") ON DELETE CASCADE,
    CONSTRAINT "UQ_FavoriteProperties_User_Property" UNIQUE ("UserId", "PropertyId")
);

-- ==============================================================================
-- GROUP 3: COMMUNICATION & INQUIRIES
-- ==============================================================================

-- 10. PropertyInquiries Table
CREATE TABLE IF NOT EXISTS "PropertyInquiries" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "AgencyId" uuid,
    "PropertyId" uuid NOT NULL,
    "UserId" uuid,
    "AssignedToUserId" uuid,
    "CustomerName" character varying(150) NOT NULL,
    "CustomerEmail" character varying(256),
    "CustomerPhone" character varying(30) NOT NULL,
    "Message" text NOT NULL,
    "Status" character varying(30) NOT NULL DEFAULT 'New',
    "AgentNotes" text,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" timestamp with time zone,
    CONSTRAINT "FK_PropertyInquiries_Properties" FOREIGN KEY ("PropertyId") REFERENCES "Properties" ("Id") ON DELETE CASCADE
);

ALTER TABLE "PropertyInquiries" ADD COLUMN IF NOT EXISTS "AgencyId" uuid;
ALTER TABLE "PropertyInquiries" ADD COLUMN IF NOT EXISTS "AssignedToUserId" uuid;

CREATE INDEX IF NOT EXISTS "IX_PropertyInquiries_Agency_Status" ON "PropertyInquiries" ("AgencyId", "Status");
CREATE INDEX IF NOT EXISTS "IX_PropertyInquiries_PropertyId" ON "PropertyInquiries" ("PropertyId");

-- 11. Conversations Table
CREATE TABLE IF NOT EXISTS "Conversations" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "AgencyId" uuid,
    "PropertyId" uuid,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" timestamp with time zone,
    CONSTRAINT "FK_Conversations_Agencies" FOREIGN KEY ("AgencyId") REFERENCES "Agencies" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Conversations_Properties" FOREIGN KEY ("PropertyId") REFERENCES "Properties" ("Id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "IX_Conversations_Agency_Updated" ON "Conversations" ("AgencyId", "UpdatedAt" DESC);

-- 12. ConversationParticipants Table
CREATE TABLE IF NOT EXISTS "ConversationParticipants" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "ConversationId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "ParticipantRole" character varying(30) NOT NULL DEFAULT 'Buyer',
    "JoinedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastReadAt" timestamp with time zone,
    CONSTRAINT "FK_Participants_Conversations" FOREIGN KEY ("ConversationId") REFERENCES "Conversations" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Participants_Users" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "UQ_ConversationParticipants" UNIQUE ("ConversationId", "UserId")
);

-- 13. ChatMessages Table
CREATE TABLE IF NOT EXISTS "ChatMessages" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "ConversationId" uuid,
    "SenderUserId" uuid,
    "ReceiverUserId" uuid,
    "SenderId" character varying(450),
    "SenderGuid" uuid,
    "ReceiverId" character varying(450),
    "ReceiverGuid" uuid,
    "PropertyId" uuid,
    "Message" text NOT NULL,
    "MessageType" character varying(30) NOT NULL DEFAULT 'Text',
    "IsRead" boolean NOT NULL DEFAULT false,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "EditedAt" timestamp with time zone,
    "UpdatedAt" timestamp with time zone
);

ALTER TABLE "ChatMessages" ADD COLUMN IF NOT EXISTS "ConversationId" uuid;
ALTER TABLE "ChatMessages" ADD COLUMN IF NOT EXISTS "SenderUserId" uuid;
ALTER TABLE "ChatMessages" ADD COLUMN IF NOT EXISTS "ReceiverUserId" uuid;
ALTER TABLE "ChatMessages" ADD COLUMN IF NOT EXISTS "MessageType" character varying(30) NOT NULL DEFAULT 'Text';
ALTER TABLE "ChatMessages" ADD COLUMN IF NOT EXISTS "EditedAt" timestamp with time zone;

CREATE INDEX IF NOT EXISTS "IX_ChatMessages_Conversation" ON "ChatMessages" ("ConversationId", "CreatedAt");

-- ==============================================================================
-- GROUP 4: NOTIFICATIONS & AUDIT LOGS
-- ==============================================================================

-- 14. Notifications Table
CREATE TABLE IF NOT EXISTS "Notifications" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "UserId" uuid NOT NULL,
    "AgencyId" uuid,
    "Title" character varying(200) NOT NULL,
    "Message" character varying(1000) NOT NULL,
    "Type" character varying(50) NOT NULL,
    "ReferenceType" character varying(50),
    "ReferenceId" uuid,
    "IsRead" boolean NOT NULL DEFAULT false,
    "ReadAt" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_Notifications_Users" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Notifications_Agencies" FOREIGN KEY ("AgencyId") REFERENCES "Agencies" ("Id") ON DELETE SET NULL
);

ALTER TABLE "Notifications" ADD COLUMN IF NOT EXISTS "AgencyId" uuid;
ALTER TABLE "Notifications" ADD COLUMN IF NOT EXISTS "ReferenceType" character varying(50);
ALTER TABLE "Notifications" ADD COLUMN IF NOT EXISTS "ReferenceId" uuid;
ALTER TABLE "Notifications" ADD COLUMN IF NOT EXISTS "ReadAt" timestamp with time zone;

CREATE INDEX IF NOT EXISTS "IX_Notifications_User_Unread" ON "Notifications" ("UserId", "CreatedAt" DESC) WHERE "IsRead" = false;

-- 15. AgencyAuditLogs Table
CREATE TABLE IF NOT EXISTS "AgencyAuditLogs" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "AgencyId" uuid NOT NULL,
    "UserId" uuid,
    "Action" character varying(100) NOT NULL,
    "EntityName" character varying(100) NOT NULL,
    "EntityId" uuid NOT NULL,
    "OldValues" jsonb,
    "NewValues" jsonb,
    "IpAddress" character varying(45),
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_AuditLogs_Agencies" FOREIGN KEY ("AgencyId") REFERENCES "Agencies" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_AuditLogs_Users" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "IX_AuditLogs_Agency_CreatedAt" ON "AgencyAuditLogs" ("AgencyId", "CreatedAt" DESC);

-- ==============================================================================
-- GROUP 5: SAAS SUBSCRIPTION & PLANS
-- ==============================================================================

-- 16. SubscriptionPlans Table
CREATE TABLE IF NOT EXISTS "SubscriptionPlans" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "Name" character varying(100) NOT NULL,
    "Code" character varying(50) NOT NULL,
    "Description" text,
    "MonthlyPrice" numeric(18,2) NOT NULL DEFAULT 0,
    "YearlyPrice" numeric(18,2) NOT NULL DEFAULT 0,
    "MaxProperties" integer NOT NULL DEFAULT 50,
    "MaxMembers" integer NOT NULL DEFAULT 5,
    "IsActive" boolean NOT NULL DEFAULT true,
    "Features" jsonb,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UQ_SubscriptionPlans_Code" UNIQUE ("Code")
);

-- 17. AgencySubscriptions Table
CREATE TABLE IF NOT EXISTS "AgencySubscriptions" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "AgencyId" uuid NOT NULL,
    "PlanId" uuid NOT NULL,
    "Status" character varying(30) NOT NULL DEFAULT 'Active',
    "StartDate" timestamp with time zone NOT NULL,
    "EndDate" timestamp with time zone NOT NULL,
    "TrialEndsAt" timestamp with time zone,
    "CancelledAt" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_AgencySubscriptions_Agencies" FOREIGN KEY ("AgencyId") REFERENCES "Agencies" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_AgencySubscriptions_Plans" FOREIGN KEY ("PlanId") REFERENCES "SubscriptionPlans" ("Id") ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS "UX_AgencySubscriptions_Current" ON "AgencySubscriptions" ("AgencyId") 
    WHERE "Status" IN ('Trialing', 'Active', 'PastDue');

-- ==============================================================================
-- INITIAL SAAS SEED DATA (SAFE & IDEMPOTENT)
-- ==============================================================================

-- Seed Subscription Plans
INSERT INTO "SubscriptionPlans" ("Id", "Name", "Code", "Description", "MonthlyPrice", "YearlyPrice", "MaxProperties", "MaxMembers", "IsActive", "Features", "CreatedAt")
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'الباقة التجريبية المجانية', 'TRIAL', 'فترة تجريبية لكافة ميزات منصة عقارات حلب', 0, 0, 15, 3, true, '{"analytics": false, "featured_listing": 1, "custom_domain": false}'::jsonb, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-222222222222', 'الباقة المهنية للمكاتب', 'PRO', 'حلول احترافية للمكاتب العقارية المتوسطة والنشطة', 500000, 5000000, 100, 10, true, '{"analytics": true, "featured_listing": 5, "custom_domain": true}'::jsonb, CURRENT_TIMESTAMP),
    ('33333333-3333-3333-3333-333333333333', 'باقة الشركات الكبرى', 'ENTERPRISE', 'حلول متقدمة للشركات العقارية والتطوير العقاري', 1200000, 12000000, 1000, 50, true, '{"analytics": true, "featured_listing": 25, "custom_domain": true, "dedicated_support": true}'::jsonb, CURRENT_TIMESTAMP)
ON CONFLICT ("Code") DO NOTHING;

-- Seed Agency Memberships for Existing Agencies & Users
DO $$
DECLARE
    agency1_id uuid := '3fa85f64-5717-4562-b3fc-2c963f66b333';
    agency2_id uuid := '3fa85f64-5717-4562-b3fc-2c963f66b444';
    user_agent_id uuid := '3fa85f64-5717-4562-b3fc-2c963f66b222';
    user_buyer_id uuid := '3fa85f64-5717-4562-b3fc-2c963f66b111';
    plan_pro_id uuid := '22222222-2222-2222-2222-222222222222';
BEGIN
    -- Ensure agency slugs
    UPDATE "Agencies" SET "Slug" = 'al-noor' WHERE "Id" = agency1_id AND ("Slug" IS NULL OR "Slug" = '');
    UPDATE "Agencies" SET "Slug" = 'al-amal' WHERE "Id" = agency2_id AND ("Slug" IS NULL OR "Slug" = '');

    -- Agency 1 Owner (Samer)
    IF EXISTS (SELECT 1 FROM "Agencies" WHERE "Id" = agency1_id) AND EXISTS (SELECT 1 FROM "Users" WHERE "Id" = user_agent_id) THEN
        INSERT INTO "AgencyMembers" ("Id", "AgencyId", "UserId", "Role", "MembershipStatus", "JoinedAt", "CreatedAt")
        VALUES ('44444444-4444-4444-4444-444444444441', agency1_id, user_agent_id, 'Owner', 'Active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT ("AgencyId", "UserId") DO NOTHING;

        -- Agency 1 Settings
        INSERT INTO "AgencySettings" ("Id", "AgencyId", "PublicPhone", "PublicEmail", "WebsiteUrl", "AboutText", "AllowPublicInquiries", "CreatedAt")
        VALUES ('55555555-5555-5555-5555-555555555551', agency1_id, '+963212000001', 'alnoor@aleppo-estate.sy', 'https://alnoor.aleppo-realestate.sy', 'مكتب النور العقاري بحلب', true, CURRENT_TIMESTAMP)
        ON CONFLICT ("AgencyId") DO NOTHING;

        -- Agency 1 Subscription
        INSERT INTO "AgencySubscriptions" ("Id", "AgencyId", "PlanId", "Status", "StartDate", "EndDate", "CreatedAt")
        VALUES ('66666666-6666-6666-6666-666666666661', agency1_id, plan_pro_id, 'Active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + interval '365 days', CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Agency 2 Agent (Samer working in another agency)
    IF EXISTS (SELECT 1 FROM "Agencies" WHERE "Id" = agency2_id) AND EXISTS (SELECT 1 FROM "Users" WHERE "Id" = user_agent_id) THEN
        INSERT INTO "AgencyMembers" ("Id", "AgencyId", "UserId", "Role", "MembershipStatus", "JoinedAt", "CreatedAt")
        VALUES ('44444444-4444-4444-4444-444444444442', agency2_id, user_agent_id, 'Agent', 'Active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT ("AgencyId", "UserId") DO NOTHING;

        -- Agency 2 Settings
        INSERT INTO "AgencySettings" ("Id", "AgencyId", "PublicPhone", "PublicEmail", "WebsiteUrl", "AboutText", "AllowPublicInquiries", "CreatedAt")
        VALUES ('55555555-5555-5555-5555-555555555552', agency2_id, '+963212000002', 'alamal@aleppo-estate.sy', 'https://alamal.aleppo-realestate.sy', 'مكتب الأمل العقاري بحلب', true, CURRENT_TIMESTAMP)
        ON CONFLICT ("AgencyId") DO NOTHING;

        -- Agency 2 Subscription
        INSERT INTO "AgencySubscriptions" ("Id", "AgencyId", "PlanId", "Status", "StartDate", "EndDate", "CreatedAt")
        VALUES ('66666666-6666-6666-6666-666666666662', agency2_id, plan_pro_id, 'Active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + interval '365 days', CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
