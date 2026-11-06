IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE TABLE [Agencies] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Description] nvarchar(2000) NULL,
        [PhoneNumber] nvarchar(50) NULL,
        [Address] nvarchar(300) NULL,
        [CityArea] nvarchar(100) NULL,
        [LogoUrl] nvarchar(1000) NULL,
        [LicenseNumber] nvarchar(100) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Agencies] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE TABLE [Users] (
        [Id] uniqueidentifier NOT NULL,
        [Email] nvarchar(256) NOT NULL,
        [PasswordHash] nvarchar(max) NOT NULL,
        [FirstName] nvarchar(100) NOT NULL,
        [LastName] nvarchar(100) NOT NULL,
        [Role] nvarchar(50) NOT NULL DEFAULT N'Buyer',
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE TABLE [AgentProfiles] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] nvarchar(450) NOT NULL,
        [UserGuid] uniqueidentifier NOT NULL,
        [AgencyId] uniqueidentifier NULL,
        [Bio] nvarchar(2000) NULL,
        [PublicPhone] nvarchar(50) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_AgentProfiles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AgentProfiles_Agencies_AgencyId] FOREIGN KEY ([AgencyId]) REFERENCES [Agencies] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_AgentProfiles_Users_UserGuid] FOREIGN KEY ([UserGuid]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE TABLE [Properties] (
        [Id] uniqueidentifier NOT NULL,
        [OwnerId] nvarchar(450) NULL,
        [OwnerGuid] uniqueidentifier NULL,
        [Title] nvarchar(200) NOT NULL,
        [Description] nvarchar(2000) NOT NULL,
        [Price] decimal(18,2) NOT NULL,
        [Category] nvarchar(50) NOT NULL,
        [Purpose] nvarchar(50) NOT NULL DEFAULT N'Sale',
        [City] nvarchar(100) NOT NULL DEFAULT N'حلب',
        [CityArea] nvarchar(100) NOT NULL,
        [Address] nvarchar(300) NOT NULL,
        [Bedrooms] int NOT NULL,
        [Bathrooms] int NOT NULL,
        [AreaSquareMeters] float NOT NULL,
        [ImageUrls] nvarchar(max) NOT NULL,
        [Status] nvarchar(50) NOT NULL DEFAULT N'Available',
        [IsFeatured] bit NOT NULL DEFAULT CAST(0 AS bit),
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Properties] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Properties_Users_OwnerGuid] FOREIGN KEY ([OwnerGuid]) REFERENCES [Users] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE TABLE [FavoriteProperties] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [PropertyId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_FavoriteProperties] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_FavoriteProperties_Properties_PropertyId] FOREIGN KEY ([PropertyId]) REFERENCES [Properties] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_FavoriteProperties_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE TABLE [PropertyInquiries] (
        [Id] uniqueidentifier NOT NULL,
        [PropertyId] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Message] nvarchar(2000) NOT NULL,
        [PhoneNumber] nvarchar(50) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_PropertyInquiries] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PropertyInquiries_Properties_PropertyId] FOREIGN KEY ([PropertyId]) REFERENCES [Properties] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_PropertyInquiries_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE INDEX [IX_Agencies_CityArea] ON [Agencies] ([CityArea]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE INDEX [IX_Agencies_Name] ON [Agencies] ([Name]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE INDEX [IX_AgentProfiles_AgencyId] ON [AgentProfiles] ([AgencyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE UNIQUE INDEX [IX_AgentProfiles_UserGuid] ON [AgentProfiles] ([UserGuid]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE UNIQUE INDEX [IX_AgentProfiles_UserId] ON [AgentProfiles] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE INDEX [IX_FavoriteProperties_PropertyId] ON [FavoriteProperties] ([PropertyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE UNIQUE INDEX [IX_FavoriteProperties_UserId_PropertyId] ON [FavoriteProperties] ([UserId], [PropertyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE INDEX [IX_Properties_AreaSquareMeters] ON [Properties] ([AreaSquareMeters]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE INDEX [IX_Properties_Category_Status] ON [Properties] ([Category], [Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE INDEX [IX_Properties_CityArea_Status] ON [Properties] ([CityArea], [Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE INDEX [IX_Properties_CreatedAt] ON [Properties] ([CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE INDEX [IX_Properties_OwnerGuid] ON [Properties] ([OwnerGuid]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE INDEX [IX_Properties_OwnerId] ON [Properties] ([OwnerId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE INDEX [IX_Properties_Price] ON [Properties] ([Price]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE INDEX [IX_Properties_Purpose_Status] ON [Properties] ([Purpose], [Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE INDEX [IX_PropertyInquiries_PropertyId] ON [PropertyInquiries] ([PropertyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE INDEX [IX_PropertyInquiries_UserId] ON [PropertyInquiries] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260927195354_AddAgencyAndAgentProfile'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260927195354_AddAgencyAndAgentProfile', N'9.0.2');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260928064404_AddInquiryStatusAndAgentNotes'
)
BEGIN
    ALTER TABLE [PropertyInquiries] ADD [AgentNotes] nvarchar(2000) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260928064404_AddInquiryStatusAndAgentNotes'
)
BEGIN
    ALTER TABLE [PropertyInquiries] ADD [Status] nvarchar(50) NOT NULL DEFAULT N'New';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260928064404_AddInquiryStatusAndAgentNotes'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260928064404_AddInquiryStatusAndAgentNotes', N'9.0.2');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260928121047_AddNotificationsTable'
)
BEGIN
    CREATE TABLE [Notifications] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] nvarchar(450) NOT NULL,
        [UserGuid] uniqueidentifier NOT NULL,
        [Title] nvarchar(200) NOT NULL,
        [Message] nvarchar(1000) NOT NULL,
        [Type] nvarchar(50) NOT NULL,
        [ReferenceId] nvarchar(450) NULL,
        [IsRead] bit NOT NULL DEFAULT CAST(0 AS bit),
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Notifications] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Notifications_Users_UserGuid] FOREIGN KEY ([UserGuid]) REFERENCES [Users] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260928121047_AddNotificationsTable'
)
BEGIN
    CREATE INDEX [IX_Notifications_UserGuid] ON [Notifications] ([UserGuid]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260928121047_AddNotificationsTable'
)
BEGIN
    CREATE INDEX [IX_Notifications_UserId_IsRead_CreatedAt] ON [Notifications] ([UserId], [IsRead], [CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260928121047_AddNotificationsTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260928121047_AddNotificationsTable', N'9.0.2');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929111643_AddUserPhoneNumber'
)
BEGIN
    ALTER TABLE [Users] ADD [PhoneNumber] nvarchar(50) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929111643_AddUserPhoneNumber'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260929111643_AddUserPhoneNumber', N'9.0.2');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930131847_AddChatMessagesTable'
)
BEGIN
    CREATE TABLE [ChatMessages] (
        [Id] uniqueidentifier NOT NULL,
        [SenderId] nvarchar(450) NOT NULL,
        [SenderGuid] uniqueidentifier NOT NULL,
        [ReceiverId] nvarchar(450) NOT NULL,
        [ReceiverGuid] uniqueidentifier NOT NULL,
        [PropertyId] uniqueidentifier NULL,
        [Message] nvarchar(4000) NOT NULL,
        [IsRead] bit NOT NULL DEFAULT CAST(0 AS bit),
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_ChatMessages] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ChatMessages_Properties_PropertyId] FOREIGN KEY ([PropertyId]) REFERENCES [Properties] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_ChatMessages_Users_ReceiverGuid] FOREIGN KEY ([ReceiverGuid]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ChatMessages_Users_SenderGuid] FOREIGN KEY ([SenderGuid]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930131847_AddChatMessagesTable'
)
BEGIN
    CREATE INDEX [IX_ChatMessages_PropertyId] ON [ChatMessages] ([PropertyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930131847_AddChatMessagesTable'
)
BEGIN
    CREATE INDEX [IX_ChatMessages_ReceiverGuid] ON [ChatMessages] ([ReceiverGuid]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930131847_AddChatMessagesTable'
)
BEGIN
    CREATE INDEX [IX_ChatMessages_ReceiverId_IsRead] ON [ChatMessages] ([ReceiverId], [IsRead]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930131847_AddChatMessagesTable'
)
BEGIN
    CREATE INDEX [IX_ChatMessages_SenderGuid] ON [ChatMessages] ([SenderGuid]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930131847_AddChatMessagesTable'
)
BEGIN
    CREATE INDEX [IX_ChatMessages_SenderId_ReceiverId] ON [ChatMessages] ([SenderId], [ReceiverId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930131847_AddChatMessagesTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260930131847_AddChatMessagesTable', N'9.0.2');
END;

COMMIT;
GO

