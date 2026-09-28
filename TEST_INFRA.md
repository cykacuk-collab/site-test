# E2E Test Infra: Admin Dashboard for Histoire et Saveurs

## Test Philosophy
- Opaque-box, requirement-driven derived from `ORIGINAL_REQUEST.md`.
- No dependency on implementation design details.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Route Auth Guard | ORIGINAL_REQUEST §Security | 5 | 5 | ✓ |
| 2 | Product Catalog Table & Search | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 3 | Add Product with Image | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 4 | Edit Product & Stock Adjustment | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 5 | Delete & Deactivate Product | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 6 | Paid Orders List Display | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 7 | Customer Details & Cart Items | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 8 | Order Status Update (No RLS Error) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 9 | Sales Analytics KPI Cards | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 10 | Sales Chart (0 SSR Hydration Errors) | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |

## Test Architecture
- Test runner: Vitest / Playwright / Node integration tests
- Test directory: `tests/e2e/` and `tests/unit/`
- Test files:
  - `tests/e2e/tier1_feature_coverage.spec.ts`: Happy-path feature verification
  - `tests/e2e/tier2_boundary_corner.spec.ts`: Edge cases, negative numbers, 0 orders, invalid file types
  - `tests/e2e/tier3_cross_feature.spec.ts`: Interactions between products, orders, status updates, and analytics
  - `tests/e2e/tier4_real_world.spec.ts`: Complete admin operational workflows

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Daily Inventory Restock & Product Launch | Create new product, upload image, adjust stock, verify catalog and filters | Medium |
| 2 | Complete Order Fulfillment Lifecycle | Receive paid order, inspect customer and cart items, transition through processing -> shipped -> delivered | High |
| 3 | Financial Analytics Audit | Validate that order totals roll up accurately into revenue cards, AOV, and top-selling leaderboard | Medium |
| 4 | Product Deletion Safety on Ordered Item | Attempt to delete item present in active order; verify soft deactivation fallback | High |
| 5 | Unauthorized Intrusion Attempt & Hard Refresh | Attempt direct access unauthenticated; authenticate and hard refresh chart without hydration error | Medium |

## Coverage Thresholds
- Tier 1: ≥ 50 test cases (5 per feature across 10 core features)
- Tier 2: ≥ 50 test cases (boundary & corner cases)
- Tier 3: ≥ 10 test cases (pairwise interactions)
- Tier 4: ≥ 5 realistic application scenarios
