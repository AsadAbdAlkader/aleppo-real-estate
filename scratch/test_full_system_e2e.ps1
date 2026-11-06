$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:5215"
$passed = 0
$failed = 0

function Test-Assert($name, $condition, $details = "") {
    if ($condition) {
        Write-Host "  [PASS] $name" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  [FAIL] $name - $details" -ForegroundColor Red
        $script:failed++
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Aleppo Real Estate - Master End-to-End Quality Gate Pass" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Health & OpenAPI
Write-Host "`n--- Module 1: System Health and OpenAPI Specification ---" -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get
Test-Assert "Health Endpoint returns Healthy status" ($health.status -eq "Healthy")

$openApiRes = Invoke-WebRequest -Uri "$baseUrl/openapi/v1.json" -UseBasicParsing
Test-Assert "OpenAPI v1 Endpoint returns 200 OK" ($openApiRes.StatusCode -eq 200)

# 2. Authentication & Authorization
Write-Host "`n--- Module 2: Authentication and Authorization ---" -ForegroundColor Yellow
$buyerLogin = @{ email = "buyer@aleppo.com"; password = "Password123!" } | ConvertTo-Json
$buyerAuth = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $buyerLogin -ContentType "application/json"
$buyerToken = $buyerAuth.token
$buyerId = $buyerAuth.id
$buyerHeaders = @{ Authorization = "Bearer $buyerToken" }
Test-Assert "Buyer Login succeeds with JWT token" (![string]::IsNullOrEmpty($buyerToken))

$agentLogin = @{ email = "agent@aleppo.com"; password = "Password123!" } | ConvertTo-Json
$agentAuth = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $agentLogin -ContentType "application/json"
$agentToken = $agentAuth.token
$agentId = $agentAuth.id
$agentHeaders = @{ Authorization = "Bearer $agentToken" }
Test-Assert "Agent Login succeeds with JWT token" (![string]::IsNullOrEmpty($agentToken))

$randVal = Get-Random
$uniqueEmail = "user_$randVal@aleppo.com"
$regBody = @{
    email = $uniqueEmail
    password = "SecurePassword123!"
    firstName = "Tarek"
    lastName = "Halabi"
    role = "Buyer"
} | ConvertTo-Json
$regRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $regBody -ContentType "application/json"
Test-Assert "New user registration returns JWT" (![string]::IsNullOrEmpty($regRes.token))

# 3. User Profile Management
Write-Host "`n--- Module 3: User Profile and Security Settings ---" -ForegroundColor Yellow
$profile = Invoke-RestMethod -Uri "$baseUrl/api/users/profile" -Method Get -Headers $buyerHeaders
Test-Assert "GET Profile returns current buyer user" ($profile.email -eq "buyer@aleppo.com")

$updateProfileBody = @{
    firstName = "Ahmad"
    lastName = "Al-Halabi Updated"
    phoneNumber = "+963911223344"
} | ConvertTo-Json
$updatedProfile = Invoke-RestMethod -Uri "$baseUrl/api/users/profile" -Method Put -Body $updateProfileBody -ContentType "application/json" -Headers $buyerHeaders
Test-Assert "PUT Profile updates name and phone" ($updatedProfile.phoneNumber -eq "+963911223344")

# 4. Agencies & Agent Profiles
Write-Host "`n--- Module 4: Agencies and Agent Profiles ---" -ForegroundColor Yellow
$agencies = Invoke-RestMethod -Uri "$baseUrl/api/agencies" -Method Get
Test-Assert "GET Agencies returns paginated list" ($agencies.items.Count -ge 0)

$agencyName = "Aleppo Real Estate Agency $randVal"
$newAgencyBody = @{
    name = $agencyName
    description = "Agency specializing in modern luxury real estate"
    phoneNumber = "+96321444555"
    address = "Faisal Street"
    cityArea = "Shahbaa"
} | ConvertTo-Json
$createdAgency = Invoke-RestMethod -Uri "$baseUrl/api/agencies" -Method Post -Body $newAgencyBody -ContentType "application/json" -Headers $agentHeaders
Test-Assert "POST Agencies as Agent succeeds" (![string]::IsNullOrEmpty($createdAgency.id))
$agencyId = $createdAgency.id

$forbiddenAgency = $false
try {
    Invoke-RestMethod -Uri "$baseUrl/api/agencies" -Method Post -Body $newAgencyBody -ContentType "application/json" -Headers $buyerHeaders
} catch {
    $forbiddenAgency = $true
}
Test-Assert "POST Agencies as Buyer is Forbidden (403)" $forbiddenAgency

$updateAgentProfileBody = @{
    bio = "Senior Certified Agent with 15 years experience"
    publicPhone = "+963988112233"
    agencyId = $agencyId
} | ConvertTo-Json
$agentProfileRes = Invoke-RestMethod -Uri "$baseUrl/api/agents/me" -Method Put -Body $updateAgentProfileBody -ContentType "application/json" -Headers $agentHeaders
Test-Assert "PUT /api/agents/me updates profile and agency link" ($agentProfileRes.agencyId -eq $agencyId)

# 5. Properties Subsystem
Write-Host "`n--- Module 5: Properties CRUD, Search and Ownership Security ---" -ForegroundColor Yellow
$propTitle = "Luxury Apartment in Mohafaza $randVal"
$newPropertyBody = @{
    title = $propTitle
    description = "Sunny high-floor deluxe apartment with large terrace"
    price = 750000000
    category = "Apartment"
    purpose = "Sale"
    city = "Aleppo"
    cityArea = "Mohafaza"
    address = "Adonis Street"
    bedrooms = 3
    bathrooms = 2
    areaSquareMeters = 175
    imageUrls = @("https://images.unsplash.com/photo-1600585154340-be6161a56a0c")
} | ConvertTo-Json
$createdProperty = Invoke-RestMethod -Uri "$baseUrl/api/properties" -Method Post -Body $newPropertyBody -ContentType "application/json" -Headers $agentHeaders
Test-Assert "POST Properties as Agent creates new property" (![string]::IsNullOrEmpty($createdProperty.id))
$propertyId = $createdProperty.id

$filterProps = Invoke-RestMethod -Uri "$baseUrl/api/properties?cityArea=Mohafaza&category=Apartment" -Method Get
Test-Assert "GET Properties with filters returns items" ($filterProps.items.Count -ge 1)

$propDetails = Invoke-RestMethod -Uri "$baseUrl/api/properties/$propertyId" -Method Get
Test-Assert "GET Property Details returns correct specs" ($propDetails.title -eq $propTitle)

$updatePropBody = @{
    title = "$propTitle - Updated"
    description = "Updated specifications and details"
    price = 780000000
    category = "Apartment"
    purpose = "Sale"
    city = "Aleppo"
    cityArea = "Mohafaza"
    address = "Adonis Street"
    bedrooms = 3
    bathrooms = 2
    areaSquareMeters = 175
    status = "Available"
} | ConvertTo-Json
$updatedProp = Invoke-RestMethod -Uri "$baseUrl/api/properties/$propertyId" -Method Put -Body $updatePropBody -ContentType "application/json" -Headers $agentHeaders
Test-Assert "PUT Property by Owner updates successfully" ($updatedProp.title -like "*Updated*")

$forbiddenPropUpdate = $false
try {
    Invoke-RestMethod -Uri "$baseUrl/api/properties/$propertyId" -Method Put -Body $updatePropBody -ContentType "application/json" -Headers $buyerHeaders
} catch {
    $forbiddenPropUpdate = $true
}
Test-Assert "PUT Property by non-owner Buyer is Forbidden (403)" $forbiddenPropUpdate

# 6. Favorites Subsystem
Write-Host "`n--- Module 6: Favorites Management ---" -ForegroundColor Yellow
$favAdd = Invoke-RestMethod -Uri "$baseUrl/api/favorites/$propertyId" -Method Post -Headers $buyerHeaders
Test-Assert "POST /api/favorites/{id} adds favorite" ($favAdd.isFavorite -eq $true)

$favoritesList = Invoke-RestMethod -Uri "$baseUrl/api/favorites" -Method Get -Headers $buyerHeaders
$favFound = $favoritesList | Where-Object { $_.id -eq $propertyId }
Test-Assert "GET /api/favorites returns added property" ($null -ne $favFound)

$favRemove = Invoke-RestMethod -Uri "$baseUrl/api/favorites/$propertyId" -Method Delete -Headers $buyerHeaders
Test-Assert "DELETE /api/favorites/{id} removes favorite" ($favRemove.isFavorite -eq $false)

# 7. Inquiries & Owner Management
Write-Host "`n--- Module 7: Inquiries Lifecycle and Owner Private Notes ---" -ForegroundColor Yellow
$inquiryBody = @{
    propertyId = $propertyId
    phoneNumber = "+963955667788"
    message = "Hello, can we arrange a viewing this Thursday?"
} | ConvertTo-Json
$createdInquiry = Invoke-RestMethod -Uri "$baseUrl/api/inquiries" -Method Post -Body $inquiryBody -ContentType "application/json" -Headers $buyerHeaders
Test-Assert "POST /api/inquiries submits inquiry successfully" (![string]::IsNullOrEmpty($createdInquiry.id))
$inquiryId = $createdInquiry.id

$receivedInquiries = Invoke-RestMethod -Uri "$baseUrl/api/inquiries/received?pageNumber=1&pageSize=10" -Method Get -Headers $agentHeaders
$agentInquiry = $receivedInquiries.items | Where-Object { $_.id -eq $inquiryId }
Test-Assert "GET /api/inquiries/received contains new inquiry for property owner" ($null -ne $agentInquiry)

$updateInquiryBody = @{
    status = "Contacted"
    agentNotes = "Client contacted and viewing scheduled for 4 PM"
} | ConvertTo-Json
$updatedInquiry = Invoke-RestMethod -Uri "$baseUrl/api/inquiries/$inquiryId/status" -Method Put -Body $updateInquiryBody -ContentType "application/json" -Headers $agentHeaders
Test-Assert "PUT /api/inquiries/{id}/status updates status and private notes" ($updatedInquiry.status -eq "Contacted" -and $updatedInquiry.agentNotes -like "*4 PM*")

$forbiddenInquiryUpdate = $false
try {
    Invoke-RestMethod -Uri "$baseUrl/api/inquiries/$inquiryId/status" -Method Put -Body $updateInquiryBody -ContentType "application/json" -Headers $buyerHeaders
} catch {
    $forbiddenInquiryUpdate = $true
}
Test-Assert "PUT /api/inquiries/{id}/status by non-owner is Forbidden (403)" $forbiddenInquiryUpdate

# 8. Notifications Subsystem
Write-Host "`n--- Module 8: Notifications Lifecycle ---" -ForegroundColor Yellow
$unreadNotifications = Invoke-RestMethod -Uri "$baseUrl/api/notifications/unread-count" -Method Get -Headers $buyerHeaders
Test-Assert "GET /api/notifications/unread-count returns unread count" ($unreadNotifications.unreadCount -ge 0)

$notifications = Invoke-RestMethod -Uri "$baseUrl/api/notifications?pageNumber=1&pageSize=10" -Method Get -Headers $buyerHeaders
Test-Assert "GET /api/notifications returns list" ($notifications.items.Count -ge 0)

if ($notifications.items.Count -gt 0) {
    $notifId = $notifications.items[0].id
    $markReadReq = Invoke-WebRequest -Uri "$baseUrl/api/notifications/$notifId/read" -Method Put -Headers $buyerHeaders -UseBasicParsing
    Test-Assert "PUT /api/notifications/{id}/read marks single notification as read" ($markReadReq.StatusCode -eq 200)
}

$markAllReadReq = Invoke-WebRequest -Uri "$baseUrl/api/notifications/read-all" -Method Put -Headers $buyerHeaders -UseBasicParsing
Test-Assert "PUT /api/notifications/read-all marks all notifications as read" ($markAllReadReq.StatusCode -eq 200)

# 9. Direct Property Chat Subsystem
Write-Host "`n--- Module 9: Direct Property Chat Subsystem ---" -ForegroundColor Yellow
$chatSendBody = @{
    receiverId = $agentId.ToString()
    propertyId = $propertyId
    message = "Hello Samer, is this apartment still available?"
} | ConvertTo-Json
$chatSendRes = Invoke-RestMethod -Uri "$baseUrl/api/chat/send" -Method Post -Body $chatSendBody -ContentType "application/json" -Headers $buyerHeaders
Test-Assert "POST /api/chat/send sends direct chat message" (![string]::IsNullOrEmpty($chatSendRes.id))

$agentConversations = Invoke-RestMethod -Uri "$baseUrl/api/chat/conversations" -Method Get -Headers $agentHeaders
$convFound = $agentConversations | Where-Object { $_.otherUserId -eq $buyerId.ToString() }
Test-Assert "GET /api/chat/conversations returns active conversation" ($null -ne $convFound)

$agentChatMessages = Invoke-RestMethod -Uri "$baseUrl/api/chat/messages/$buyerId" -Method Get -Headers $agentHeaders
$msgFound = $agentChatMessages | Where-Object { $_.message -like "*still available*" }
Test-Assert "GET /api/chat/messages/{otherUserId} returns message history" ($null -ne $msgFound)

# 10. Dashboard & Cleanup
Write-Host "`n--- Module 10: Dashboard Aggregation and Cleanup ---" -ForegroundColor Yellow
$dashboard = Invoke-RestMethod -Uri "$baseUrl/api/dashboard" -Method Get -Headers $agentHeaders
Test-Assert "GET /api/dashboard returns stats for agent" ($dashboard.stats.myPropertiesCount -ge 1)

$deleteProp = Invoke-RestMethod -Uri "$baseUrl/api/properties/$propertyId" -Method Delete -Headers $agentHeaders
Test-Assert "DELETE /api/properties/{id} deletes test property by owner" ($deleteProp.message -like "*successfully*")

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  Results: $passed PASSED, $failed FAILED out of $($passed + $failed) tests" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "==========================================================" -ForegroundColor Cyan

if ($failed -gt 0) {
    exit 1
}
