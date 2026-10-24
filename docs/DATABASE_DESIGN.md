# SREMS — Database Design

## 1. Overview

SREMS uses a relational database managed through Laravel migrations and Eloquent ORM. The database stores user accounts, properties, property images, bookings, appointments, installment plans, and payment records.

The project is configured to use MySQL/MariaDB for the application database. The exact production schema should be verified against the deployed database and completed migrations.

## 2. Main Entities

### 2.1 Users

**Table:** `users`

Purpose: Stores account and authentication information.

Known fields include:

- `id` — Primary key
- `name` — User's name
- `email` — Unique email address
- `password` — Hashed password
- `role` — Account role, defaulting to `user`
- `email_verified_at` — Optional email verification timestamp

The table also includes Laravel-managed timestamps.

### 2.2 Properties

**Table:** `properties`

Purpose: Stores property and project information.

Known fields include:

- `id` — Primary key
- `property_code` — Unique property identifier
- `property_name` — Property name
- `project_name` — Optional project name
- `property_type` — Property category
- `location` — Property location
- `size_sqft` — Optional property size
- `price` — Property price
- `status` — Property status
- `description` — Optional description
- `created_by` — Reference to the user who created the record

### 2.3 Property Images

**Table:** `property_images`

Purpose: Stores image metadata associated with properties.

Known fields include:

- `id` — Primary key
- `property_id` — Reference to a property
- `image_path` — Stored image path
- `image_name` — Optional image name
- `is_primary` — Indicates the primary image

The migration history contains image-schema repair migrations. The final database schema should be checked before making further structural changes.

### 2.4 Bookings

**Table:** `bookings`

Purpose: Stores customer requests to book properties.

Known fields include:

- `id` — Primary key
- `user_id` — Customer reference
- `property_id` — Property reference
- `requested_date` — Optional requested date
- `message` — Optional customer message
- `status` — Booking workflow status
- `reviewed_by` — Reviewing user's reference
- `reviewed_at` — Optional review timestamp
- `admin_note` — Optional administrative note

### 2.5 Appointments

**Table:** `appointments`

Purpose: Stores property appointment requests.

Known fields include:

- `id` — Primary key
- `user_id` — Customer reference
- `property_id` — Property reference
- `appointment_date` — Appointment date
- `message` — Optional message
- `status` — Appointment workflow status
- `reviewed_by` — Reviewing user's reference
- `reviewed_at` — Optional review timestamp
- `admin_note` — Optional administrative note

### 2.6 Installments

**Table:** `installments`

Purpose: Tracks payment obligations associated with bookings.

Known fields include:

- `id` — Primary key
- `booking_id` — Related booking
- `amount_due` — Total amount due for the installment
- `amount_paid` — Amount paid so far
- `due_date` — Optional due date
- `status` — Payment status
- `created_by` — User who created the installment

Known status values include `pending`, `partially_paid`, `paid`, and `overdue`.

### 2.7 Payments

**Table:** `payments`

Purpose: Stores customer payment submissions and their review information.

Known fields include:

- `id` — Primary key
- `booking_id` — Related booking
- `installment_id` — Optional installment reference
- `user_id` — Customer reference
- `amount` — Payment amount
- `payment_method` — Payment method
- `transaction_reference` — Optional unique transaction reference
- `receipt_path` — Optional receipt path
- `status` — Payment review status
- `reviewed_by` — Optional reviewing user
- `reviewed_at` — Optional review timestamp
- `customer_note` — Optional customer note
- `admin_note` — Optional administrative note
- `bank_name` — Optional bank name
- `bank_slip_number` — Optional bank slip number

Known payment statuses are `pending`, `approved`, and `rejected`.

## 3. Entity Relationships

The main relationships are:

- One user can create multiple properties.
- One property can have multiple images.
- One user can submit multiple bookings.
- One property can receive multiple booking requests over time.
- One user can submit multiple appointments.
- One property can receive multiple appointment requests.
- One booking can have multiple installment records, subject to the application rules.
- One installment can have multiple payments.
- One booking can have multiple payments.
- A user may be associated with payment records as the customer or reviewer.

## 4. Referential Integrity

The migrations define foreign-key relationships between the main entities.

The payments and installments migrations use restrictive delete behavior for important financial references. This helps prevent deletion of records that are still referenced by financial transactions.

Payment reviewer references are nullable and can be set to null when the referenced reviewer is deleted.

## 5. Financial Data Integrity

The database stores monetary amounts using decimal columns rather than floating-point columns.

Payment approval logic must validate the remaining balance before approving a payment. Other pending payments must be considered so that multiple pending submissions cannot collectively exceed the installment balance.

Approved payment records and installment totals should remain consistent.

## 6. Supporting Laravel Tables

The database also includes supporting tables such as:

- `password_reset_tokens`
- `sessions`
- `personal_access_tokens`
- `cache`
- `cache_locks`
- `jobs`
- `job_batches`
- `failed_jobs`

These tables support authentication, session management, caching, and background job processing.

## 7. Migration Management

Laravel migrations are the version-controlled mechanism for defining database structure.

Before changing migrations or applying schema changes to an existing database:

1. Create a verified database backup.
2. Inspect the current migration status.
3. Confirm the expected schema changes.
4. Test changes in a separate development or test database.
5. Never use destructive reset commands against the database containing existing project records.

## 8. Verification Notes

This document summarizes fields and relationships identified in the repository's migration files. It is not a substitute for inspecting the complete final schema.

Before production deployment, verify all column definitions, indexes, nullable constraints, foreign-key actions, and actual database migration status.
