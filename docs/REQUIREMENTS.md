# SREMS — Software Requirements Specification

## 1. Introduction

### 1.1 Purpose

The purpose of the Smart Real Estate Management System (SREMS) is to provide a centralized web application for managing property information, booking requests, appointments, installments, payments, and management reports.

### 1.2 Scope

SREMS is designed to reduce dependence on scattered spreadsheets and manual records. It provides an authenticated interface for accessing property information and performing supported real estate management operations.

### 1.3 Intended Users

The intended users include:

- Administrators and authorized authorities
- Customers who browse properties and submit requests
- Staff members who may be assigned management responsibilities, subject to the implemented access rules

Exact role names and permissions must be confirmed against the current controllers and application interface.

## 2. Functional Requirements

### FR-01: Authentication

The system shall provide a login endpoint, protected API routes, logout functionality, and access to the authenticated user's information.

### FR-02: User Management

Authorized users shall be able to create accounts through the protected user-management endpoint.

### FR-03: Property Management

The system shall support property listing, property details, property creation, property updates, and property deletion.

Property records include information such as property code, name, project name, type, location, size, price, status, description, and creator.

### FR-04: Property Images

The system shall support uploading and deleting property images. Image records may include the image path, image name, and primary-image indicator.

### FR-05: Booking Management

The system shall support booking request creation, listing, details, review, and cancellation.

Booking review outcomes and authorization rules shall be validated through automated tests and manual testing.

### FR-06: Appointment Management

The system shall support appointment request creation, listing, details, review, and cancellation.

Appointment records include a customer, property, appointment date, status, and optional message or review information.

### FR-07: Installment Management

The system shall track installment plans associated with bookings, including the amount due, amount paid, due date, and payment status.

### FR-08: Payment Management

The system shall support payment submission, payment listing, payment review, and receipt downloads.

Payment records may include the booking, installment, customer, amount, payment method, transaction reference, receipt path, review information, and bank-transfer details.

### FR-09: Payment Verification

Payments shall support pending, approved, and rejected states.

The backend shall validate payment amounts against the remaining installment balance and account for other pending payments when determining whether an approval is valid.

### FR-10: Reports

The system shall provide a report-summary API endpoint. Access restrictions and report contents shall be verified against the implementation.

## 3. Non-Functional Requirements

### NFR-01: Security

Protected endpoints shall require authentication. Authorization rules shall prevent unauthorized users from performing restricted actions.

### NFR-02: Data Integrity

Relationships between users, properties, bookings, appointments, installments, and payments shall preserve valid references.

Financial calculations shall account for currency precision and installment balances.

### NFR-03: Reliability

The application shall handle invalid requests and business-rule violations without corrupting existing records.

### NFR-04: Performance

Rate limiting shall be applied to selected API operations. Pagination and query optimization should be used where appropriate.

### NFR-05: Maintainability

The application shall maintain a separation between frontend components, backend controllers, models, database migrations, and automated tests.

### NFR-06: Usability

The interface should provide clear navigation, understandable validation messages, and readable financial information.

### NFR-07: Compatibility

The web application should be tested in supported modern browsers and at common desktop and mobile viewport sizes.

## 4. Technology Requirements

- PHP 8.3 or later, as specified by the backend Composer configuration
- Laravel 13
- Laravel Sanctum
- React 19
- Vite
- Tailwind CSS
- Axios
- MySQL or MariaDB
- Node.js and npm
- Git

## 5. Proposed Features Requiring Verification

The original project proposal includes AI-based property recommendations, lead scoring, payment-risk prediction, and property-demand analytics.

These features must not be considered completed until their implementation, integration, and test coverage are verified.

## 6. Acceptance Criteria

The project will be considered ready for final review when:

1. Authentication and authorization tests pass.
2. Property creation, updating, listing, and deletion behave correctly.
3. Booking and appointment workflows enforce their business rules.
4. Payment review preserves installment balance integrity.
5. Unauthorized operations are rejected.
6. Frontend linting and production builds succeed.
7. The automated test suite passes.
8. Documentation accurately describes implemented and planned features.
