# Security Specification - ח.סבן חומרי בנין

## Data Invariants
1. **Inventory Integrity**: Products in `inventory` must have valid fields. Only admins can modify products.
2. **Category & Brand Hierarchy**: Categories and Brands index the catalog. Only admins can modify.
3. **אנציקלופדיה Consistency**: Encyclopedia items must belong to a valid category. Only admins can modify.
4. **Log Privacy**: AI logs in `Noa_AI_Logs` can be created by anyone but only read by admins.
5. **Admin Authority**: Only authenticated users with admin status (verified via `admins` collection or system allowlist) can perform writes to catalog resources.

## The Dirty Dozen Payloads

1. **Unauthenticated Write to Inventory**
   - Path: `inventory/PROD-1`
   - Payload: `{ "name": "Fake Product", "price": 10 }`
   - Expect: `PERMISSION_DENIED`

2. **Guest Write to Brands**
   - Path: `brands/brand-1`
   - Payload: `{ "name": "Hack Brand" }`
   - Expect: `PERMISSION_DENIED`

3. **ID Poisoning Attack (Long ID)**
   - Path: `inventory/` + "A".repeat(2000)
   - Payload: `{ "name": "Junk" }`
   - Expect: `PERMISSION_DENIED`

4. **Resource Exhaustion (1MB String)**
   - Path: `inventory/PROD-1`
   - Payload: `{ "name": "A".repeat(1000000) }`
   - Expect: `PERMISSION_DENIED`

5. **Self-Promotion to Admin**
   - Path: `admins/my-uid`
   - Payload: `{ "isAdmin": true, "email": "me@hack.com" }`
   - Auth: `uid: "my-uid"`
   - Expect: `PERMISSION_DENIED`

6. **Unauthorized Read of AI Logs**
   - Path: `Noa_AI_Logs/log-1`
   - Auth: `uid: "standard-user"`
   - Expect: `PERMISSION_DENIED`

7. **Bypassing Server Timestamp**
   - Path: `inventory/PROD-1`
   - Payload: `{ "updatedAt": "2020-01-01T00:00:00Z" }`
   - Auth: Admin
   - Expect: `PERMISSION_DENIED`

8. **Shadow Field Injection**
   - Path: `inventory/PROD-1`
   - Payload: `{ "name": "Name", "category": "Cat", "hidden_role": "admin" }`
   - Auth: Admin
   - Expect: `PERMISSION_DENIED`

9. **Terminal State Reversal**
   - Path: `inventory/PROD-1` (Existing doc with `status: "discontinued"`)
   - Payload: `{ "status": "active" }` (if we had such a field)
   - Expect: `PERMISSION_DENIED`

10. **Immutability Breach (Changing ID)**
    - Path: `inventory/PROD-1`
    - Update Payload: `{ "id": "PROD-2" }`
    - Auth: Admin
    - Expect: `PERMISSION_DENIED`

11. **PII Leak (List chat logs)**
    - Path: `Noa_AI_Logs`
    - Query: `getDocs()`
    - Auth: Guest
    - Expect: `PERMISSION_DENIED`

12. **Orphaned Encyclopedia Item**
    - Path: `encyclopedia_items/item-1`
    - Payload: `{ "categoryId": "non-existent-cat" }`
    - Auth: Admin
    - Expect: `PERMISSION_DENIED` (via `exists()`)
