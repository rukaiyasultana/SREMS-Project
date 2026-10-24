# SREMS — Security Design and Guidelines

## 1. Introduction

Security is an important requirement of the Smart Real Estate Management System (SREMS). The system handles user accounts, property information, customer requests, bookings, appointments, installment plans, payments, and management reports.

This document describes the security mechanisms used by the application and the practices required to protect its data.

## 2. Authentication

SREMS uses Laravel Sanctum for API authentication.

Security requirements:

- Protected endpoints must require valid authentication.
- Login credentials must be validated by the backend.
- Passwords must be stored using secure password hashing.
- Logout must invalidate the applicable authenticated session or token.
- Authentication errors must not expose passwords, tokens, or other sensitive information.
- Frontend route protection must not replace backend authentication.

## 3. Authorization and Role Management

Different users may have different responsibilities within SREMS.

Authorization must be enforced on the backend for operations such as:

- Creating user accounts.
- Creating, updating, or deleting properties.
- Reviewing bookings and appointments.
- Approving or rejecting payments.
- Accessing management reports.
- Downloading payment receipts.

The backend must verify the authenticated user's actual permissions before executing a protected operation. Hiding a button in the frontend is not sufficient authorization.

The exact roles and permissions must remain consistent with the current middleware and controller implementation.

## 4. Input Validation

All user-submitted data must be validated on the server.

Validation should cover:

- Required fields and data types.
- Email and contact information formats.
- Valid property statuses.
- Relationships between bookings, properties, customers, installments, and payments.
- Payment amounts and outstanding balances.
- Uploaded file types, sizes, and storage locations.

Invalid requests should return appropriate error responses without changing unrelated records.

## 5. Payment and Installment Security

Payment operations require particular care because incorrect approval may create financial inconsistencies.

The backend should:

- Accept payment submissions only through authorized endpoints.
- Keep submitted payments pending until an authorized review.
- Verify that a payment belongs to the correct booking and installment.
- Prevent approval of amounts that exceed the remaining payable balance.
- Account for other pending payments when calculating available balances.
- Prevent unauthorized or repeated review operations.
- Update payment and installment records consistently.
- Use database transactions and appropriate locking where needed.

Payment receipts must only be accessible to users authorized to view the relevant payment.

## 6. Rate Limiting

Rate limiting helps reduce automated abuse of sensitive endpoints.

The current API route configuration includes rate limits for login and selected operations, including booking creation, appointment creation, payment submission, reviews, and property management.

Rate limits should be reviewed during deployment to ensure they are appropriate for the application's expected usage.

## 7. Database Security

Database security requirements include:

- Use a dedicated database account with only the permissions required by the application.
- Do not expose database credentials to the frontend.
- Keep database credentials in environment configuration.
- Validate application inputs before database operations.
- Use Laravel's database mechanisms rather than building unsafe SQL queries from untrusted input.
- Back up the database regularly.
- Test database restoration procedures.
- Apply migrations carefully and review their effects before deployment.

Never use destructive database commands against the working database without a verified backup and explicit authorization.

## 8. Environment Variables and Secrets

Sensitive configuration must not be committed to the repository.

Examples include:

- Database usernames and passwords.
- Application secrets.
- API tokens.
- Third-party service credentials.
- Production service configuration.

The `.env` file should remain private. The repository may contain an `.env.example` file with placeholder values, but it must not contain real credentials.

If a secret is accidentally exposed, revoke or rotate it and review the repository history and affected services.

## 9. File Upload Security

Property image uploads and payment receipt downloads require secure handling.

Recommended controls include:

- Validate file type and size on the backend.
- Generate safe filenames where appropriate.
- Avoid trusting filenames or file extensions supplied by users.
- Prevent uploaded files from being executed as server-side code.
- Restrict deletion to authorized users.
- Verify authorization before returning private files.
- Avoid exposing internal server paths in API responses.

## 10. Error Handling and Logging

The application should return useful but non-sensitive error messages.

Production configuration should:

- Disable detailed debug output for public users.
- Avoid exposing stack traces, SQL details, filesystem paths, or credentials.
- Record relevant authentication failures and sensitive administrative actions.
- Protect logs from unauthorized access.
- Avoid logging passwords, access tokens, or complete payment credentials.

## 11. Frontend Security

Frontend security practices include:

- Use HTTPS in production.
- Avoid embedding secrets in frontend environment variables or built assets.
- Handle authentication credentials securely.
- Validate data on the backend even when the frontend already performs validation.
- Avoid rendering untrusted content as executable HTML.
- Keep dependencies updated and review security advisories.
- Ensure protected actions fail safely when authentication expires.

## 12. Testing Security Controls

Security testing should cover:

- Unauthenticated requests to protected endpoints.
- Attempts by unauthorized roles to perform restricted actions.
- Invalid login credentials and login rate limits.
- Invalid property, booking, and appointment data.
- Payment over-approval and duplicate review attempts.
- Incorrect booking or installment associations.
- Unauthorized receipt downloads.
- File upload validation.
- Access to management reports.
- Protection of existing records during failed operations.

A passing test suite does not guarantee complete security. Manual review and testing in a controlled environment are also required.

## 13. Backup and Recovery

Before significant code, schema, or deployment changes:

1. Create a backup of the relevant files and database.
2. Verify that the backup exists and is usable.
3. Apply changes in a controlled environment when possible.
4. Run automated tests and perform smoke tests.
5. Confirm that existing records remain intact.
6. Keep recovery instructions available.

## 14. Production Readiness Checklist

- [ ] Production debug mode is disabled.
- [ ] HTTPS is configured.
- [ ] Secrets are kept out of Git.
- [ ] Database access is restricted.
- [ ] User roles and permissions have been verified.
- [ ] Payment and receipt authorization has been tested.
- [ ] Rate limiting has been reviewed.
- [ ] Upload validation has been tested.
- [ ] Database backup and restoration have been verified.
- [ ] Automated tests and frontend checks pass.
- [ ] Logs do not expose sensitive information.

## 15. Conclusion

SREMS security depends on authentication, backend authorization, server-side validation, safe financial workflows, database protection, secure file handling, and ongoing testing. These controls must be verified against the actual implementation before production deployment.
