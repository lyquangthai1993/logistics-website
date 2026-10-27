# PostgreSQL Zero-Lock Architecture & Non-Blocking Dumps

This document outlines the technical underpinnings of zero-lock database dumping and synchronization in PostgreSQL for Spider Express Logistics TMS.

---

## 1. PostgreSQL Lock Compatibility Matrix

PostgreSQL employs Multi-Version Concurrency Control (MVCC). Rather than locking rows for reading, PostgreSQL creates versions of rows (tuples).

| Existing Table Lock | Can Acquire `ACCESS SHARE` (Our Dump)? | Conflicts with `ROW EXCLUSIVE` (Writes)? |
| :--- | :---: | :---: |
| **ACCESS SHARE** (`SELECT`) | **YES** | **NO** |
| **ROW SHARE** (`SELECT FOR UPDATE`) | **YES** | **NO** |
| **ROW EXCLUSIVE** (`INSERT/UPDATE/DELETE`) | **YES** | **NO** |
| **SHARE UPDATE EXCLUSIVE** (`VACUUM`, `ANALYZE`) | **YES** | **NO** |
| **SHARE** (`CREATE INDEX`) | **YES** | **YES** |
| **SHARE ROW EXCLUSIVE** | **NO** | **YES** |
| **EXCLUSIVE** | **NO** | **YES** |
| **ACCESS EXCLUSIVE** (`ALTER TABLE`, `DROP`, `TRUNCATE`) | **NO** | **YES** |

### Why Writers Are Never Blocked
- All application writes (`INSERT`, `UPDATE`, `DELETE`) acquire **`ROW EXCLUSIVE`** lock on the target table.
- Our dump queries acquire **`ACCESS SHARE`** lock on the target table.
- Because `ACCESS SHARE` and `ROW EXCLUSIVE` **do not conflict**, readers and writers proceed concurrently with zero waiting.

---

## 2. The Danger of Lock Queuing & Anti-Cascade Guard

### The Classic PostgreSQL Lock Queue Trap
Without proper timeouts, an online backup can cause an unexpected site outage via lock queuing:

1. `Session A` (Dump) starts reading `order` table with `ACCESS SHARE`.
2. `Session B` (Migration / DDL) attempts `ALTER TABLE order ADD COLUMN ...`, requesting `ACCESS EXCLUSIVE`. It waits for `Session A` to finish.
3. `Session C` (Production API) attempts `INSERT INTO order ...`, requesting `ROW EXCLUSIVE`.
4. In PostgreSQL, **all new requests queue behind waiting exclusive requests** to prevent starvation. Even though `Session C` could run with `Session A`, it must wait for `Session B`!
5. **Cascade Effect**: Production database connection pool fills up in seconds, leading to HTTP 504 gateway timeouts.

### The Solution: `lock_timeout`
By setting:
```sql
SET lock_timeout = '4000'; -- 4 seconds
```
If a DDL or maintenance transaction is waiting or holding exclusive access, our dump query will fail fast after 4 seconds instead of waiting and creating a bottleneck for incoming transactions.

---

## 3. Snapshot Consistency via `REPEATABLE READ`

In default `READ COMMITTED` isolation, each query in a transaction sees data committed before *that specific query* began.
- If `order` is read at $T_0$, and `order_inventory_transaction` is read at $T_1$, rows inserted between $T_0$ and $T_1$ will appear in `order_inventory_transaction` but not in `order`.
- This causes foreign key violation errors when restoring to Dev.

By using:
```sql
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
```
PostgreSQL creates a **single logical snapshot** at the start of the transaction. All subsequent queries across all 15 tables see the database frozen at that exact microsecond, regardless of concurrent write activity.

---

## 4. Foreign Key Bypass on Dev via `session_replication_role`

When inserting data into Dev:
- Many tables have complex foreign keys (e.g., `user` -> `role`, `order` -> `user`, `order` -> `hub`, `trip` -> `vehicle`, `trip_stop` -> `trip`, `order_inventory_transaction` -> `order`).
- Running standard `INSERT` statements with active foreign key triggers causes foreign key validation on every single row, slowing down restoration by 10x-50x.
- By issuing:
  ```sql
  SET session_replication_role = 'replica';
  ```
  PostgreSQL temporarily disables trigger executions (including foreign key checks and custom triggers) for the active session only, without altering the schema definition.
- Once chunked inserts and sequence alignments complete:
  ```sql
  SET session_replication_role = 'origin';
  ```
  Full constraint validation is immediately restored.

---

## 5. PostgreSQL Sequences & `setval()`

Primary keys using `BIGSERIAL` or identity columns rely on independent sequence objects.
- If you copy row IDs into a table without updating the sequence's internal counter, the next `INSERT` on Dev will generate an already-existing ID, causing `unique_violation` errors (`duplicate key value violates unique constraint`).
- Synchronization must always inspect `last_value` and `is_called` from each sequence on Production:
  ```sql
  SELECT last_value, is_called FROM "<sequence_name>";
  ```
- And realign on Dev:
  ```sql
  SELECT setval('<sequence_name>', last_value, is_called);
  ```
- In Logistics TMS, 13 core sequences are tracked and maintained in [`scripts/railway-db-sync.mjs`](file:///d:/Projects/logistics-website/scripts/railway-db-sync.mjs).
