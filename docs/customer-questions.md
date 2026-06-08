# Customer Questions

## Unanswered

### [MANDATORY] How should payroll rates be managed each month?
- **Context:** Currently admin must manually set rates (per material type + stage) for each new month. Options: (1) Manual entry every month as-is, (2) Auto-carry-forward from previous month with option to edit, (3) Set a "default rate" that applies unless overridden for a specific month. If admin forgets to set rates for a new month, payroll calculation returns ₹0.
- **Added:** 2026-06-08

### [OPTIONAL] Should cutting quantity have an upper bound based on roll meters?
- **Context:** Currently a cutting worker can enter any number of pieces (e.g., 9999 from a 50m roll). There's no formula to derive max pieces from meters since it depends on pattern/size. Should we add a configurable "max pieces per meter" multiplier, or leave it to worker judgment?
- **Added:** 2026-06-08

### [OPTIONAL] Ironing entries: additive log vs single entry per size?
- **Context:** Currently each ironing submission creates a new row (M:1, M:4 shows as two entries). This gives a work history log. Alternative: upsert like cutting/stitching where one row per size gets overwritten. Additive is better for tracking partial work across shifts. Single row is cleaner but loses history.
- **Added:** 2026-06-08
