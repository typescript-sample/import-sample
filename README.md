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
├── config.ts
├── app.ts
├── user/
│   ├── user.ts
│   ├── port.ts
│   ├── transformer.ts
│   ├── validator.ts
│   ├── writer.ts
│   ├── service.ts
│   └── index.ts
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

# import-csv-sample

A complete CSV import application built with the **core-ts** ecosystem.

This project demonstrates how to build a high-performance, enterprise-grade CSV import application using **import-service**, **validation-core**, **mysql2-core**, and related libraries.

Instead of focusing on CSV parsing alone, the sample shows how to implement a complete import pipeline, including data transformation, validation, persistence, logging, and progress reporting.

---

# Features

- CSV file import
- Streaming processing using `AsyncIterable`
- Automatic type conversion
- Data validation
- MySQL persistence
- Error handling
- Exception handling
- Progress reporting
- Buffered logging
- Configuration management
- Enterprise architecture

---

# Architecture

The application is built as a processing pipeline.

```text
                CSV File
                    │
                    ▼
               CSV Reader
                    │
                    ▼
              AsyncIterable
                    │
                    ▼
             CSVTransformer
                    │
                    ▼
               Validator
                    │
                    ▼
               MySQLWriter
                    │
                    ▼
               MySQL Database
```

Each stage has a single responsibility and can be replaced independently.

---

# Project Structure

```text
src
├── config
│   └── configuration.ts
│
├── model
│   ├── user.ts
│   └── user-model.ts
│
├── reader
│   └── csv-reader.ts
│
├── service
│   ├── mysql-writer.ts
│   ├── validator.ts
│   ├── error-handler.ts
│   └── exception-handler.ts
│
├── app.ts
└── index.ts
```

---

# Libraries

This sample demonstrates how multiple libraries work together.

| Library         | Purpose           |
| --------------- | ----------------- |
| import-service  | Import pipeline   |
| validation-core | Object validation |
| mysql2-core     | Database access   |
| config-plus     | Configuration     |
| logger-core     | Logging           |
| csv-parse       | CSV parsing       |

---

# Processing Flow

The application performs the following steps.

```text
Read Configuration

↓

Locate CSV Files

↓

Create CSV Reader

↓

Transform Records

↓

Validate Objects

↓

Write to MySQL

↓

Log Results
```

---

# Domain Model

The sample imports users.

```text
CSV

↓

User

↓

Validation

↓

Database
```

The same metadata is reused for:

- CSV transformation
- Validation
- SQL mapping

This minimizes duplication and keeps the application consistent.

---

# CSV Reader

The reader converts a CSV file into an `AsyncIterable`.

```text
CSV File

↓

CSV Reader

↓

AsyncIterable<string[]>
```

The import pipeline is independent of the CSV parser implementation.

Any reader that produces an `AsyncIterable` can be used.

---

# Import Pipeline

The application uses `ImportService`.

```text
Reader

↓

Transformer

↓

Validator

↓

Writer
```

Each component is injected into the importer.

This makes the application easy to test and extend.

---

# Validation

Before data is written to the database, every record is validated.

Validation failures are sent to an error handler.

```text
Transformer

↓

Validator

↓

ErrorHandler
```

Invalid records do not stop the import.

---

# Writing Data

Valid records are written to MySQL through a dedicated writer.

```text
Customer

↓

MySQLWriter

↓

Database
```

The import pipeline has no knowledge of SQL.

Persistence is isolated inside the writer.

---

# Error Handling

Business validation failures are handled independently from runtime exceptions.

Validation

```text
Record

↓

Validator

↓

ErrorHandler
```

Runtime Exceptions

```text
Reader

↓

Writer

↓

ExceptionHandler
```

This allows invalid records to be processed separately from unexpected failures.

---

# Progress Reporting

The importer reports progress while processing large files.

Example:

```text
Importing users.csv...

Processed 10,000 records...
Processed 20,000 records...
Processed 30,000 records...

Import completed.
```

Progress reporting is configurable through `ImportService`.

---

# Logging

The sample demonstrates two kinds of logging.

- Information log
- Error log

Separating operational logs from error logs makes production troubleshooting easier.

---

# Configuration

Application settings are loaded using **config-plus**.

Typical configuration includes:

- Database connection
- Import directory
- Archive directory
- Log directory
- Progress interval

No configuration values are hard-coded.

---

# Running the Application

Install dependencies.

```bash
npm install
```

Run the application.

```bash
npm start
```

The application will:

1. Load configuration.
2. Find CSV files.
3. Import each file.
4. Validate every record.
5. Save valid records.
6. Record validation failures.
7. Log progress.
8. Report the final result.

---

# Why This Sample?

Most CSV examples demonstrate only how to parse a file.

This project demonstrates how to build a complete import application.

It includes:

- Streaming file processing
- Object transformation
- Validation
- Database persistence
- Error handling
- Logging
- Progress reporting

The same architecture can easily be adapted to import data into:

- PostgreSQL
- SQL Server
- Oracle
- MongoDB
- REST APIs
- Message queues
- Cloud services

Simply replace the writer while keeping the rest of the pipeline unchanged.

---

# Related Projects

- **import-service** — Streaming data import framework
- **validation-core** — High-performance validation framework
- **mysql2-core** — MySQL execution layer
- **query-mappers** — Object mapping
- **sql-core** — SQL execution framework

Together, these libraries provide a modular foundation for building enterprise data processing applications.

---

# License

MIT
