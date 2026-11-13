# Data Model and Database Mapping

## Database schema

The project uses the following MySQL table definition supplied for this project:

```sql
create table if not exists userimport (
    id varchar(45) not null,
    username varchar(45),
    email varchar(45),
    phone varchar(45),
    status varchar(45),
    createddate datetime,
    primary key (id)
);
```

Only `id` is declared `NOT NULL`; it is also the primary key. The remaining columns are nullable in this DDL. The table has six columns.

## TypeScript interface

Current source: `src/user/user.ts`.

```ts
export interface User {
  id: string
  username: string
  email?: string
  phone?: string
  status?: boolean
  createdDate?: string
}
```

## Fixed-width model metadata

The same file exports `userModel`, used by the transformer, validator, and writer:

| Property | Current metadata | Notes |
| --- | --- | --- |
| `id` | `key: true`, `length: 11`, `type: "number"` | Marked as key and numeric in the import model. |
| `username` | `length: 10`, `required: true` | Required by the import model. |
| `email` | `length: 31`, `required: true` | Required by the import model. |
| `phone` | `length: 20` | No explicit type or required flag. |
| `status` | `length: 5` | No explicit type or required flag. |
| `createdDate` | `length: 10`, `type: "date"` | Date-typed in the import model. |

These `length` values belong to the fixed-width import metadata. They are not the `varchar(45)` capacities in the database DDL. Do not change them to `45` merely because the database columns are `varchar(45)`; first establish the actual incoming file layout.

## Current mapping and discrepancies

| Field | SQL column/type | TypeScript | `userModel` | What an AI must verify |
| --- | --- | --- | --- | --- |
| `id` | `id varchar(45) NOT NULL PRIMARY KEY` | `string` | `length: 11`, `type: "number"`, `key: true` | The interface says string but the import metadata requests numeric conversion. Confirm whether identifiers can contain letters or leading zeroes before changing this. |
| `username` | `username varchar(45)` | required `string` | `length: 10`, required | Confirm the source-file field width is 10; this is not the database capacity. |
| `email` | `email varchar(45)` | optional `string` | `length: 31`, required | TypeScript optionality conflicts with the import metadata's required flag. Determine the intended business rule. |
| `phone` | `phone varchar(45)` | optional `string` | `length: 20` | The import layout width is 20; the database column can hold up to 45 characters. |
| `status` | `status varchar(45)` | optional `boolean` | `length: 5`, no type | SQL stores text, the TypeScript interface declares boolean, and no boolean conversion type is visible in `userModel`. Define allowed stored values and conversion behavior explicitly. |
| `createdDate` | `createddate datetime` | optional `string` | `length: 10`, `type: "date"` | The property differs from the SQL column only by casing. Verify how `mysql2-core` maps model property names to column names. Also define whether the source contains a date only or a date and time. |

### Important instructions for generated code

- Do not silently “fix” the mismatches above when adding an unrelated feature.
- Before changing one of these fields, identify the intended contract across all three layers: incoming fixed-width record, TypeScript `User`, and MySQL column.
- If the intended application representation of `status` is boolean while the database stores strings, specify the accepted string values and implement an explicit, tested conversion at the appropriate boundary. Do not assume values such as `Y/N`, `1/0`, or `true/false`; none are defined in the current source.
- Do not infer date parsing rules from `type: "date"` alone. Check the installed transformer implementation or existing input examples.
- Verify the column-name mapping before renaming `createdDate`; the actual writer is implemented by `mysql2-core`, which is external to this repository.
- The final `true` argument passed to `new Validator(userModel, true)` and `new MySQLWriter(pool, "userimport", userModel, true)` is not documented in this source. Preserve it until its meaning is verified.

## Shared metadata rule

The transformer, validator, and writer all receive the exported `userModel` object. When changing field metadata, update this single shared model rather than creating divergent field definitions in each adapter. If the database mapping requires a separate structure in the future, document the distinction explicitly.
