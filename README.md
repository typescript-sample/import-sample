# import-sample

A complete example demonstrating how to build a **fixed-length file import application** using the **import-service** framework and the **core-ts** ecosystem.

This sample imports fixed-length text files, transforms each record into a TypeScript object, validates the data, and stores it in a MySQL database using a clean, streaming import pipeline.

Unlike CSV-based examples, this project demonstrates how **import-service** can process enterprise data formats commonly used in banking, insurance, telecommunications, and legacy systems.

---

# Architecture

```text
 Fixed-Length File
        │
        ▼
     Reader
        │
        ▼
FixedLengthTransformer
        │
        ▼
    Validator
        │
        ▼
      Writer
        │
        ▼
      MySQL
```

The application processes one record at a time, making it suitable for importing very large files.

---

# Features

- Streaming fixed-length file import
- Automatic field mapping
- Schema-driven parsing
- Validation before persistence
- MySQL integration
- Configurable logging
- Error handling
- Large file support
- Clean separation of responsibilities

---

# Technologies

This sample demonstrates how the following libraries work together.

| Library         | Purpose                    |
| --------------- | -------------------------- |
| import-service  | Streaming import framework |
| validation-core | Data validation            |
| sql-core        | SQL abstraction            |
| mysql2-core     | MySQL implementation       |
| config-plus     | Configuration management   |
| mysql2          | MySQL driver               |

---

# Import Pipeline

The application follows the import pipeline provided by **import-service**.

```text
  Reader
    │
    ▼
Transformer
    │
    ▼
 Validator
    │
    ▼
  Writer
```

Each stage has a single responsibility.

---

# Project Structure

```text
src/
├── app.ts
├── config.ts
├── user/
│   ├── user.ts
│   ├── port.ts
│   ├── transformer.ts
│   ├── validator.ts
│   ├── writer.ts
│   └── service.ts
└── ...
```

---

# How It Works

1. Read a fixed-length file.
2. Split each record into fields according to the schema.
3. Convert fields into a TypeScript object.
4. Validate the object.
5. Insert valid records into MySQL.
6. Log validation errors and exceptions.
7. Continue until the file is completely processed.

---

# Running the Sample

Install dependencies.

```bash
npm install
```

Configure the database.

```bash
npm run build
npm start
```

---

# Fixed-Length Schema

Each field is described by its type and length.

```typescript
const attributes: FixedLengthAttributes = {
  id: {
    key: true,
    length: 11,
    type: "number",
  },
  username: {
    length: 10,
    required: true,
  },
  email: {
    length: 31,
    required: true,
  },
  phone: {
    length: 20,
  },
  status: {
    length: 5,
  },
  createdDate: {
    length: 10,
    type: "date",
  },
}
```

The framework automatically extracts and converts each field into the appropriate TypeScript type.

---

# Sample Input

```
00000000001 abraham59             rory30@example.com        975-283-2267 true2019-02-20
00000000002jerde.tito           qpacocha@example.com  (738)952-6078x1634 true1995-06-13
```

After transformation:

```typescript
{
    id: 1,
    username: "abraham59",
    email: "rory30@example.com",
    phone: "975-283-2267",
    status: true,
    createdDate: new Date("2019-02-20)
}
```

---

# Validation

Validation occurs after transformation and before writing.

```text
 Record
    │
    ▼
Transformer
    │
    ▼
Validator
    │
    ▼
  Writer
```

Invalid records are logged and skipped without interrupting the import process.

---

# Error Handling

The sample separates validation failures from runtime exceptions.

## Validation Errors

Business rule violations.

Examples:

- Required field missing
- Invalid email
- Invalid value
- Invalid date

## Exceptions

Unexpected runtime failures.

Examples:

- Database connection errors
- File I/O errors
- Unexpected exceptions

Each type of error is handled independently.

---

# Streaming

The application processes records using `AsyncIterable`.

```text
Record 1
   │
   ▼
Record 2
   │
   ▼
Record 3
   │
   ▼
  ...
```

This allows importing very large files with minimal memory consumption.

---

# Why Fixed-Length Files?

Although CSV files are common, many enterprise systems still exchange data using fixed-length records because they are:

- Fast to parse
- Compact
- Easy to validate
- Widely used by legacy systems
- Common in banking and financial institutions

This sample demonstrates how **import-service** supports these formats with the same import pipeline used for CSV files.

---

# Learning Objectives

This sample demonstrates how to:

- Read fixed-length files
- Define field lengths
- Map records to TypeScript objects
- Validate imported data
- Store data in MySQL
- Handle validation errors
- Handle runtime exceptions
- Build a reusable streaming import pipeline

---

# Related Projects

- **config-plus** – Configuration library
- **logger-core** – Logging library

- **import-service** – Streaming import framework
- **validation-core** – Validation framework
- **mysql2-core** – MySQL implementation
- **sql-core** – SQL abstraction

---

# License

MIT License.
