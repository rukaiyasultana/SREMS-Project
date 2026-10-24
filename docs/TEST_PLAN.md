# SREMS — Software Test Plan

## 1. Introduction

This document defines the testing strategy for the Smart Real Estate Management System (SREMS).

The purpose of testing is to verify that the application behaves correctly, protects existing records, enforces authorization rules, and supports the main real estate management workflows.

## 2. Testing Objectives

The main objectives are to:

- Verify user authentication and authorization.
- Validate property creation and management.
- Test booking and appointment workflows.
- Verify installment and payment processing.
- Ensure that payment review follows financial business rules.
- Check that receipt downloads and reports are appropriately protected.
- Identify frontend errors and build problems.
- Preserve existing database records during development and testing.

## 3. Testing Environment

### Backend

- Framework: Laravel 13
- Language: PHP 8.4
- Testing framework: PHPUnit through Laravel's test runner
- Database: An isolated test database configuration

### Frontend

- Framework: React 19
- Build tool: Vite 8
- Styling: Tailwind CSS 4
- Code quality: ESLint

### Development Tools

- Visual Studio Code
- PowerShell
- Composer
- Node.js and npm
- MySQL/MariaDB for development

Automated tests must use the test database configured in `backend/phpunit.xml`. Confirm the test environment before running tests.

## 4. Testing Types

### 4.1 Unit Testing

Tests individual methods or components in isolation where appropriate.

Examples:

- Validation logic.
- Calculations for payment balances.
- Utility functions.

### 4.2 Feature Testing

Tests complete backend request workflows, including routing, authentication, validation, authorization, and database behavior.

Examples:

- Login and logout.
- Property management.
- Booking review.
- Appointment management.
- Payment submission and approval.

### 4.3 Frontend Testing

Frontend checks include linting and production builds. Manual browser testing is also required to verify navigation, form behavior, displayed information, and API error handling.

### 4.4 Security Testing

Security testing verifies that users cannot access protected operations without the required authentication and permissions.

### 4.5 Regression Testing

Regression testing checks that new changes do not break previously working functionality.

Existing login, property management, database records, booking workflows, and payment operations should be rechecked after relevant changes.

## 5. Backend Test Execution

Open PowerShell and navigate to the backend directory:

```powershell
Set-Location "D:\BAUST\Rukaiya Project\Web Sessional\SREMS\backend"
```

Run the test suite using the PHP 8.4 executable:

```powershell
& "C:\Users\HK Technology\AppData\Local\Programs\PHP84\php.exe" artisan test
```

To inspect registered API routes:

```powershell
& "C:\Users\HK Technology\AppData\Local\Programs\PHP84\php.exe" artisan route:list --path=api
```

Review the command output and resolve unexpected failures before considering the test run successful.

## 6. Frontend Verification

Open another PowerShell terminal and navigate to the frontend directory:

```powershell
Set-Location "D:\BAUST\Rukaiya Project\Web Sessional\SREMS\frontend"
```

Run linting:

```powershell
npm run lint
```

Build the production frontend:

```powershell
npm run build
```

Both commands should complete successfully before a release.

## 7. Functional Test Scenarios

### 7.1 Authentication

- Verify successful login with valid credentials.
- Verify rejection of invalid credentials.
- Verify that protected endpoints reject unauthenticated requests.
- Verify logout behavior.
- Verify login rate limiting.

### 7.2 User Management

- Verify authorized account creation.
- Verify rejection of invalid account data.
- Verify that unauthorized users cannot create accounts.

### 7.3 Property Management

- Verify property listing and detail retrieval.
- Verify property creation with valid data.
- Verify validation errors for invalid data.
- Verify authorized updates and deletion.
- Verify property image upload and deletion.
- Verify applicable property-status rules.

### 7.4 Booking Management

- Verify booking request submission.
- Verify booking retrieval.
- Verify authorized review and cancellation.
- Verify that invalid operations do not alter unrelated records.
- Verify property-status changes associated with booking workflows.

### 7.5 Appointment Management

- Verify appointment request submission.
- Verify appointment retrieval.
- Verify authorized review and cancellation.
- Verify rejection of invalid requests.

### 7.6 Installment Management

- Verify installment-plan creation for a valid booking.
- Verify that an installment plan cannot be incorrectly associated with another booking.
- Verify payment and outstanding-balance calculations.

### 7.7 Payment Management

- Verify payment submission.
- Verify that submitted payments remain pending until review.
- Verify that only authorized users can review payments.
- Verify rejection of invalid or excessive payment amounts.
- Verify that pending payments are considered when checking available balances.
- Verify approval and rejection behavior.
- Verify installment status updates after approved payments.
- Verify receipt download authorization.

### 7.8 Reports

- Verify successful retrieval by an authorized user.
- Verify rejection of unauthorized access.
- Verify that report information reflects the applicable database records.

## 8. Data Integrity Tests

The application must preserve data integrity throughout testing.

Check that:

- Failed validation does not create unintended records.
- Rejected payments do not incorrectly reduce installment balances.
- Approved payments update related records consistently.
- Booking, property, installment, and payment relationships remain valid.
- Failed operations do not partially update related financial records.
- Existing development records remain intact.

Do not run `migrate:fresh`, database resets, or destructive cleanup commands against the working database.

## 9. Latest Known Test Status

The last recorded backend test result during development was:

- **Tests passed:** 42
- **Assertions:** 108

This is a historical result, not a guarantee of the current status. Rerun the backend test suite after subsequent changes and update this section with the latest actual result.

Frontend linting and production builds must also be rerun after relevant frontend changes.

## 10. Defect Reporting

When a defect is found, record:

- Defect title.
- Steps to reproduce.
- Expected result.
- Actual result.
- Error message or relevant log.
- Severity and impact.
- Fix applied.
- Regression test result.

Keep backups before making significant changes to working code.

## 11. Exit Criteria

Testing can be considered ready for release review when:

- Required backend tests pass.
- Frontend linting passes.
- The production frontend build succeeds.
- Critical workflows have been manually verified.
- Security and authorization checks have been reviewed.
- Existing records remain intact.
- No unresolved critical defects remain.
- Deployment and recovery procedures are documented.

## 12. Conclusion

This test plan provides a structured approach to verifying SREMS functionality, security, financial consistency, and maintainability. Testing must be repeated after significant changes and before production deployment.
