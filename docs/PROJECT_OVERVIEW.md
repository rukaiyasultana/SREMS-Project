# Smart Real Estate Management System (SREMS)

## 1. Project Overview

Smart Real Estate Management System (SREMS) is a web-based application designed to centralize important real estate operations. It provides a common platform for managing property information, customer booking requests, appointments, installment plans, payment records, and management reports.

The system aims to reduce fragmented record-keeping, improve payment tracking, and support more organized communication between customers and authorized staff.

## 2. Current Technology Stack

- **Frontend:** React, JavaScript, Vite, Tailwind CSS
- **Backend:** PHP and Laravel REST API
- **Authentication:** Laravel Sanctum
- **Database:** MySQL/MariaDB
- **HTTP Client:** Axios
- **Routing:** React Router
- **Version Control:** Git and GitHub

A Python-based AI service directory is present in the repository. Its current implementation and integration status must be verified before AI functionality is considered operational.

## 3. Implemented Application Areas

The current backend API contains routes for the following areas:

- User login and logout
- Authenticated user information
- Authorized account creation
- Property listing, details, creation, updating, and deletion
- Property image management
- Booking requests, review, and cancellation
- Appointment requests, review, and cancellation
- Installment management
- Payment submission and review
- Payment receipt downloads
- Management report summaries

Actual access permissions and business rules are enforced by the backend controllers and middleware.

## 4. Payment and Booking Workflow

Booking requests support review and cancellation operations. Payment records support pending, approved, and rejected states.

Installments track the amount due, amount paid, due date, and payment status. Payment review logic includes validation to prevent approved payments from exceeding the remaining installment balance, accounting for other pending payments.

The precise user-facing workflow and all role-specific permissions should be confirmed through application testing.

## 5. Database Overview

The repository contains migrations for the following primary entities:

- Users
- Properties
- Property images
- Bookings
- Appointments
- Installments
- Payments

Laravel also uses supporting tables for authentication tokens, sessions, cache, jobs, and password reset operations.

## 6. Security

The API uses Sanctum authentication for protected routes. Login and several booking, appointment, payment, and property-management operations use rate limiting.

Payment and booking review actions require further role-based and end-to-end verification as part of the final security review.

Real credentials, private keys, and production environment files must never be committed to the public repository.

## 7. Development Status

The project has an operational Laravel/React application with backend routes and automated feature tests.

The documented test result from the current development session is 42 passing tests and 108 assertions. This result should be refreshed after any subsequent code changes.

AI recommendations, lead scoring, payment-risk prediction, advanced analytics, messaging, and other proposed features must be treated as planned or unverified until their implementations and integrations are confirmed.

## 8. Future Improvements

- Complete role-based access and end-to-end testing
- Expand booking and payment edge-case coverage
- Verify property status rules against business requirements
- Complete API, architecture, database, security, and test documentation
- Review frontend accessibility and responsive behavior
- Verify AI service integration
- Perform final production-build and security checks
