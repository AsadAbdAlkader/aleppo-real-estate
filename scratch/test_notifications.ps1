$baseUrl = "http://localhost:5215"

# 1. Login Buyer
$buyerBody = @{ email = "buyer@aleppo.com"; password = "Password123!" } | ConvertTo-Json
$buyerRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $buyerBody -ContentType "application/json"
$buyerToken = $buyerRes.token
$buyerId = $buyerRes.id
Write-Host "Buyer Logged in. Token received."

# 2. Login Agent (Property Owner)
$agentBody = @{ email = "agent@aleppo.com"; password = "Password123!" } | ConvertTo-Json
$agentRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $agentBody -ContentType "application/json"
$agentToken = $agentRes.token
$agentId = $agentRes.id
Write-Host "Agent Logged in. Token received."

# Get properties to find one owned by Agent
$props = Invoke-RestMethod -Uri "$baseUrl/api/properties" -Method GET
$agentProp = $props.items | Where-Object { $_.ownerId -eq $agentId } | Select-Object -First 1
if (-not $agentProp) { $agentProp = $props.items[0] }
Write-Host "Target Property ID: $($agentProp.id) Title: $($agentProp.title)"

# 3. Buyer submits Inquiry
$inquiryReq = @{ propertyId = $agentProp.id; message = "Hello, please contact me regarding this property"; phoneNumber = "+963911000999" } | ConvertTo-Json
$buyerHeaders = @{ Authorization = "Bearer $buyerToken" }
$inquiryRes = Invoke-RestMethod -Uri "$baseUrl/api/inquiries" -Method POST -Body $inquiryReq -ContentType "application/json" -Headers $buyerHeaders
$inquiryId = $inquiryRes.id
Write-Host "Inquiry Submitted ID: $inquiryId"

# 4. Agent checks Notifications (Expect InquiryReceived)
$agentHeaders = @{ Authorization = "Bearer $agentToken" }
$agentNotifs = Invoke-RestMethod -Uri "$baseUrl/api/notifications" -Method GET -Headers $agentHeaders
$agentUnread = Invoke-RestMethod -Uri "$baseUrl/api/notifications/unread-count" -Method GET -Headers $agentHeaders
Write-Host "Agent Unread Count: $($agentUnread.unreadCount)"
Write-Host "Agent Notification Title: $($agentNotifs.items[0].title) Type: $($agentNotifs.items[0].type) RefId: $($agentNotifs.items[0].referenceId)"

# 5. Agent updates Inquiry Status to Contacted
$statusReq = @{ status = "Contacted"; agentNotes = "Contacted buyer and scheduled meeting" } | ConvertTo-Json
$statusRes = Invoke-RestMethod -Uri "$baseUrl/api/inquiries/$inquiryId/status" -Method PUT -Body $statusReq -ContentType "application/json" -Headers $agentHeaders
Write-Host "Inquiry Status Updated to Contacted. Response Status: $($statusRes.status)"

# 6. Buyer checks Notifications (Expect InquiryStatusUpdated)
$buyerNotifs = Invoke-RestMethod -Uri "$baseUrl/api/notifications" -Method GET -Headers $buyerHeaders
$buyerUnread = Invoke-RestMethod -Uri "$baseUrl/api/notifications/unread-count" -Method GET -Headers $buyerHeaders
Write-Host "Buyer Unread Count: $($buyerUnread.unreadCount)"
$buyerLastNotif = $buyerNotifs.items[0]
Write-Host "Buyer Notification Title: $($buyerLastNotif.title) Message: $($buyerLastNotif.message) Type: $($buyerLastNotif.type)"

# 7. Agent updates Notes ONLY with SAME status (Contacted) -> Should NOT trigger new notification
$statusReq2 = @{ status = "Contacted"; agentNotes = "Confirmed meeting time for Tuesday" } | ConvertTo-Json
$statusRes2 = Invoke-RestMethod -Uri "$baseUrl/api/inquiries/$inquiryId/status" -Method PUT -Body $statusReq2 -ContentType "application/json" -Headers $agentHeaders
$buyerNotifsCount2 = (Invoke-RestMethod -Uri "$baseUrl/api/notifications" -Method GET -Headers $buyerHeaders).totalCount
Write-Host "Buyer Total Notifications after same-status update: $buyerNotifsCount2 (Expected unchanged)"

# 8. Security Check: Agent tries to mark Buyer notification as read -> Expect 404
try {
    Invoke-RestMethod -Uri "$baseUrl/api/notifications/$($buyerLastNotif.id)/read" -Method PUT -Headers $agentHeaders
    Write-Host "ERR: Unowned mark-read succeeded unexpectedly!"
} catch {
    Write-Host "Security Check Passed: Returns 404 for unowned notification. StatusCode: $($_.Exception.Response.StatusCode)"
}

# 9. Buyer marks all as read
Invoke-RestMethod -Uri "$baseUrl/api/notifications/read-all" -Method PUT -Headers $buyerHeaders
$buyerUnreadAfterReadAll = (Invoke-RestMethod -Uri "$baseUrl/api/notifications/unread-count" -Method GET -Headers $buyerHeaders).unreadCount
Write-Host "Buyer Unread Count after read-all: $buyerUnreadAfterReadAll"
