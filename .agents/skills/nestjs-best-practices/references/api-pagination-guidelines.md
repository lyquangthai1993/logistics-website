# API Listing & Pagination Governance Guidelines

> **Core Principle**: **Zero-Assumption Policy** for all Collection / Listing endpoints (`GET /<resources>`).
> Agents MUST NEVER assume whether pagination is required without explicit user confirmation.

---

## 📋 1. Mandatory Workflow: Confirm With User First

Before implementing any collection endpoint (`GET /api/v1/<resources>`), the agent **MUST** present confirmation questions in the `Open Questions` section of `implementation_plan.md` or directly confirm with the user:

| Key Question | Technical Implication | Default Practice |
|---|---|---|
| **1. Pagination Strategy?** | Standard pagination (`page`, `limit`, `total`) vs. Flat Array? | Mandatory confirmation |
| **2. Default Page Size?** | Default `limit` value (10, 20, or 50 items)? | Default: 10 or 20 |
| **3. Dedicated Lookup Endpoint?** | Provide a lightweight endpoint (e.g. `GET /active` or `/lookup`) for Dropdown/Select forms? | Recommended separation |

---

## 🏗️ 2. Standard Paginated Response Structure (NestJS)

All paginated collection endpoints MUST strictly adhere to the unified schema:

```typescript
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

### Standard Query DTO:
```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryPaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search term for text filters' })
  @IsOptional()
  @IsString()
  search?: string;
}
```

---

## ⚡ 3. Best Practice: Separation of Concerns

1. **Management Collection (`GET /api/v1/<resources>`)**:
   - Used for administrative and operational data tables.
   - Requires pagination (`page`, `limit`), search query (`search`), and filters (`status`, `isActive`, date ranges).
   - Returns `PaginatedResult<T>`.

2. **Lookup / Form Selection (`GET /api/v1/<resources>/active` or `/lookup`)**:
   - Used for Select/Dropdown options in modals and creation forms.
   - Non-paginated (or large limit), returning only necessary lookup fields (`id`, `name`, `code`).
   - Filters only active and non-soft-deleted entities (`isActive = true`, `deletedAt IS NULL`).
   - Returns a lightweight flat array `T[]`.
