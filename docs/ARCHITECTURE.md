# SREMS — System Architecture

## 1. Introduction

The Smart Real Estate Management System (SREMS) is a web-based application designed to centralize real estate operations. It organizes property information, customer requests, bookings, appointments, installments, payments, and management reporting.

The application uses a frontend-backend architecture. The frontend provides the user interface, while the Laravel backend handles business logic, authentication, authorization, validation, and database operations.

## 2. Technology Stack

### Frontend

- React 19
- Vite 8
- Tailwind CSS 4
- Axios
- React Router 7

### Backend

- PHP 8.4
- Laravel 13
- Laravel Sanctum for API authentication

### Database

- MySQL/MariaDB

### Additional Component

- A Python-based `ai-service` directory is present in the project. Its integration and implemented AI functionality must be verified separately before being considered part of the active application.

## 3. High-Level Architecture

The application follows this general request flow:

1. A user interacts with the React frontend.
2. The frontend sends an HTTP request to the Laravel API.
3. Laravel authenticates the request and applies the relevant authorization and validation rules.
4. Controllers execute business operations using the application's models.
5. Models interact with the relational database through Laravel's database layer.
6. Laravel returns a response to the frontend.
7. The frontend displays the resulting information or an appropriate error message.

## 4. Frontend Layer

The frontend is located in the `frontend` directory.

Its responsibilities include:

- Rendering application pages and reusable interface components.
- Providing navigation between application sections.
- Collecting and submitting user input.
- Calling backend endpoints through HTTP requests.
- Displaying property, booking, appointment, installment, and payment information.
- Presenting validation errors and operation results.

The frontend is not the final authority for security. Sensitive operations must be validated and authorized by the backend.

## 5. Backend Layer

The backend is located in the `backend` directory and is implemented with Laravel.

Important backend components include:

- `routes/api.php` — Defines API endpoints.
- `app/Http/Controllers/` — Contains request-handling and business-operation logic.
- `app/Models/` — Defines application entities and their relationships.
- `database/migrations/` — Defines database schema changes.
- `tests/Feature/` — Contains feature and API behavior tests.

Laravel middleware and controller checks are used to protect routes and enforce applicable access rules.

## 6. Database Layer

The application uses a relational database to store operational records.

The main business entities include:

- Users
- Properties
- Property images
- Bookings
- Appointments
- Installments
- Payments

These entities use relationships to connect customers, properties, bookings, installment plans, payments, and review records.

Database migrations provide a version-controlled method for creating and updating the schema. Existing records must be preserved during routine development and deployment.

## 7. Main Business Workflows

### 7.1 Authentication

A user submits login credentials. The backend validates the credentials and establishes authenticated API access. Protected endpoints require valid authentication.

### 7.2 Property Management

Authorized users manage property records and related images. The backend validates submitted data and applies property-status rules.

### 7.3 Booking Management

A customer submits a booking request. The backend records the request and allows authorized review according to the implemented workflow.

### 7.4 Appointment Management

A customer submits an appointment request. The backend stores the request and supports review and cancellation operations.

### 7.5 Installment and Payment Management

Installment plans are associated with bookings. Payment submissions are reviewed by authorized users. The backend checks payment amounts and remaining installment balances before approval.

### 7.6 Reporting

The reporting endpoint provides a summary of management information, subject to the access restrictions enforced by the backend.

## 8. Security Architecture

Security responsibilities are shared across several backend mechanisms:

- Authentication through Laravel Sanctum.
- Route protection through authentication middleware.
- Controller-level validation and authorization.
- Rate limiting on selected sensitive endpoints.
- Business-rule checks for payment review and installment balances.
- Automated tests for important security and validation scenarios.

Production deployment should also use HTTPS, secure environment configuration, database backups, and restricted server permissions.

## 9. Testing Architecture

The project uses Laravel's automated testing facilities, including feature tests.

Frontend quality checks include linting and production builds.

Tests should cover authentication, access control, property validation, booking workflows, appointment workflows, payment review, installment balances, and receipt access.

Automated tests should use an isolated test database configuration. Destructive database commands must not be used against the working development database.

## 10. AI Integration Status

The project contains an `ai-service` directory intended for possible Python-based intelligent features.

Potential future features include:

- AI-based property recommendations.
- Lead scoring.
- Payment risk prediction.
- Property demand analytics.

The presence of a directory alone does not establish that these features are implemented or connected to the Laravel application. Their code, dependencies, API integration, and tests must be verified before describing them as active features.

## 11. Deployment Overview

A typical deployment requires:

1. A configured PHP environment compatible with the Laravel application.
2. Composer dependencies installed.
3. A configured MySQL/MariaDB database.
4. Correct backend environment variables.
5. Frontend dependencies installed and production assets built.
6. The Laravel API and frontend hosted with appropriate routing.
7. HTTPS, backups, logging, and production security settings.

The precise deployment procedure depends on the selected hosting environment.

## 12. Conclusion

SREMS separates user-interface responsibilities from backend business logic and database persistence. This architecture supports maintainability, testing, access control, and future expansion while keeping the existing business records protected.
