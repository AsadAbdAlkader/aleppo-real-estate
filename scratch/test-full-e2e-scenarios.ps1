$baseUrl = "http://localhost:5215"
$ErrorActionPreference = "Stop"

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "     ALEPPO REAL ESTATE - PRACTICAL END-TO-END SCENARIO VERIFICATION SUITE       " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

$scenarioResults = @()

function Record-Test($name, $passed, $details) {
    $script:scenarioResults += [PSCustomObject]@{
        Name = $name
        Status = if ($passed) { "PASSED" } else { "FAILED" }
        Details = $details
    }
    if ($passed) {
        Write-Host " [PASS] $name - $details" -ForegroundColor Green
    } else {
        Write-Host " [FAIL] $name - $details" -ForegroundColor Red
    }
}

# -----------------------------------------------------------------------------
# 1. AUTHENTICATION & IDENTITY TESTS
# -----------------------------------------------------------------------------
Write-Host "`n>>> 1. Testing Authentication & Tenant Context Abstraction..." -ForegroundColor Yellow

# Admin Login
$adminLoginBody = @{
    email = "admin@aleppo.com"
    password = "Password123!"
} | ConvertTo-Json

$adminRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
$adminToken = $adminRes.token
$adminAgencyId = $adminRes.agencyId

Record-Test "Admin Login" ($adminToken -ne $null -and $adminRes.role -eq "Admin") "Role: $($adminRes.role), Agency: $adminAgencyId"

# Buyer Login
$buyerLoginBody = @{
    email = "buyer@aleppo.com"
    password = "Password123!"
} | ConvertTo-Json

$buyerRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $buyerLoginBody -ContentType "application/json"
$buyerToken = $buyerRes.token

Record-Test "Buyer Login" ($buyerToken -ne $null) "Buyer token acquired"

# Test GET /api/auth/me for Admin
$adminMe = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
$hasAgency = $adminMe.agencyId -ne $null -and $adminMe.agencyId -eq $adminAgencyId
$hasPerms = $adminMe.permissions -ne $null -and $adminMe.permissions.Count -gt 0

Record-Test "GET /api/auth/me returns AgencyId & Permissions" ($hasAgency -and $hasPerms) "Agency: $($adminMe.agencyId), Permissions count: $($adminMe.permissions.Count)"

# -----------------------------------------------------------------------------
# 2. TENANT ISOLATION & SECURITY SCOPE ENFORCEMENT
# -----------------------------------------------------------------------------
Write-Host "`n>>> 2. Testing Multi-Tenant Isolation & Scope Enforcement..." -ForegroundColor Yellow

# A buyer (who does not belong to an agency) attempts to create a property -> Must return 403 Forbidden
$fakeProp = @{
    title = "شقة وهمية لمشتري غير مصرح"
    description = "هذا الاختبار يتحقق من حظر غير المصرح لهم"
    price = 350000
    category = "Apartment"
    cityArea = "الشهباء"
    address = "شارع النيل"
    bedrooms = 3
    bathrooms = 2
    areaSquareMeters = 150
} | ConvertTo-Json

$buyerBlocked = $false
$statusCode = 0
try {
    $res = Invoke-WebRequest -Uri "$baseUrl/api/properties" -Method Post -Body $fakeProp -Headers @{ Authorization = "Bearer $buyerToken" } -ContentType "application/json"
    $statusCode = $res.StatusCode
} catch {
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        if ($statusCode -eq 403) { $buyerBlocked = $true }
    }
}
Record-Test "Unauthorized Property Creation Blocked" ($buyerBlocked -or $statusCode -eq 403) "Status: $statusCode (Expected 403 Forbidden)"

# Header Tampering: Passing non-existent X-Agency-Id -> Must be rejected with 403
$tamperedBlocked = $false
try {
    $res = Invoke-WebRequest -Uri "$baseUrl/api/properties" -Method Post -Body $fakeProp -Headers @{ 
        Authorization = "Bearer $adminToken"
        "X-Agency-Id" = "00000000-0000-0000-0000-000000000001"
    } -ContentType "application/json"
} catch {
    if ($_.Exception.Response) {
        $tStatus = [int]$_.Exception.Response.StatusCode
        if ($tStatus -eq 403) { $tamperedBlocked = $true }
    }
}
Record-Test "Header Tampering (Spoofed X-Agency-Id) Rejected" $tamperedBlocked "TenantContext fails closed when user lacks membership in requested X-Agency-Id"

# -----------------------------------------------------------------------------
# 3. PROPERTY LIFECYCLE (CRUD)
# -----------------------------------------------------------------------------
Write-Host "`n>>> 3. Testing Property Lifecycle (Create, Read, Update, Delete)..." -ForegroundColor Yellow

$testProperty = @{
    title = "فيلا فاخرة للإختبار العملي في الشهباء"
    description = "فيلا مجهزة بأحدث الديكورات وحديقة ومسبح خاص مع إطلالة بانورامية"
    price = 780000
    category = "Villa"
    purpose = "Sale"
    cityArea = "الشهباء"
    address = "شارع الشريعة - قرب جامع الروضة"
    bedrooms = 5
    bathrooms = 4
    areaSquareMeters = 420
    latitude = 36.2235
    longitude = 37.1322
    features = @("مسبح", "حديقة خاصة", "طاقة شمسية", "كراج سيارات", "إطلالة بانورامية")
    imageUrls = @("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800")
} | ConvertTo-Json

$createdProp = Invoke-RestMethod -Uri "$baseUrl/api/properties" -Method Post -Body $testProperty -Headers @{ Authorization = "Bearer $adminToken" } -ContentType "application/json"
$createdPropId = $createdProp.id
$propAgencyId = $createdProp.agencyId

Record-Test "Create Property via Agency Admin" ($createdPropId -ne $null -and $propAgencyId -eq $adminAgencyId) "Property ID: $createdPropId, Price: `$$($createdProp.price), Agency: $propAgencyId"

# Fetch Property By ID
$fetchedProp = Invoke-RestMethod -Uri "$baseUrl/api/properties/$createdPropId" -Method Get
Record-Test "Fetch Property By ID" ($fetchedProp.id -eq $createdPropId -and $fetchedProp.title -eq "فيلا فاخرة للإختبار العملي في الشهباء") "Title: $($fetchedProp.title), Area: $($fetchedProp.areaSquareMeters) m²"

# Update Property
$updateProperty = @{
    title = "فيلا فاخرة للإختبار العملي في الشهباء (محدّث)"
    description = "تم تحديث السعر والمواصفات بناء على طلب المالك"
    price = 820000
    category = "Villa"
    purpose = "Sale"
    cityArea = "الشهباء"
    address = "شارع الشريعة - قرب جامع الروضة"
    bedrooms = 5
    bathrooms = 4
    areaSquareMeters = 420
    latitude = 36.2235
    longitude = 37.1322
    features = @("مسبح", "حديقة خاصة", "طاقة شمسية", "كراج سيارات", "بئر ماء")
    imageUrls = @("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800")
} | ConvertTo-Json

$updatedProp = Invoke-RestMethod -Uri "$baseUrl/api/properties/$createdPropId" -Method Put -Body $updateProperty -Headers @{ Authorization = "Bearer $adminToken" } -ContentType "application/json"
Record-Test "Update Property Details" ($updatedProp.price -eq 820000 -and $updatedProp.title -like "*محدّث*") "New Price: `$$($updatedProp.price), Title: $($updatedProp.title)"

# Get My Properties (Agency Member)
$myProps = Invoke-RestMethod -Uri "$baseUrl/api/properties/my?pageNumber=1&pageSize=10" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
$foundInMy = ($myProps.items | Where-Object { $_.id -eq $createdPropId }) -ne $null
Record-Test "Get My Properties (Agency Scope)" $foundInMy "Total properties in agency: $($myProps.totalCount), found created property"

# -----------------------------------------------------------------------------
# 4. PUBLIC MARKETPLACE SEARCH & FILTERS
# -----------------------------------------------------------------------------
Write-Host "`n>>> 4. Testing Public Marketplace & Filters (Anonymous Visitor)..." -ForegroundColor Yellow

# Query all properties without auth header
$publicProps = Invoke-RestMethod -Uri "$baseUrl/api/properties?pageNumber=1&pageSize=20" -Method Get
Record-Test "Public Marketplace Anonymous Access" ($publicProps.items.Count -gt 0) "Retrieved $($publicProps.items.Count) published properties (Total: $($publicProps.totalCount))"

# Verify all returned properties have allowed public status (Published / Available)
$unapprovedStatuses = $publicProps.items | Where-Object { $_.status -in @("Draft", "PendingReview", "Archived") }
Record-Test "Public Marketplace Security (No Drafts/Pending)" ($unapprovedStatuses.Count -eq 0) "Zero unapproved properties leaked to anonymous users"

# Neighborhood filter: الفرقان
$furqanProps = Invoke-RestMethod -Uri "$baseUrl/api/properties?cityArea=الفرقان" -Method Get
$allFurqan = $true
foreach ($p in $furqanProps.items) {
    if ($p.cityArea -ne "الفرقان") { $allFurqan = $false }
}
Record-Test "Filter by Neighborhood (الفرقان)" ($furqanProps.items.Count -ge 0 -and $allFurqan) "Found $($furqanProps.items.Count) properties in الفرقان"

# Price filter
$priceFiltered = Invoke-RestMethod -Uri "$baseUrl/api/properties?minPrice=500000&maxPrice=1000000" -Method Get
$priceValid = $true
foreach ($p in $priceFiltered.items) {
    if ($p.price -lt 500000 -or $p.price -gt 1000000) { $priceValid = $false }
}
Record-Test "Filter by Price Range ($500k - $1M)" ($priceFiltered.items.Count -gt 0 -and $priceValid) "Found $($priceFiltered.items.Count) matching properties"

# -----------------------------------------------------------------------------
# 5. BUYER FAVORITES LIFECYCLE
# -----------------------------------------------------------------------------
Write-Host "`n>>> 5. Testing Buyer Favorites Flow..." -ForegroundColor Yellow

# Add to favorites
$favAdd = Invoke-RestMethod -Uri "$baseUrl/api/favorites/$createdPropId" -Method Post -Headers @{ Authorization = "Bearer $buyerToken" }
Record-Test "Add Property to Favorites" ($favAdd.isFavorite -eq $true) "Property marked as favorite"

# Check favorites list
$myFavs = Invoke-RestMethod -Uri "$baseUrl/api/favorites" -Method Get -Headers @{ Authorization = "Bearer $buyerToken" }
$inFavs = ($myFavs | Where-Object { $_.id -eq $createdPropId }) -ne $null
Record-Test "List Buyer Favorites" $inFavs "Favorites count: $($myFavs.Count)"

# Remove from favorites
$favRemove = Invoke-RestMethod -Uri "$baseUrl/api/favorites/$createdPropId" -Method Delete -Headers @{ Authorization = "Bearer $buyerToken" }
Record-Test "Remove Property from Favorites" ($favRemove.isFavorite -eq $false) "Property removed from favorites"

# -----------------------------------------------------------------------------
# 6. INQUIRIES & LEAD GENERATION LIFECYCLE
# -----------------------------------------------------------------------------
Write-Host "`n>>> 6. Testing Inquiries Flow..." -ForegroundColor Yellow

# Buyer submits inquiry (with Authorization header)
$inquiryPayload = @{
    propertyId = $createdPropId
    phoneNumber = "+963944123456"
    message = "مرحباً، أود الاستفسار عن إمكانية معاينة الفيلا يوم الجمعة القادم."
} | ConvertTo-Json

$inquiryRes = Invoke-RestMethod -Uri "$baseUrl/api/inquiries" -Method Post -Body $inquiryPayload -Headers @{ Authorization = "Bearer $buyerToken" } -ContentType "application/json"
$inquiryId = $inquiryRes.id
Record-Test "Submit Buyer Inquiry" ($inquiryId -ne $null) "Inquiry ID: $inquiryId, Status: $($inquiryRes.status)"

# Buyer views their submitted inquiries
$buyerInquiries = Invoke-RestMethod -Uri "$baseUrl/api/inquiries/my" -Method Get -Headers @{ Authorization = "Bearer $buyerToken" }
$foundInBuyer = ($buyerInquiries | Where-Object { $_.id -eq $inquiryId }) -ne $null
Record-Test "Buyer Views Submitted Inquiries" $foundInBuyer "Buyer has $($buyerInquiries.Count) inquiries"

# Agency views received inquiries
$receivedInquiries = Invoke-RestMethod -Uri "$baseUrl/api/inquiries/received?pageNumber=1&pageSize=10" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
Record-Test "Agency Views Received Inquiries" ($receivedInquiries.totalCount -ge 0) "Total agency inquiries: $($receivedInquiries.totalCount)"

# Agency updates inquiry status
$updateInquiryPayload = @{
    status = "Contacted"
    agentNotes = "تم الاتصال بالعميل وتحديد موعد المعاينة يوم الجمعة الساعة 4 مساءً"
} | ConvertTo-Json

$statusUpdateRes = Invoke-RestMethod -Uri "$baseUrl/api/inquiries/$inquiryId/status" -Method Put -Body $updateInquiryPayload -Headers @{ Authorization = "Bearer $adminToken" } -ContentType "application/json"
Record-Test "Agency Updates Inquiry Status" ($statusUpdateRes.status -eq "Contacted") "New Status: $($statusUpdateRes.status), Notes: $($statusUpdateRes.agentNotes)"

# -----------------------------------------------------------------------------
# 7. CHAT & MESSAGING
# -----------------------------------------------------------------------------
Write-Host "`n>>> 7. Testing Real-Time Chat & Messaging..." -ForegroundColor Yellow

$conversations = Invoke-RestMethod -Uri "$baseUrl/api/chat/conversations" -Method Get -Headers @{ Authorization = "Bearer $buyerToken" }
Record-Test "Get Chat Conversations" ($conversations -ne $null) "Conversations retrieved successfully"

# -----------------------------------------------------------------------------
# 8. NOTIFICATIONS
# -----------------------------------------------------------------------------
Write-Host "`n>>> 8. Testing Notifications..." -ForegroundColor Yellow

$notifications = Invoke-RestMethod -Uri "$baseUrl/api/notifications?pageNumber=1&pageSize=10" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
Record-Test "Get Agency Notifications" ($notifications -ne $null) "Notifications retrieved successfully"

# -----------------------------------------------------------------------------
# 9. CLEAN-UP & PROPERTY DELETION
# -----------------------------------------------------------------------------
Write-Host "`n>>> 9. Testing Property Deletion & Scope Integrity..." -ForegroundColor Yellow

# Delete the created property as Admin
Invoke-RestMethod -Uri "$baseUrl/api/properties/$createdPropId" -Method Delete -Headers @{ Authorization = "Bearer $adminToken" }

# Verify property is no longer accessible
$isDeleted = $false
try {
    Invoke-WebRequest -Uri "$baseUrl/api/properties/$createdPropId" -Method Get
} catch {
    if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 404) {
        $isDeleted = $true
    }
}
Record-Test "Delete Property Clean-up" $isDeleted "Property successfully deleted (subsequent GET returned 404 Not Found)"

# -----------------------------------------------------------------------------
# SUMMARY REPORT
# -----------------------------------------------------------------------------
Write-Host "`n================================================================================" -ForegroundColor Cyan
Write-Host "                           FINAL RESULTS SUMMARY                                " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

$passedCount = ($script:scenarioResults | Where-Object { $_.Status -eq "PASSED" }).Count
$failedCount = ($script:scenarioResults | Where-Object { $_.Status -eq "FAILED" }).Count
$totalCount = $script:scenarioResults.Count

Write-Host "Total Scenarios Executed : $totalCount"
Write-Host "Passed                   : $passedCount" -ForegroundColor Green
Write-Host "Failed                   : $failedCount" -ForegroundColor $(if ($failedCount -eq 0) { "Green" } else { "Red" })

if ($failedCount -eq 0) {
    Write-Host "`n>>> ALL PRACTICAL SCENARIOS PASSED WITH 100% SUCCESS! <<<" -ForegroundColor Green
} else {
    Write-Host "`n>>> SOME SCENARIOS FAILED! Check log above. <<<" -ForegroundColor Red
}
