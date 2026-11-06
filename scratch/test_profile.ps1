$baseUrl = "http://localhost:5215"

# 1. Login Buyer
$loginBody = @{ email = "buyer@aleppo.com"; password = "Password123!" } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginRes.token
$headers = @{ Authorization = "Bearer $token" }
Write-Host "1. Buyer Logged in. Token received."

# 2. GET User Profile
$profile = Invoke-RestMethod -Uri "$baseUrl/api/users/profile" -Method GET -Headers $headers
Write-Host "2. Profile Retrieved: Email=$($profile.email), Name=$($profile.firstName) $($profile.lastName), Role=$($profile.role), Phone=$($profile.phoneNumber)"

# 3. PUT Update Profile
$updateBody = @{ firstName = "Ahmed"; lastName = "Al-Halabi"; phoneNumber = "+963988777666" } | ConvertTo-Json
$updatedProfile = Invoke-RestMethod -Uri "$baseUrl/api/users/profile" -Method PUT -Body $updateBody -ContentType "application/json" -Headers $headers
Write-Host "3. Profile Updated: Name=$($updatedProfile.firstName) $($updatedProfile.lastName), Phone=$($updatedProfile.phoneNumber)"

# 4. Test Password Change with INVALID current password
try {
    $invalidPassBody = @{ currentPassword = "WrongPassword!"; newPassword = "NewPass123!" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/users/change-password" -Method PUT -Body $invalidPassBody -ContentType "application/json" -Headers $headers
    Write-Host "ERR: Password change with wrong password succeeded unexpectedly!"
} catch {
    Write-Host "4. Invalid Password Check Passed: Returns 400 Bad Request. Exception message: $($_.Exception.Message)"
}

# 5. Test Password Change with VALID current password
$validPassBody = @{ currentPassword = "Password123!"; newPassword = "NewPass123!" } | ConvertTo-Json
$passRes = Invoke-RestMethod -Uri "$baseUrl/api/users/change-password" -Method PUT -Body $validPassBody -ContentType "application/json" -Headers $headers
Write-Host "5. Password Change Succeeded: $($passRes.message)"

# 6. Verify Login with OLD password fails
try {
    $oldLoginBody = @{ email = "buyer@aleppo.com"; password = "Password123!" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $oldLoginBody -ContentType "application/json"
    Write-Host "ERR: Old password login succeeded unexpectedly!"
} catch {
    Write-Host "6. Old Password Login Failed as expected."
}

# 7. Verify Login with NEW password succeeds
$newLoginBody = @{ email = "buyer@aleppo.com"; password = "NewPass123!" } | ConvertTo-Json
$newLoginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $newLoginBody -ContentType "application/json"
$newToken = $newLoginRes.token
$newHeaders = @{ Authorization = "Bearer $newToken" }
Write-Host "7. New Password Login Succeeded! New Token received."

# 8. Reset Password back to Password123! to maintain demo seed environment
$resetPassBody = @{ currentPassword = "NewPass123!"; newPassword = "Password123!" } | ConvertTo-Json
$resetRes = Invoke-RestMethod -Uri "$baseUrl/api/users/change-password" -Method PUT -Body $resetPassBody -ContentType "application/json" -Headers $newHeaders
Write-Host "8. Password Reset Back to Original: $($resetRes.message)"
