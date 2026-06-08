# MMS — Complete UI Test Steps

> **URL:** http://localhost:3001  
> **Backend:** http://localhost:3000

---

## PART 1: Admin

**Login:** `admin@mms.local` / `admin123`

---

### Step 1 — Validation: Create Product WITHOUT Materials

| Field | Value |
|-------|-------|
| Name | `Test No Material` |
| Category | `Test` |
| Size From | S |
| Size To | XL |
| Materials | *(none selected)* |

**Action:** Click **Add Product**  
**✅ Expected:** Red error — *"Please select at least one material type"*

---

### Step 2 — Validation: Create Product with Bad Size Range

| Field | Value |
|-------|-------|
| Name | `Test Bad Size` |
| Category | `Test` |
| Size From | XL |
| Size To | S |
| Materials | ☑ Cotton |

**Action:** Click **Add Product**  
**✅ Expected:** Red error — *"'Size From' must be smaller than or equal to 'Size To'"*

---

### Step 3 — Create Product (Valid)

| Field | Value |
|-------|-------|
| Name | `Obaby Test Polo` |
| Category | `Casual Wear` |
| Size From | S |
| Size To | XXL |
| Materials | ☑ Cotton, ☑ Polyester |

**Action:** Click **Add Product**  
**✅ Expected:** Product appears in the list

---

### Step 4 — Inventory: Add Roll (Validation)

| Field | Value |
|-------|-------|
| Roll Code | `ROLL-TEST-001` |
| Vendor | *(any)* |
| Material | Cotton |
| Color | Navy Blue |
| GSM | `0` |

**Action:** Try to submit  
**✅ Expected:** Browser blocks submission (min=1)

---

### Step 5 — Inventory: Add Roll (Valid)

| Field | Value |
|-------|-------|
| Roll Code | `ROLL-TEST-001` |
| Vendor | *(pick any)* |
| Material | Cotton |
| Color | Navy Blue |
| GSM | `180` |
| Meters | `50` |
| Cost | `2500` |
| Purchase Date | *(today)* |

**Action:** Click **Add Roll**  
**✅ Expected:** Roll appears in table with status **Available**

---

### Step 6 — Batches: Create Batch

> **Button States Reference:**
> | Appearance | Meaning |
> |-----------|---------|
> | Blue (clickable) | Action available |
> | Green with ✓ | Already done |
> | Gray (disabled) | Not yet applicable |

| Field | Value |
|-------|-------|
| Batch Code | `BATCH-2026-005` *(use any unused code)* |
| Product | Obaby Kids Cotton Romper |

**Action:** Click **Create**  
**✅ Expected:** Batch appears with status **DRAFT**

---

### Step 7 — Assign Roll to Batch

**On:** `BATCH-2026-005`  
**Action:** Click **+Roll** (blue, clickable) → Select `ROLL-TEST-001` (or any Available roll) → Click **Assign**  
**✅ Expected:** No error. Roll shows as "Assigned" in inventory. +Roll button stays blue (can add more rolls).

---

### Step 8 — Assign Cutting Worker

**On:** `BATCH-2026-005`  
**Action:** Click **+Cut** (blue, clickable) → Select **Cutting Worker** → Click **Assign**  
**✅ Expected:** Status changes to **CUTTING_ASSIGNED**. Button changes to **✓ Cut** (green). +Stitch still gray/disabled.

---

### Step 9 — Assign Stitching Worker

> ⚠️ **Note:** +Stitch button is gray/disabled here — stitching can only be assigned after cutting is done (`CUTTING_DONE` status). This is by design. Skip to Part 2, then come back after Step 14.

**✅ Expected:** +Stitch button is gray and not clickable.---

## PART 2: Cutting Worker

**Login:** `cutting@mms.local` / `cutting123`

---

### Step 10 — See Batch

**✅ Expected:** `BATCH-2026-005` visible with product name and assigned rolls

---

### Step 11 — Submit Empty Quantities

**Action:** Leave all size inputs blank → Click **Save Quantities**  
**✅ Expected:** Alert — *"Please enter at least one size quantity"*

---

### Step 12 — Submit Valid Quantities

| Size | Quantity |
|------|----------|
| XS | 10 |
| S | 15 |
| M | 20 |
| L | 15 |
| XL | 10 |

**Action:** Click **Save Quantities**  
**✅ Expected:** Success (no error)

---

### Step 13 — Submit Leftover

| Field | Value |
|-------|-------|
| Leftover (meters) | `5.5` |

**Action:** Click **Save Leftover**  
**✅ Expected:** Success

---

### Step 14 — Complete Batch

**Action:** Click **Complete**  
**✅ Expected:** Batch disappears from cutting list (moved to STITCHING/CUTTING_DONE)

---

### Step 9 (continued) — Assign Stitching Worker (Admin)

**Login as admin again.**  
**On:** `BATCH-2026-005` (now in CUTTING_DONE)  
**Action:** Click **+Stitch** (now blue/clickable) → Select **Stitching Worker** → Click **Assign**  
**✅ Expected:** Status changes to **STITCHING_ASSIGNED**. Button changes to **✓ Stitch** (green). +Cut already shows **✓ Cut** (green).

---

## PART 3: Stitching Worker

**Login:** `stitching@mms.local` / `stitching123`

---

### Step 15 — See Batch in Stitching

**✅ Expected:** `BATCH-2026-005` visible with cutting output:

| Size | Cut |
|------|-----|
| XS | 10 |
| S | 15 |
| M | 20 |
| L | 15 |
| XL | 10 |

---

### Step 16 — Try Over-Stitching (Edge Case)

| Size | Quantity |
|------|----------|
| M | `25` *(cutting was only 20)* |

**Action:** Click **Save Quantities**  
**✅ Expected:** Backend rejects — cannot exceed cutting output

---

### Step 17 — Submit Valid Stitching

| Size | Quantity |
|------|----------|
| XS | 10 |
| S | 14 |
| M | 19 |
| L | 15 |
| XL | 10 |

**Action:** Click **Save Quantities**  
**✅ Expected:** Success

---

### Step 18 — Complete Stitching

**Action:** Click **Complete**  
**✅ Expected:** Batch moves to IRONING stage

---

## PART 4: Iron Worker

**Login:** `iron@mms.local` / `iron123`

---

### Step 19 — See Available Stock

**✅ Expected:** Table shows:

| Batch | Size | Available |
|-------|------|-----------|
| BATCH-2026-005 | XS | 10 |
| BATCH-2026-005 | S | 14 |
| BATCH-2026-005 | M | 19 |
| BATCH-2026-005 | L | 15 |
| BATCH-2026-005 | XL | 10 |

---

### Step 20 — Try Over-Ironing (Edge Case)

| Field | Value |
|-------|-------|
| Batch | BATCH-2026-005 |
| Size | M |
| Quantity | `25` *(only 19 available)* |

**Action:** Click **Submit**  
**✅ Expected:** Backend rejects

---

### Step 21 — Submit Valid Ironing (All Sizes)

Submit each one individually:

| # | Batch | Size | Quantity |
|---|-------|------|----------|
| 1 | BATCH-2026-005 | XS | 10 |
| 2 | BATCH-2026-005 | S | 14 |
| 3 | BATCH-2026-005 | M | 19 |
| 4 | BATCH-2026-005 | L | 15 |
| 5 | BATCH-2026-005 | XL | 10 |

**✅ Expected:** Each succeeds. Available stock reaches 0. Batch auto-completes to **DONE**.

---

## PART 5: Payroll

**Login:** `admin@mms.local` / `admin123`

---

### Step 22 — Set Rate (Invalid Month)

| Field | Value |
|-------|-------|
| Material | Cotton |
| Stage | Cutting |
| Rate | `5` |
| Month | `abc` |

**Action:** Click **Set Rate**  
**✅ Expected:** Browser blocks (YYYY-MM pattern required)

---

### Step 23 — Set Rate (Valid)

| Field | Value |
|-------|-------|
| Material | Cotton |
| Stage | Cutting |
| Rate | `5` |
| Month | `2026-06` |

**Action:** Click **Set Rate**  
**✅ Expected:** Rate appears in table

---

### Step 24 — Set More Rates

| Material | Stage | Rate | Month |
|----------|-------|------|-------|
| Cotton | Stitching | `8` | `2026-06` |
| Cotton | Ironing | `3` | `2026-06` |

---

### Step 25 — Calculate Payroll

| Field | Value |
|-------|-------|
| Worker | Cutting Worker |

**Action:** Click **Calculate**  
**✅ Expected:** Shows total — 70 pieces × ₹5 = **₹350**

---

### Step 26 — Finalize Payroll

| Field | Value |
|-------|-------|
| Month filter | `2026-06` |
| Worker | Cutting Worker |

**Action:** Click **Finalize**  
**✅ Expected:** Creates immutable snapshot in ledger table

---

## Batch Lifecycle Reference

```
DRAFT → CUTTING_ASSIGNED → CUTTING_DONE → STITCHING_ASSIGNED → STITCHING_IN_PROGRESS → IRONING → DONE
                                                                                                  ↘ CANCELLED (any active status)
```

## Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@mms.local | admin123 |
| Cutting | cutting@mms.local | cutting123 |
| Stitching | stitching@mms.local | stitching123 |
| Ironing | iron@mms.local | iron123 |
