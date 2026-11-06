# API Contract Documentation — Aleppo Real Estate

This document serves as the single source of truth for REST APIs between Backend (ASP.NET Core) and Frontend (Angular).

---

## 1. System & Health

### GET `/api/health`
Checks the operational status of the backend API service.

- **HTTP Method:** `GET`
- **Route:** `/api/health`
- **Authentication:** Anonymous (None required)

#### Response (`200 OK`)
```json
{
  "status": "Healthy",
  "service": "AleppoRealEstate API",
  "version": "1.0.0",
  "timestampUtc": "2026-09-27T12:17:43.2827179Z"
}
```

---

## 2. Properties Management

### GET `/api/properties`
Retrieves a paginated, sorted, and filterable list of real estate properties (Server-side database execution using EF Core `AsNoTracking()` & Expression projections).

- **HTTP Method:** `GET`
- **Route:** `/api/properties`
- **Authentication:** Anonymous

#### Response (`200 OK`)
```json
{
  "items": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "ownerId": "3fa85f64-5717-4562-b3fc-2c963f66b111",
      "ownerName": "وكيل عقارات الشهباء",
      "title": "شقة فاخرة للبيع في حي الشهباء",
      "description": "شقة سكنية مميزة بتشطيبات عالية الجودة",
      "price": 250000.00,
      "category": "Apartment",
      "purpose": "Sale",
      "city": "حلب",
      "cityArea": "الشهباء",
      "address": "شارع النيل - قرب الحديقة العامة",
      "bedrooms": 3,
      "bathrooms": 2,
      "areaSquareMeters": 180.5,
      "imageUrls": [
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa"
      ],
      "status": "Available",
      "isFeatured": true,
      "createdAt": "2026-09-27T12:00:00Z"
    }
  ],
  "totalCount": 1,
  "pageNumber": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

---

### GET `/api/properties/my`
Retrieves all real estate property listings created by the current authenticated user.

- **HTTP Method:** `GET`
- **Route:** `/api/properties/my`
- **Authentication:** Required (`Bearer <token>`)

---

### GET `/api/properties/{id}`
Retrieves detailed information for a single property by its unique ID (Hides archived properties from anonymous public requests).

- **HTTP Method:** `GET`
- **Route:** `/api/properties/{id}`
- **Authentication:** Anonymous

#### Response (`200 OK`)
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "ownerId": "3fa85f64-5717-4562-b3fc-2c963f66b111",
  "ownerName": "وكيل عقارات الشهباء",
  "title": "شقة فاخرة للبيع في حي الشهباء",
  "description": "شقة سكنية مميزة بتشطيبات عالية الجودة، إطلالة رائعة على شارع النيل وموقع هادئ قريب من جميع الخدمات.",
  "price": 250000.00,
  "category": "Apartment",
  "purpose": "Sale",
  "city": "حلب",
  "cityArea": "الشهباء",
  "address": "شارع النيل - قرب الحديقة العامة",
  "bedrooms": 3,
  "bathrooms": 2,
  "areaSquareMeters": 180.5,
  "imageUrls": [
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
  ],
  "status": "Available",
  "isFeatured": true,
  "createdAt": "2026-09-27T12:00:00Z"
}
```

#### Error Responses
- `404 Not Found`: `{ "error": "Property with ID {id} was not found or is no longer available." }`

---

### POST `/api/properties`
Creates a new property listing assigned to the current user as owner.

- **HTTP Method:** `POST`
- **Route:** `/api/properties`
- **Authentication:** Required (`Bearer <token>`)

---

### PUT `/api/properties/{id}`
Updates an existing property listing (Enforces ownership verification: `OwnerId == currentUserId` or `Admin`).

- **HTTP Method:** `PUT`
- **Route:** `/api/properties/{id}`
- **Authentication:** Required (`Bearer <token>`)

---

### DELETE `/api/properties/{id}`
Deletes or archives a property listing (Enforces ownership verification).

- **HTTP Method:** `DELETE`
- **Route:** `/api/properties/{id}`
- **Authentication:** Required (`Bearer <token>`)

---

## 3. Authentication & User Management

### POST `/api/auth/register`
Registers a new user account.

- **HTTP Method:** `POST`
- **Route:** `/api/auth/register`
- **Authentication:** Anonymous

---

### POST `/api/auth/login`
Authenticates a user with email and password, returning a JWT token.

- **HTTP Method:** `POST`
- **Route:** `/api/auth/login`
- **Authentication:** Anonymous

---

### GET `/api/auth/me`
Retrieves current authenticated user's profile info.

- **HTTP Method:** `GET`
- **Route:** `/api/auth/me`
- **Authentication:** Required (`Bearer <token>`)

---

## 4. Favorites Management

### POST `/api/favorites/{propertyId}`
Adds a property to the current user's list of bookmarked favorites.

- **HTTP Method:** `POST`
- **Route:** `/api/favorites/{propertyId}`
- **Authentication:** Required (`Bearer <token>`)

---

### DELETE `/api/favorites/{propertyId}`
Removes a property from the current user's list of bookmarked favorites.

- **HTTP Method:** `DELETE`
- **Route:** `/api/favorites/{propertyId}`
- **Authentication:** Required (`Bearer <token>`)

---

### GET `/api/favorites`
Retrieves all properties bookmarked as favorites by the current authenticated user.

- **HTTP Method:** `GET`
- **Route:** `/api/favorites`
- **Authentication:** Required (`Bearer <token>`)

---

## 5. Property Inquiries

### POST `/api/inquiries`
Submits a user inquiry for a specific property listing. Sets default status `New`.

- **HTTP Method:** `POST`
- **Route:** `/api/inquiries`
- **Authentication:** Required (`Bearer <token>`)

---

### GET `/api/inquiries/my`
Retrieves all property inquiries submitted by the current authenticated user (Buyer). Projects `status` and `updatedAt`, but strictly omits `agentNotes`.

- **HTTP Method:** `GET`
- **Route:** `/api/inquiries/my`
- **Authentication:** Required (`Bearer <token>`)

#### Response (`200 OK`)
```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66b999",
    "propertyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "propertyTitle": "شقة فاخرة للبيع في حي الشهباء",
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66b111",
    "userName": "مشتري تجريبي",
    "message": "أرغب بمعاينة الشقة يوم الغد.",
    "phoneNumber": "+963911222333",
    "status": "Contacted",
    "createdAt": "2026-09-28T09:00:00Z",
    "updatedAt": "2026-09-28T09:15:00Z"
  }
]
```

---

### GET `/api/inquiries/received`
Retrieves a paginated list of inquiries received for properties owned by the current authenticated user (`Property.OwnerId == currentUserId`).

- **HTTP Method:** `GET`
- **Route:** `/api/inquiries/received`
- **Authentication:** Required (`Bearer <token>`)
- **Query Parameters:**
  - `status` (string?): Optional filter (`New`, `Contacted`, `Closed`).
  - `pageNumber` (int, default 1).
  - `pageSize` (int, default 10).

#### Response (`200 OK`)
```json
{
  "items": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66b999",
      "propertyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "propertyTitle": "شقة فاخرة للبيع في حي الشهباء",
      "userId": "3fa85f64-5717-4562-b3fc-2c963f66b111",
      "buyerName": "مشتري تجريبي",
      "phoneNumber": "+963911222333",
      "message": "أرغب بمعاينة الشقة يوم الغد.",
      "status": "New",
      "agentNotes": "تم استلام الطلب وقيد التواصل.",
      "createdAt": "2026-09-28T09:00:00Z",
      "updatedAt": "2026-09-28T09:15:00Z"
    }
  ],
  "totalCount": 1,
  "pageNumber": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

---

### PUT `/api/inquiries/{id}/status`
Updates the status and private notes (`AgentNotes`) of an inquiry for a property owned by the current user (`Property.OwnerId == currentUserId` or Admin). Sets `UpdatedAt` timestamp.

- **HTTP Method:** `PUT`
- **Route:** `/api/inquiries/{id}/status`
- **Authentication:** Required (`Bearer <token>`)

#### Request Body
```json
{
  "status": "Contacted",
  "agentNotes": "تم الاتصال بالعميل وسيتم إجراء المعاينة يوم الثلاثاء."
}
```

#### Response (`200 OK`)
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66b999",
  "status": "Contacted",
  "agentNotes": "تم الاتصال بالعميل وسيتم إجراء المعاينة يوم الثلاثاء.",
  "updatedAt": "2026-09-28T09:30:00Z"
}
```

#### Error Responses
- `401 Unauthorized`: Authentication token missing or invalid.
- `403 Forbidden`: Authenticated user is not the owner of the property associated with this inquiry.
- `404 Not Found`: Inquiry ID does not exist.


---

## 6. Property Images Management

### POST `/api/properties/{id}/images`
Uploads image files to a property listing. Validates file extension (`.jpg`, `.jpeg`, `.png`, `.webp`) and max file size (5MB). Enforces ownership (`OwnerId == currentUserId` or Admin).

- **HTTP Method:** `POST`
- **Route:** `/api/properties/{id}/images`
- **Content-Type:** `multipart/form-data`
- **Authentication:** Required (`Bearer <token>`)

---

### DELETE `/api/properties/{id}/images`
Deletes an image URL from a property listing and deletes the physical file. Enforces ownership.

- **HTTP Method:** `DELETE`
- **Route:** `/api/properties/{id}/images`
- **Authentication:** Required (`Bearer <token>`)

---

### PUT `/api/properties/{id}/images/primary`
Sets a specific image URL as the primary/cover image for the property listing. Enforces ownership.

- **HTTP Method:** `PUT`
- **Route:** `/api/properties/{id}/images/primary`
- **Authentication:** Required (`Bearer <token>`)

---

## 7. User Dashboard

### GET `/api/dashboard`
Retrieves aggregated statistics, recent properties, recent favorites, and recent inquiries for the current authenticated user.

- **HTTP Method:** `GET`
- **Route:** `/api/dashboard`
- **Authentication:** Required (`Bearer <token>`)

---

## 8. Agents & Agencies Management

### GET `/api/agents`
Retrieves a paginated list of real estate agents/agencies with active property counts.

- **HTTP Method:** `GET`
- **Route:** `/api/agents`
- **Authentication:** Anonymous (Public)
- **Query Parameters:**
  - `searchTerm` (string): Filter by agent name or agency name.
  - `cityArea` (string): Filter by neighborhood in Aleppo.
  - `pageNumber` (int, default 1).
  - `pageSize` (int, default 10).

#### Response (`200 OK`)
```json
{
  "items": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66b111",
      "name": "وكيل تجريبي 01",
      "agencyId": "3fa85f64-5717-4562-b3fc-2c963f66b222",
      "agencyName": "مكتب تجريبي 01",
      "bio": "وكيل عقاري تجريبي متخصص في العقارات السكنية بحلب.",
      "publicPhone": "+963911000001",
      "address": "حي الشهباء - شارع التجربة",
      "cityArea": "الشهباء",
      "logoUrl": "https://images.unsplash.com/photo-1560518883-ce09059eeffa",
      "licenseNumber": "ALE-DEMO-01",
      "activePropertiesCount": 5,
      "createdAt": "2026-09-27T12:00:00Z"
    }
  ],
  "totalCount": 1,
  "pageNumber": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

---

### GET `/api/agents/{id}`
Retrieves detailed profile information for a specific real estate agent/agency by User ID (`id`).

- **HTTP Method:** `GET`
- **Route:** `/api/agents/{id}`
- **Authentication:** Anonymous (Public)

#### Response (`200 OK`)
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66b111",
  "name": "وكيل تجريبي 01",
  "agencyId": "3fa85f64-5717-4562-b3fc-2c963f66b222",
  "agencyName": "مكتب تجريبي 01",
  "agencyDescription": "مكتب تجريبي لتقديم الخدمات العقارية في حلب.",
  "bio": "وكيل عقاري تجريبي متخصص في العقارات السكنية بحلب.",
  "publicPhone": "+963911000001",
  "agencyPhone": "+963212000001",
  "address": "حي الشهباء - شارع التجربة",
  "cityArea": "الشهباء",
  "logoUrl": "https://images.unsplash.com/photo-1560518883-ce09059eeffa",
  "licenseNumber": "ALE-DEMO-01",
  "activePropertiesCount": 5,
  "createdAt": "2026-09-27T12:00:00Z"
}
```

#### Error Responses
- `404 Not Found`: `{ "error": "Agent with ID {id} was not found." }`

---

### GET `/api/agents/{id}/properties`
Retrieves a paginated list of public active properties owned by the specific agent (`id`). Excludes archived properties automatically.

- **HTTP Method:** `GET`
- **Route:** `/api/agents/{id}/properties`
- **Authentication:** Anonymous (Public)
- **Query Parameters:** `pageNumber` (default 1), `pageSize` (default 10).

#### Response (`200 OK`)
```json
{
  "items": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "ownerId": "3fa85f64-5717-4562-b3fc-2c963f66b111",
      "ownerName": "وكيل تجريبي 01",
      "title": "شقة تجريبية للبيع في حي الشهباء",
      "price": 250000.00,
      "category": "Apartment",
      "purpose": "Sale",
      "city": "حلب",
      "cityArea": "الشهباء",
      "status": "Available"
    }
  ],
  "totalCount": 1,
  "pageNumber": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

---

### PUT `/api/agents/me`
Updates the current authenticated agent's profile (`Bio`, `PublicPhone`, `AgencyId`).

- **HTTP Method:** `PUT`
- **Route:** `/api/agents/me`
- **Authentication:** Required (`Bearer <token>`, `Role == "Agent"`)

#### Request Body
```json
{
  "bio": "السيرة الذاتية السريعة للوكيل العقاري التجريبي.",
  "publicPhone": "+963911000001",
  "agencyId": "3fa85f64-5717-4562-b3fc-2c963f66b222"
}
```

#### Response (`200 OK`)
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66b111",
  "name": "وكيل تجريبي 01",
  "bio": "السيرة الذاتية السريعة للوكيل العقاري التجريبي.",
  "publicPhone": "+963911000001",
  "agencyId": "3fa85f64-5717-4562-b3fc-2c963f66b222"
}
```

#### Error Responses
- `401 Unauthorized`: Token missing or invalid.
- `403 Forbidden`: Authenticated user is not an `Agent` (e.g. `Buyer`).

---

### GET `/api/agencies`
Retrieves a paginated list of real estate agencies/offices.

- **HTTP Method:** `GET`
- **Route:** `/api/agencies`
- **Authentication:** Anonymous (Public)

#### Response (`200 OK`)
```json
{
  "items": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66b222",
      "name": "مكتب تجريبي 01",
      "description": "مكتب خدمات عقارية تجريبي بحلب.",
      "phoneNumber": "+963212000001",
      "address": "حي الشهباء - شارع التجربة",
      "cityArea": "الشهباء",
      "logoUrl": "https://images.unsplash.com/photo-1560518883-ce09059eeffa",
      "licenseNumber": "ALE-DEMO-01",
      "agentsCount": 2,
      "activePropertiesCount": 10,
      "createdAt": "2026-09-27T12:00:00Z"
    }
  ],
  "totalCount": 1,
  "pageNumber": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

---

### GET `/api/agencies/{id}`
Retrieves detailed profile information for a specific real estate agency by `id`.

- **HTTP Method:** `GET`
- **Route:** `/api/agencies/{id}`
- **Authentication:** Anonymous (Public)

#### Response (`200 OK`)
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66b333",
  "name": "مكتب تجريبي 01",
  "description": "مكتب خدمات عقارية تجريبي بحلب.",
  "phoneNumber": "+963212000001",
  "address": "حي الشهباء - شارع التجربة",
  "cityArea": "الشهباء",
  "logoUrl": "https://images.unsplash.com/photo-1560518883-ce09059eeffa",
  "licenseNumber": "ALE-DEMO-01",
  "agentsCount": 1,
  "activePropertiesCount": 3,
  "agents": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66b222",
      "name": "سامر العقاري",
      "agencyId": "3fa85f64-5717-4562-b3fc-2c963f66b333",
      "agencyName": "مكتب تجريبي 01",
      "bio": "وكيل عقاري تجريبي متخصص في العقارات السكنية بحلب.",
      "publicPhone": "+963911000001",
      "address": "حي الشهباء - شارع التجربة",
      "cityArea": "الشهباء",
      "logoUrl": "https://images.unsplash.com/photo-1560518883-ce09059eeffa",
      "licenseNumber": "ALE-DEMO-01",
      "activePropertiesCount": 3,
      "createdAt": "2026-09-27T12:00:00Z"
    }
  ],
  "createdAt": "2026-09-27T12:00:00Z"
}
```

#### Error Responses
- `404 Not Found`: `{ "error": "Agency with ID {id} was not found." }`

---

### POST `/api/agencies`
Creates a new real estate agency / office entry (`Role == "Agent"` or `Admin`).

- **HTTP Method:** `POST`
- **Route:** `/api/agencies`
- **Authentication:** Required (`Bearer <token>`, `Role == "Agent"` or `Admin`)

#### Request Body
```json
{
  "name": "مكتب الشهباء العقاري الممتاز",
  "description": "مكتب عقاري متكامل في حي الشهباء",
  "phoneNumber": "021-444555",
  "address": "شارع الشهباء الرئيسي",
  "cityArea": "الشهباء",
  "logoUrl": "https://images.unsplash.com/photo-1560518883-ce09059eeffa",
  "licenseNumber": "LIC-998877"
}
```

#### Response (`200 OK` / `201 Created`)
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66b555",
  "name": "مكتب الشهباء العقاري الممتاز",
  "description": "مكتب عقاري متكامل في حي الشهباء",
  "phoneNumber": "021-444555",
  "address": "شارع الشهباء الرئيسي",
  "cityArea": "الشهباء",
  "logoUrl": "https://images.unsplash.com/photo-1560518883-ce09059eeffa",
  "licenseNumber": "LIC-998877",
  "createdAt": "2026-09-29T12:00:00Z"
}
```

---

### PUT `/api/agencies/{id}`
Updates an existing real estate agency / office details (`Role == "Agent"` or `Admin`).

- **HTTP Method:** `PUT`
- **Route:** `/api/agencies/{id}`
- **Authentication:** Required (`Bearer <token>`, `Role == "Agent"` or `Admin`)

#### Request Body
```json
{
  "name": "مكتب الشهباء العقاري المطور",
  "description": "مكتب عقاري متكامل ومطور في حي الشهباء",
  "phoneNumber": "021-444555",
  "address": "شارع الشهباء الرئيسي - بناء 12",
  "cityArea": "الشهباء",
  "logoUrl": "https://images.unsplash.com/photo-1560518883-ce09059eeffa",
  "licenseNumber": "LIC-998877"
}
```

#### Response (`200 OK`)
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66b555",
  "name": "مكتب الشهباء العقاري المطور",
  "description": "مكتب عقاري متكامل ومطور في حي الشهباء",
  "phoneNumber": "021-444555",
  "address": "شارع الشهباء الرئيسي - بناء 12",
  "cityArea": "الشهباء",
  "logoUrl": "https://images.unsplash.com/photo-1560518883-ce09059eeffa",
  "licenseNumber": "LIC-998877",
  "createdAt": "2026-09-29T12:00:00Z"
}
```


---

## 8. In-App Notifications

### GET `/api/notifications`
Retrieves a paginated list of notifications for the current authenticated user (`UserId == currentUserId`), ordered by `CreatedAt` descending.

- **HTTP Method:** `GET`
- **Route:** `/api/notifications`
- **Authentication:** Required (`Bearer <token>`)
- **Query Parameters:**
  - `pageNumber` (int, default 1)
  - `pageSize` (int, default 10)
  - `unreadOnly` (bool, default false)

#### Response (`200 OK`)
```json
{
  "items": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66c111",
      "title": "استفسار جديد على عقارك",
      "message": "لديك استفسار جديد حول عقارك شقة فاخرة للبيع في حي الشهباء من المستخدم مشتري تجريبي.",
      "type": "InquiryReceived",
      "referenceId": "3fa85f64-5717-4562-b3fc-2c963f66b999",
      "isRead": false,
      "createdAt": "2026-09-28T12:00:00Z"
    }
  ],
  "totalCount": 1,
  "pageNumber": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

---

### GET `/api/notifications/unread-count`
Retrieves total unread notifications count for the current authenticated user (`UserId == currentUserId AND IsRead == false`).

- **HTTP Method:** `GET`
- **Route:** `/api/notifications/unread-count`
- **Authentication:** Required (`Bearer <token>`)

#### Response (`200 OK`)
```json
{
  "unreadCount": 3
}
```

---

### PUT `/api/notifications/{id}/read`
Marks a specific notification as read for the current user. Returns `404 Not Found` if notification does not exist or does not belong to the user.

- **HTTP Method:** `PUT`
- **Route:** `/api/notifications/{id}/read`
- **Authentication:** Required (`Bearer <token>`)

#### Response (`200 OK` or `204 No Content`)

---

### PUT `/api/notifications/read-all`
Marks all notifications as read for the current authenticated user (`UserId == currentUserId`).

- **HTTP Method:** `PUT`
- **Route:** `/api/notifications/read-all`
- **Authentication:** Required (`Bearer <token>`)

#### Response (`200 OK`)

---

## 9. User Profile & Security Settings

### GET `/api/users/profile`
Retrieves detailed profile information for the current authenticated user (`UserId == currentUserId`).

- **HTTP Method:** `GET`
- **Route:** `/api/users/profile`
- **Authentication:** Required (`Bearer <token>`)

#### Response (`200 OK`)
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66b111",
  "email": "buyer@aleppo.com",
  "firstName": "مشتري",
  "lastName": "تجريبي",
  "phoneNumber": "+963911000999",
  "role": "Buyer",
  "createdAt": "2026-09-28T09:00:00Z"
}
```

---

### PUT `/api/users/profile`
Updates personal profile information (`firstName`, `lastName`, `phoneNumber`) for the current authenticated user (`UserId == currentUserId`). Email, Role, Id, and CreatedAt are strictly read-only and cannot be modified.

- **HTTP Method:** `PUT`
- **Route:** `/api/users/profile`
- **Authentication:** Required (`Bearer <token>`)

#### Request Body
```json
{
  "firstName": "أحمد",
  "lastName": "الحلبي",
  "phoneNumber": "+963911222333"
}
```

#### Response (`200 OK`)
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66b111",
  "email": "buyer@aleppo.com",
  "firstName": "أحمد",
  "lastName": "الحلبي",
  "phoneNumber": "+963911222333",
  "role": "Buyer",
  "createdAt": "2026-09-28T09:00:00Z"
}
```

---

### PUT `/api/users/change-password`
Changes the account password for the current authenticated user. Verifies `currentPassword` using existing `IPasswordHasher` and enforces `newPassword` minimum length of 6 characters.

- **HTTP Method:** `PUT`
- **Route:** `/api/users/change-password`
- **Authentication:** Required (`Bearer <token>`)

#### Request Body
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewStrongPassword456!"
}
```

#### Response (`200 OK`)
```json
{
  "message": "تم تغيير كلمة المرور بنجاح."
}
```

#### Error Responses
- `400 Bad Request`: `{ "error": "كلمة المرور الحالية غير صحيحة." }`

---

## 10. Direct Property Chat Management

### GET `/api/chat/conversations`
Retrieves a list of all active chat conversations for the authenticated user, grouped by contact person with unread count and latest message timestamp, sorted descending by `lastMessageTime`.

- **HTTP Method:** `GET`
- **Route:** `/api/chat/conversations`
- **Authentication:** Required (`Bearer <token>`)

#### Response (`200 OK`)
```json
[
  {
    "otherUserId": "3fa85f64-5717-4562-b3fc-2c963f66b222",
    "otherUserName": "سامر العقاري",
    "otherUserRole": "Agent",
    "otherUserPhone": "+963911000001",
    "lastMessage": "ممتاز، يناسبني الساعة الخامسة مساءً.",
    "unreadCount": 1,
    "lastMessageTime": "2026-09-30T12:00:00Z",
    "propertyId": "4a123f64-5717-4562-b3fc-2c963f66bba7",
    "propertyTitle": "فيلا مستقلة مع حديقة في الفرقان"
  }
]
```

#### Error Responses
- `401 Unauthorized`: Token missing or invalid.

---

### GET `/api/chat/messages/{otherUserId}`
Retrieves chat message history between the current authenticated user and `otherUserId`. Automatically marks unread incoming messages as `isRead = true`. Optionally filters by `propertyId`.

- **HTTP Method:** `GET`
- **Route:** `/api/chat/messages/{otherUserId}`
- **Authentication:** Required (`Bearer <token>`)
- **Query Parameters:**
  - `propertyId` (Guid?): Optional property filter.

#### Response (`200 OK`)
```json
[
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "senderId": "3fa85f64-5717-4562-b3fc-2c963f66b111",
    "receiverId": "3fa85f64-5717-4562-b3fc-2c963f66b222",
    "propertyId": "4a123f64-5717-4562-b3fc-2c963f66bba7",
    "propertyTitle": "فيلا مستقلة مع حديقة في الفرقان",
    "message": "مرحباً، هل الفيلا ما زالت متاحة للمعاينة؟",
    "isRead": true,
    "createdAt": "2026-09-30T10:00:00Z"
  }
]
```

#### Error Responses
- `401 Unauthorized`: Token missing or invalid.

---

### POST `/api/chat/send`
Sends a direct chat message to another user, optionally referencing a property listing. Atomically creates a system notification for the receiver (`Type == "ChatMessageReceived"`).

- **HTTP Method:** `POST`
- **Route:** `/api/chat/send`
- **Authentication:** Required (`Bearer <token>`)

#### Request Body
```json
{
  "receiverId": "3fa85f64-5717-4562-b3fc-2c963f66b222",
  "propertyId": "4a123f64-5717-4562-b3fc-2c963f66bba7",
  "message": "مرحباً أستاذ سامر، أود تأكيد موعدنا اليوم."
}
```

#### Validation Rules
- `receiverId`: Required (non-empty).
- `message`: Required (non-empty, max 4000 characters).

#### Response (`200 OK`)
```json
{
  "id": "f13c0f42-f91a-45e5-ac17-070835a002db",
  "senderId": "3fa85f64-5717-4562-b3fc-2c963f66b111",
  "receiverId": "3fa85f64-5717-4562-b3fc-2c963f66b222",
  "propertyId": "4a123f64-5717-4562-b3fc-2c963f66bba7",
  "propertyTitle": "فيلا مستقلة مع حديقة في الفرقان",
  "message": "مرحباً أستاذ سامر، أود تأكيد موعدنا اليوم.",
  "isRead": false,
  "createdAt": "2026-09-30T13:23:10Z"
}
```

#### Error Responses
- `400 Bad Request`: Validation failure.
- `401 Unauthorized`: Token missing or invalid.
- `404 Not Found`: Receiver ID does not exist.





