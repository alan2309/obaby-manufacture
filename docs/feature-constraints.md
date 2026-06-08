# Feature Constraints & Current Behavior

## Limits
- **Leftover meters:** Cannot exceed total initial meters of assigned rolls — enforced in `src/cutting/cutting.service.ts`
- **Stitching quantity per size:** Cannot exceed cutting output for that size — enforced in `src/stitching/stitching.service.ts`
- **Ironing quantity per size:** Cannot exceed (stitched - already ironed) for that size — enforced in `src/ironing/ironing.service.ts`
- **Cutting/Stitching minimum quantity:** Must be ≥ 1 per entry — enforced in DTOs
- **Ironing minimum quantity:** Must be ≥ 1 — enforced in DTO
- **Payroll rate:** Must be > 0 — enforced in `src/payroll/dto/set-rate.dto.ts`

## Hardcoded Values
- **JWT expiry:** 15 minutes — set in `.env` (`JWT_EXPIRY=15m`)
- **Refresh token expiry:** 7 days — set in `.env` (`REFRESH_TOKEN_EXPIRY_DAYS=7`)
- **Leftover threshold:** 0.5 meters — stored in `SystemConfig` table, seeded in `prisma/seed.ts`
- **Password hash rounds:** 10 — `bcrypt.hash(password, 10)` in seed and auth service
- **Available sizes:** XS, S, M, L, XL, XXL, XXL3, XXL4, XXL5 — defined in Prisma `Size` enum
- **Payroll year range:** Current year ±2 (5-year window) — `frontend/src/app/admin/payroll/page.tsx`

## Business Rules
- **Batch lifecycle:** DRAFT → CUTTING_ASSIGNED → CUTTING_IN_PROGRESS → CUTTING_DONE → STITCHING_ASSIGNED → STITCHING_IN_PROGRESS → STITCHING_DONE → IRONING_IN_PROGRESS → COMPLETED
- **Stitching worker assignment:** Only possible when batch is in CUTTING_DONE status
- **Auto-complete on ironing:** Batch moves to COMPLETED when all sizes are fully ironed
- **Auto-ledger entries:** When a worker completes their stage, a payroll ledger entry is auto-created with total quantity, material type (from roll), and current month
- **Ironing ledger entry timing:** Created only when batch fully completes (all sizes ironed), not on each partial submission
- **Payroll finalization is immutable:** Once finalized for a worker+month, cannot re-finalize
- **Cannot edit finalized ledger entries:** Ledger entries in a finalized month are locked
- **One cutting worker per batch:** Cannot reassign once assigned
- **One stitching worker per batch:** Cannot reassign once assigned
- **Multiple rolls per batch:** A batch can have multiple rolls assigned (each roll to only one batch)

## Known Limitations
- **No upper bound on cutting quantity:** Worker can enter any number of pieces regardless of roll meters
- **No "undo complete":** Once a stage is marked complete, it cannot be reverted (admin can edit quantities via PATCH)
- **Ironing has no dedicated worker assignment:** Any user with IRON role can iron any batch in STITCHING_DONE/IRONING_IN_PROGRESS
- **Payroll calculation depends on manual ledger entries:** Not auto-generated from batch work
- **Single material type per roll:** Each roll has exactly one material type
