import sys
import json
import urllib.request
import urllib.parse
import urllib.error

BASE_URL = "http://localhost:5215"

results = []

def record(name, passed, details=""):
    results.append({"name": name, "passed": passed, "details": details})
    tag = "[PASS]" if passed else "[FAIL]"
    print(f"{tag} {name} | {details}")

def request(endpoint, method="GET", data=None, token=None, extra_headers=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if extra_headers:
        headers.update(extra_headers)
    
    encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            body = response.read().decode("utf-8")
            try:
                parsed = json.loads(body)
            except Exception:
                parsed = body
            return status, parsed
    except urllib.error.HTTPError as e:
        status = e.code
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = body
        return status, parsed
    except Exception as e:
        return 0, str(e)

print("=" * 80)
print("     ALEPPO REAL ESTATE - PRACTICAL END-TO-END SCENARIO VERIFICATION SUITE")
print("=" * 80)

# ---------------------------------------------------------
# SCENARIO 1: Authentication & Identity Context
# ---------------------------------------------------------
print("\n>>> Scenario 1: Authentication & Identity Context Abstraction")
st, admin_login = request("/api/auth/login", method="POST", data={
    "email": "admin@aleppo.com",
    "password": "Password123!"
})
admin_token = admin_login.get("token") if isinstance(admin_login, dict) else None
admin_agency_id = admin_login.get("agencyId") if isinstance(admin_login, dict) else None
admin_role = admin_login.get("role") if isinstance(admin_login, dict) else None

record(
    "1.1 Admin Authentication",
    st == 200 and admin_token is not None and admin_role == "Admin",
    f"Status: {st}, Role: {admin_role}, AgencyId: {admin_agency_id}"
)

# Buyer login
st, buyer_login = request("/api/auth/login", method="POST", data={
    "email": "buyer@aleppo.com",
    "password": "Password123!"
})
buyer_token = buyer_login.get("token") if isinstance(buyer_login, dict) else None
record(
    "1.2 Buyer Authentication",
    st == 200 and buyer_token is not None,
    f"Status: {st}, Buyer Token Acquired"
)

# Admin Profile & Permissions via GET /api/auth/me
st, me_data = request("/api/auth/me", method="GET", token=admin_token)
has_agency = isinstance(me_data, dict) and me_data.get("agencyId") == admin_agency_id
has_perms = isinstance(me_data, dict) and len(me_data.get("permissions", [])) > 0
record(
    "1.3 Identity Context (GET /api/auth/me)",
    st == 200 and has_agency and has_perms,
    f"AgencyId: {me_data.get('agencyId') if isinstance(me_data, dict) else 'None'}, Permissions count: {len(me_data.get('permissions', [])) if isinstance(me_data, dict) else 0}"
)

# ---------------------------------------------------------
# SCENARIO 2: Multi-Tenant Isolation & Security Scope
# ---------------------------------------------------------
print("\n>>> Scenario 2: Multi-Tenant Isolation & Security Scope Enforcement")
fake_prop_payload = {
    "title": "شقة غير مصرحة",
    "description": "محاولة إنشاء من مستخدم ليس عضواً في الوكالة",
    "price": 300000,
    "category": "Apartment",
    "cityArea": "الشهباء",
    "address": "شارع النيل",
    "bedrooms": 2,
    "bathrooms": 1,
    "areaSquareMeters": 110
}

# Buyer tries to create property -> Must return 403 Forbidden
st, res = request("/api/properties", method="POST", data=fake_prop_payload, token=buyer_token)
record(
    "2.1 Non-Agency User Blocked from Creating Properties",
    st == 403,
    f"Status: {st} (Expected 403 Forbidden)"
)

# Header spoofing test: Passing unknown or unassociated X-Agency-Id -> Must return 403 Forbidden
st, res = request(
    "/api/properties",
    method="POST",
    data=fake_prop_payload,
    token=admin_token,
    extra_headers={"X-Agency-Id": "00000000-0000-0000-0000-000000000001"}
)
record(
    "2.2 Spoofed X-Agency-Id Header Rejected",
    st == 403,
    f"Status: {st} (TenantContext fails closed when user lacks membership)"
)

# ---------------------------------------------------------
# SCENARIO 3: Property Lifecycle (End-to-End CRUD)
# ---------------------------------------------------------
print("\n>>> Scenario 3: Property Lifecycle (Create, Read, Update, Scope Query, Delete)")
new_prop = {
    "title": "فيلا فاخرة للإختبار العملي في الشهباء",
    "description": "فيلا مجهزة بأحدث الديكورات وحديقة ومسبح خاص مع إطلالة بانورامية",
    "price": 780000,
    "category": "Villa",
    "purpose": "Sale",
    "cityArea": "الشهباء",
    "address": "شارع الشريعة - قرب جامع الروضة",
    "bedrooms": 5,
    "bathrooms": 4,
    "areaSquareMeters": 420,
    "latitude": 36.2235,
    "longitude": 37.1322,
    "features": ["مسبح", "حديقة خاصة", "طاقة شمسية", "كراج سيارات"],
    "imageUrls": ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"]
}

st, created_prop = request("/api/properties", method="POST", data=new_prop, token=admin_token)
prop_id = created_prop.get("id") if isinstance(created_prop, dict) else None
assigned_agency = created_prop.get("agencyId") if isinstance(created_prop, dict) else None

record(
    "3.1 Property Creation (Auto-Assigned AgencyId)",
    st == 201 and prop_id is not None and assigned_agency == admin_agency_id,
    f"Status: {st}, PropertyId: {prop_id}, AgencyId: {assigned_agency}"
)

# Read Property by ID
st, fetched_prop = request(f"/api/properties/{prop_id}", method="GET")
record(
    "3.2 Fetch Property by ID",
    st == 200 and isinstance(fetched_prop, dict) and fetched_prop.get("id") == prop_id,
    f"Title: {fetched_prop.get('title') if isinstance(fetched_prop, dict) else ''}, Area: {fetched_prop.get('areaSquareMeters') if isinstance(fetched_prop, dict) else ''} m²"
)

# Update Property
update_payload = dict(new_prop)
update_payload["title"] = "فيلا فاخرة للإختبار العملي في الشهباء (محدّث)"
update_payload["price"] = 850000
st, updated_prop = request(f"/api/properties/{prop_id}", method="PUT", data=update_payload, token=admin_token)
record(
    "3.3 Update Property Details & Price",
    st == 200 and isinstance(updated_prop, dict) and updated_prop.get("price") == 850000,
    f"Status: {st}, Updated Price: ${updated_prop.get('price') if isinstance(updated_prop, dict) else ''}"
)

# Agency Scope Query: /api/properties/my
st, my_props = request("/api/properties/my", method="GET", token=admin_token)
items = my_props if isinstance(my_props, list) else my_props.get("items", [])
found_in_my = any(p.get("id") == prop_id for p in items)
record(
    "3.4 Tenant-Scoped Properties Query (/api/properties/my)",
    st == 200 and found_in_my,
    f"Found created property in my list (Total agency properties: {len(items)})"
)

# ---------------------------------------------------------
# SCENARIO 4: Public Marketplace & Search / Filters
# ---------------------------------------------------------
print("\n>>> Scenario 4: Public Marketplace Search & Filters (Anonymous Visitor)")
st, public_list = request("/api/properties?pageNumber=1&pageSize=20", method="GET")
public_items = public_list.get("items", []) if isinstance(public_list, dict) else []
no_leaks = all(p.get("status") not in ["Draft", "PendingReview", "Archived"] for p in public_items)
record(
    "4.1 Public Marketplace (Anonymous Visitor Access)",
    st == 200 and len(public_items) > 0 and no_leaks,
    f"Retrieved {len(public_items)} items, no Draft or Pending properties leaked"
)

# Neighborhood Filter: الفرقان (URL-encoded)
encoded_city_area = urllib.parse.quote("الفرقان")
st, furqan_list = request(f"/api/properties?cityArea={encoded_city_area}", method="GET")
furqan_items = furqan_list.get("items", []) if isinstance(furqan_list, dict) else []
all_furqan = all(p.get("cityArea") == "الفرقان" for p in furqan_items)
record(
    "4.2 City Area Filter (الفرقان)",
    st == 200 and len(furqan_items) > 0 and all_furqan,
    f"Returned {len(furqan_items)} properties, all verified in الفرقان"
)

# Price Filter: 500k to 1M
st, price_list = request("/api/properties?minPrice=500000&maxPrice=1000000", method="GET")
price_items = price_list.get("items", []) if isinstance(price_list, dict) else []
all_in_price = all(500000 <= p.get("price", 0) <= 1000000 for p in price_items)
record(
    "4.3 Price Range Filter ($500k - $1M)",
    st == 200 and len(price_items) > 0 and all_in_price,
    f"Returned {len(price_items)} properties, all within price boundaries"
)

# ---------------------------------------------------------
# SCENARIO 5: Buyer Favorites Lifecycle
# ---------------------------------------------------------
print("\n>>> Scenario 5: Buyer Favorites Lifecycle")
# Add to favorites
st, fav_add = request(f"/api/favorites/{prop_id}", method="POST", token=buyer_token)
record(
    "5.1 Add Property to Favorites",
    st == 200 and isinstance(fav_add, dict) and fav_add.get("isFavorite") is True,
    f"Status: {st}, isFavorite: True"
)

# List favorites
st, my_favs = request("/api/favorites", method="GET", token=buyer_token)
in_favs = any(p.get("id") == prop_id for p in my_favs) if isinstance(my_favs, list) else False
record(
    "5.2 List Buyer Favorites",
    st == 200 and in_favs,
    f"Status: {st}, Found property in buyer favorites (Total favorites: {len(my_favs) if isinstance(my_favs, list) else 0})"
)

# Remove from favorites
st, fav_remove = request(f"/api/favorites/{prop_id}", method="DELETE", token=buyer_token)
record(
    "5.3 Remove Property from Favorites",
    st == 200 and isinstance(fav_remove, dict) and fav_remove.get("isFavorite") is False,
    f"Status: {st}, isFavorite: False"
)

# ---------------------------------------------------------
# SCENARIO 6: Inquiries & Lead Generation Lifecycle
# ---------------------------------------------------------
print("\n>>> Scenario 6: Inquiries & Lead Generation Lifecycle")
inquiry_payload = {
    "propertyId": prop_id,
    "phoneNumber": "+963944123456",
    "message": "مرحباً، أود الاستفسار عن إمكانية معاينة العقار يوم الجمعة القادم."
}

# Buyer submits inquiry
st, inquiry_res = request("/api/inquiries", method="POST", data=inquiry_payload, token=buyer_token)
inquiry_id = inquiry_res.get("id") if isinstance(inquiry_res, dict) else None
record(
    "6.1 Submit Buyer Inquiry",
    st == 201 and inquiry_id is not None,
    f"Status: {st}, InquiryId: {inquiry_id}, Initial Status: {inquiry_res.get('status') if isinstance(inquiry_res, dict) else ''}"
)

# Buyer views their submitted inquiries
st, buyer_inquiries = request("/api/inquiries/my", method="GET", token=buyer_token)
found_buyer_inquiry = any(i.get("id") == inquiry_id for i in buyer_inquiries) if isinstance(buyer_inquiries, list) else False
record(
    "6.2 Buyer Retrieves Their Submitted Inquiries",
    st == 200 and found_buyer_inquiry,
    f"Status: {st}, Total Buyer Inquiries: {len(buyer_inquiries) if isinstance(buyer_inquiries, list) else 0}"
)

# Agency views received inquiries
st, received_res = request("/api/inquiries/received?pageNumber=1&pageSize=10", method="GET", token=admin_token)
record(
    "6.3 Agency Retrieves Received Inquiries",
    st == 200 and isinstance(received_res, dict),
    f"Status: {st}, Total Received: {received_res.get('totalCount', 0) if isinstance(received_res, dict) else 0}"
)

# Agency updates inquiry status
st, update_inq = request(
    f"/api/inquiries/{inquiry_id}/status",
    method="PUT",
    data={"status": "Contacted", "agentNotes": "تم التواصل مع العميل وتحديد موعد المعاينة"},
    token=admin_token
)
record(
    "6.4 Agency Updates Inquiry Status to Contacted",
    st == 200 and isinstance(update_inq, dict) and update_inq.get("status") == "Contacted",
    f"Status: {st}, Updated status: {update_inq.get('status') if isinstance(update_inq, dict) else ''}"
)

# ---------------------------------------------------------
# SCENARIO 7: Chat & Messaging System
# ---------------------------------------------------------
print("\n>>> Scenario 7: Chat & Messaging System")
st, chats = request("/api/chat/conversations", method="GET", token=buyer_token)
record(
    "7.1 Get User Chat Conversations",
    st == 200,
    f"Status: {st}, Conversations count: {len(chats) if isinstance(chats, list) else 0}"
)

# ---------------------------------------------------------
# SCENARIO 8: Notifications System
# ---------------------------------------------------------
print("\n>>> Scenario 8: Notifications System")
st, notifs = request("/api/notifications?pageNumber=1&pageSize=10", method="GET", token=admin_token)
record(
    "8.1 Get Notifications List",
    st == 200 and isinstance(notifs, dict),
    f"Status: {st}, Notifications count: {len(notifs.get('items', [])) if isinstance(notifs, dict) else 0}"
)

# ---------------------------------------------------------
# SCENARIO 9: Property Deletion & Tenant Clean-Up
# ---------------------------------------------------------
print("\n>>> Scenario 9: Property Deletion & Clean-Up")
st, del_res = request(f"/api/properties/{prop_id}", method="DELETE", token=admin_token)
record(
    "9.1 Delete Property as Agency Admin",
    st == 204 or st == 200,
    f"Status: {st}"
)

# Verify property is no longer accessible
st, verify_deleted = request(f"/api/properties/{prop_id}", method="GET")
record(
    "9.2 Verify Property Removed (404 Not Found)",
    st == 404,
    f"Status: {st} (Expected 404 Not Found)"
)

# ---------------------------------------------------------
# FINAL SUMMARY
# ---------------------------------------------------------
print("\n" + "=" * 80)
print("                           FINAL RESULTS SUMMARY")
print("=" * 80)
passed_count = sum(1 for r in results if r["passed"])
failed_count = sum(1 for r in results if not r["passed"])
total_count = len(results)

print(f"Total Scenarios Executed : {total_count}")
print(f"Passed                   : {passed_count}")
print(f"Failed                   : {failed_count}")

if failed_count == 0:
    print("\n>>> ALL 18 SYSTEM SCENARIOS PASSED WITH 100% SUCCESS! <<<\n")
    sys.exit(0)
else:
    print(f"\n>>> WARNING: {failed_count} SCENARIOS FAILED! <<<\n")
    sys.exit(1)
