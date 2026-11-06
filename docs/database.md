# Database Schema & Models — Aleppo Real Estate

## Database Provider
- **PostgreSQL** via `Npgsql.EntityFrameworkCore.PostgreSQL` (`ApplicationDbContext`), managed with **pgAdmin 4**.
- Also supports Microsoft SQL Server (`Microsoft.EntityFrameworkCore.SqlServer`) via configuration switch (`DatabaseProvider: "SqlServer"`).
- In-Memory database supported for fast unit testing and isolated dev mode.

### pgAdmin 4 Connection Details:
- **Host:** `localhost` (or `postgres` inside Docker)
- **Port:** `5432`
- **Database Name:** `aleppo_real_estate`
- **Username:** `postgres`
- **pgAdmin Web UI (Docker):** [http://localhost:5050](http://localhost:5050) (Login: `admin@aleppo.com` / `admin`)
- **Direct SQL DDL Script:** `src/Infrastructure/Migrations/postgres_schema.sql` (Paste into pgAdmin Query Tool to execute).

---

## Tables & Entities

### 1. `Properties` Table

| Column Name | Data Type | Nullable | Constraints / Index | Description |
|---|---|---|---|---|
| `Id` | `uniqueidentifier` | No | Primary Key | Unique identifier (Guid) |
| `OwnerId` | `nvarchar(450)` / `uniqueidentifier` | Yes | FK to Users(Id), Index | Owner / Creator of the property |
| `Title` | `nvarchar(200)` | No | Required | Title of the property listing (Arabic/English) |
| `Description` | `nvarchar(2000)` | No | Required | Detailed description |
| `Price` | `decimal(18,2)` | No | Min value: 0, Index | Listing price |
| `Category` | `nvarchar(50)` | No | Index | Property Category (`Apartment`, `Villa`, `Commercial`, `Land`) |
| `Purpose` | `nvarchar(50)` | No | Default: `Sale`, Index | Listing Purpose (`Sale` [للبيع], `Rent` [للإيجار]) |
| `City` | `nvarchar(100)` | No | Default: `حلب`, Index | City (`حلب`, `دمشق`, `اللاذقية`, etc.) |
| `CityArea` | `nvarchar(100)` | No | Index | Neighborhood/Area in Aleppo (`الشهباء`, `العزيزية`, `الفرقان`, etc.) |
| `Address` | `nvarchar(300)` | No | Required | Detailed address location |
| `Bedrooms` | `int` | No | Min value: 0, Index | Number of bedrooms |
| `Bathrooms` | `int` | No | Min value: 0, Index | Number of bathrooms |
| `AreaSquareMeters` | `double` | No | Min value: 0, Index | Surface area in $m^2$ |
| `ImageUrls` | `nvarchar(max)` | Yes | JSON / Delimited | Array of image URLs |
| `Status` | `nvarchar(50)` | No | Default: `Available`, Index | `Available`, `Pending`, `Sold`, `Rented`, `Archived` |
| `IsFeatured` | `bit` | No | Default: `false` | Featured listing flag |
| `CreatedAt` | `datetime2` | No | UTC timestamp, Index | Creation timestamp |
| `UpdatedAt` | `datetime2` | Yes | UTC timestamp | Last modification timestamp |

#### Database Performance Indexes:
- `IX_Properties_Category_Status`: Composite index for filtering available properties by category.
- `IX_Properties_CityArea_Status`: Composite index for neighborhood searches.
- `IX_Properties_Purpose_Status`: Composite index for filtering by purpose (Sale/Rent).
- `IX_Properties_Price`: Index for price range filtering and price sorting.
- `IX_Properties_AreaSquareMeters`: Index for area range filtering and area sorting.
- `IX_Properties_CreatedAt`: Index for latest properties sorting (`date_desc`).

---

### 2. `Users` Table (`ApplicationUser`)

| Column Name | Data Type | Nullable | Constraints / Index | Description |
|---|---|---|---|---|
| `Id` | `uniqueidentifier` / `string` | No | Primary Key | User unique identifier |
| `Email` | `nvarchar(256)` | No | Unique Index | User Email Address |
| `PasswordHash` | `nvarchar(max)` | No | Required | Hashed password |
| `FirstName` | `nvarchar(100)` | No | Required | First Name |
| `LastName` | `nvarchar(100)` | No | Required | Last Name |
| `PhoneNumber` | `nvarchar(50)` | Yes | Optional | Contact phone number |
| `Role` | `nvarchar(50)` | No | Default: `Buyer` | User Role (`Buyer`, `Agent`, `Admin`) |
| `CreatedAt` | `datetime2` | No | UTC timestamp | Registration timestamp |

---

### 3. `FavoriteProperties` Table

| Column Name | Data Type | Nullable | Constraints / Index | Description |
|---|---|---|---|---|
| `Id` | `uniqueidentifier` | No | Primary Key | Favorite record ID |
| `UserId` | `uniqueidentifier` / `string` | No | FK to Users(Id), Composite Unique Index (UserId, PropertyId) | User who bookmarked property |
| `PropertyId` | `uniqueidentifier` | No | FK to Properties(Id) | Bookmarked property |
| `CreatedAt` | `datetime2` | No | UTC timestamp | Bookmark timestamp |

---

### 4. `PropertyInquiries` Table

| Column Name | Data Type | Nullable | Constraints / Index | Description |
|---|---|---|---|---|
| `Id` | `uniqueidentifier` | No | Primary Key | Inquiry ID |
| `PropertyId` | `uniqueidentifier` | No | FK to Properties(Id), Index | Targeted property |
| `UserId` | `uniqueidentifier` / `string` | No | FK to Users(Id), Index | Submitting user (Buyer) |
| `Message` | `nvarchar(2000)` | No | Required | Inquiry message |
| `PhoneNumber` | `nvarchar(50)` | No | Required | Contact phone number |
| `Status` | `nvarchar(50)` | No | Default: `New`, Index | Inquiry lifecycle status (`New`, `Contacted`, `Closed`) |
| `AgentNotes` | `nvarchar(2000)` | Yes | Max 2000 chars | Private owner/agent notes (Internal to property owner) |
| `CreatedAt` | `datetime2` | No | UTC timestamp | Submission timestamp |
| `UpdatedAt` | `datetime2` | Yes | UTC timestamp | Last status/notes update timestamp |

---

### 5. `Agencies` Table

| Column Name | Data Type | Nullable | Constraints / Index | Description |
|---|---|---|---|---|
| `Id` | `uniqueidentifier` | No | Primary Key | Agency unique identifier (Guid) |
| `Name` | `nvarchar(200)` | No | Index | Agency / Real estate office commercial name |
| `Description` | `nvarchar(2000)` | Yes | Optional | Description / summary of agency services |
| `PhoneNumber` | `nvarchar(50)` | Yes | Optional | Public business phone contact number |
| `Address` | `nvarchar(300)` | Yes | Optional | Physical office address in Aleppo |
| `CityArea` | `nvarchar(100)` | Yes | Index | Neighborhood/Area in Aleppo (e.g. `الشهباء`) |
| `LogoUrl` | `nvarchar(1000)` | Yes | Optional | Agency logo / cover photo URL |
| `LicenseNumber` | `nvarchar(100)` | Yes | Optional | Agency commercial license / registration number |
| `CreatedAt` | `datetime2` | No | UTC timestamp | Registration timestamp |

#### Performance Indexes:
- `IX_Agencies_Name`: Index for searching agencies by name.
- `IX_Agencies_CityArea`: Index for filtering agencies by neighborhood.

---

### 6. `AgentProfiles` Table

| Column Name | Data Type | Nullable | Constraints / Index | Description |
|---|---|---|---|---|
| `Id` | `uniqueidentifier` | No | Primary Key | Agent Profile unique identifier (Guid) |
| `UserId` | `nvarchar(450)` | No | Unique Index, FK to Users(Id) | User identifier (where `Role == "Agent"`) |
| `AgencyId` | `uniqueidentifier` | Yes | Index, FK to Agencies(Id) | Nullable link to parent Agency entity |
| `Bio` | `nvarchar(2000)` | Yes | Optional | Personal agent biography / experience summary |
| `PublicPhone` | `nvarchar(50)` | Yes | Optional | Public business phone number for agent |
| `CreatedAt` | `datetime2` | No | UTC timestamp | Agent Profile creation timestamp |

#### Performance Indexes:
- `IX_AgentProfiles_UserId`: Unique index for 1-to-1 relationship with `Users`.
- `IX_AgentProfiles_AgencyId`: FK Index for fast retrieval of all agents belonging to an Agency.

---

### 7. `Notifications` Table

| Column Name | Data Type | Nullable | Constraints / Index | Description |
|---|---|---|---|---|
| `Id` | `uniqueidentifier` | No | Primary Key | Notification unique identifier (Guid) |
| `UserId` | `nvarchar(450)` | No | FK to Users(Id), Index | Recipient User ID |
| `Title` | `nvarchar(200)` | No | Required | Short notification title |
| `Message` | `nvarchar(1000)` | No | Required | Notification message body |
| `Type` | `nvarchar(50)` | No | Required | Type identifier (`InquiryReceived`, `InquiryStatusUpdated`) |
| `ReferenceId` | `nvarchar(450)` | Yes | Optional | Target entity ID reference (Points strictly to `InquiryId`) |
| `IsRead` | `bit` | No | Default: `false` | Read status flag |
| `CreatedAt` | `datetime2` | No | UTC timestamp | Creation timestamp |

#### Performance Index:
- `IX_Notifications_UserId_IsRead_CreatedAt`: Composite index on `(UserId, IsRead, CreatedAt)` suitable for recipient filtering, unread counting, and descending date sorting.

---

### 8. `ChatMessages` Table

| Column Name | Data Type | Nullable | Constraints / Index | Description |
|---|---|---|---|---|
| `Id` | `uniqueidentifier` | No | Primary Key | Chat message unique identifier (Guid) |
| `SenderId` | `nvarchar(450)` | No | Index (`IX_ChatMessages_SenderId_ReceiverId`) | Sender User ID string |
| `SenderGuid` | `uniqueidentifier` | No | FK to Users(Id), Restrict Delete | FK link to Users table for EF Core |
| `ReceiverId` | `nvarchar(450)` | No | Index (`IX_ChatMessages_SenderId_ReceiverId`, `IX_ChatMessages_ReceiverId_IsRead`) | Receiver User ID string |
| `ReceiverGuid` | `uniqueidentifier` | No | FK to Users(Id), Restrict Delete | FK link to Users table for EF Core |
| `PropertyId` | `uniqueidentifier` | Yes | FK to Properties(Id), SetNull Delete | Optional referenced property listing Guid |
| `Message` | `nvarchar(4000)` | No | Max length 4000 | Chat message text content |
| `IsRead` | `bit` | No | Default: `false`, Index (`IX_ChatMessages_ReceiverId_IsRead`) | Read status flag |
| `CreatedAt` | `datetime2` | No | UTC timestamp | Creation timestamp |
| `UpdatedAt` | `datetime2` | Yes | UTC timestamp | Last modification timestamp |

#### Performance Indexes:
- `IX_ChatMessages_SenderId_ReceiverId`: Composite index for retrieving chat history and grouping conversations between users.
- `IX_ChatMessages_ReceiverId_IsRead`: Composite index for calculating unread messages and filtering unread notifications per receiver.

---

### 9. Production Migration Script
A complete, idempotent SQL Server DDL script is maintained at `src/Infrastructure/Migrations/schema_idempotent.sql`. It can be run directly against any Microsoft SQL Server 2019/2022 instance to provision all tables, columns, foreign keys with restrict/cascade behaviors, and performance indexes without requiring .NET CLI tools on the database server.




