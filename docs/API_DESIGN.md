# SREMS — API Design

## 1. Overview

SREMS exposes a REST-style API implemented with Laravel. The API handles authentication, property management, bookings, appointments, installments, payments, receipt downloads, and management report summaries.

The routes documented here are based on the current `backend/routes/api.php` file. Controller validation and authorization determine the final behavior of each endpoint.

## 2. Base URL

During local development, the API is served through the Laravel backend.

The base URL depends on the local development configuration. In Laravel's standard API routing, routes defined in `routes/api.php` are commonly prefixed with `/api`.

Example:

`http://127.0.0.1:8000/api`

Use the actual backend host and port configured for your environment.

## 3. Authentication

### Login

- **Method:** `POST`
- **Endpoint:** `/login`
- **Authentication:** Not required
- **Rate limit:** 5 requests per minute

Purpose: Authenticate a user.

### Logout

- **Method:** `POST`
- **Endpoint:** `/logout`
- **Authentication:** Required

Purpose: Log out the authenticated user.

### Current User

- **Method:** `GET`
- **Endpoint:** `/user`
- **Authentication:** Required

Purpose: Return information about the authenticated user.

### Create User

- **Method:** `POST`
- **Endpoint:** `/admin/users`
- **Authentication:** Required

Purpose: Create an account through the authorized user-management endpoint. The controller enforces the applicable authorization rules.

## 4. Property Endpoints

All endpoints in this section require authentication.

| Method | Endpoint                                | Purpose                                                      |
| ------ | --------------------------------------- | ------------------------------------------------------------ |
| GET    | `/properties`                           | List properties                                              |
| GET    | `/properties/{property}`                | View property details                                        |
| POST   | `/properties`                           | Create a property                                            |
| PUT    | `/properties/{property}`                | Replace/update property fields according to validation rules |
| PATCH  | `/properties/{property}`                | Partially update a property                                  |
| DELETE | `/properties/{property}`                | Delete a property                                            |
| POST   | `/properties/{property}/images`         | Upload property images                                       |
| DELETE | `/properties/{property}/images/{image}` | Delete a property image                                      |

Property creation, updates, deletion, and image management are subject to rate limiting and controller validation.

## 5. Booking Endpoints

All endpoints in this section require authentication.

| Method | Endpoint                     | Purpose                  |
| ------ | ---------------------------- | ------------------------ |
| GET    | `/bookings`                  | List bookings            |
| POST   | `/bookings`                  | Submit a booking request |
| GET    | `/bookings/{booking}`        | View booking details     |
| PATCH  | `/bookings/{booking}/review` | Review a booking         |
| PATCH  | `/bookings/{booking}/cancel` | Cancel a booking         |

Booking creation is limited to 10 requests per minute. Booking review is limited to 30 requests per minute.

## 6. Appointment Endpoints

All endpoints in this section require authentication.

| Method | Endpoint                             | Purpose                       |
| ------ | ------------------------------------ | ----------------------------- |
| GET    | `/appointments`                      | List appointments             |
| POST   | `/appointments`                      | Submit an appointment request |
| GET    | `/appointments/{appointment}`        | View appointment details      |
| PATCH  | `/appointments/{appointment}/review` | Review an appointment         |
| PATCH  | `/appointments/{appointment}/cancel` | Cancel an appointment         |

Appointment creation is limited to 10 requests per minute. Appointment review is limited to 30 requests per minute.

## 7. Installment and Payment Endpoints

All endpoints in this section require authentication.

| Method | Endpoint                           | Purpose                                  |
| ------ | ---------------------------------- | ---------------------------------------- |
| GET    | `/installments`                    | List installment information             |
| GET    | `/payments`                        | List payment records                     |
| POST   | `/payments`                        | Submit a payment                         |
| GET    | `/payments/{payment}/receipt`      | Download a payment receipt               |
| PATCH  | `/payments/{payment}/review`       | Review a submitted payment               |
| POST   | `/bookings/{booking}/installments` | Create an installment plan for a booking |

Payment submission is limited to 10 requests per minute. Payment review and installment-plan creation are also rate-limited.

Payment review supports `pending`, `approved`, and `rejected` states. The backend validates payment amounts and installment balances before approval.

## 8. Reporting Endpoint

### Report Summary

- **Method:** `GET`
- **Endpoint:** `/reports/summary`
- **Authentication:** Required

Purpose: Retrieve a management report summary.

The report controller is responsible for enforcing the applicable administrative access restrictions.

## 9. Request and Response Conventions

- Use HTTP methods according to the endpoint's intended operation.
- Send request data in the format accepted by the controller, generally JSON for standard API requests.
- Include the applicable authentication credentials when calling protected endpoints.
- Use HTTP status codes and response messages to identify successful operations and validation failures.
- Upload files using the multipart format supported by the relevant controller.
- Do not assume exact request fields or response schemas without checking the corresponding controller.

## 10. Common HTTP Status Codes

Depending on the endpoint and controller behavior, clients may receive:

- `200 OK` — Request completed successfully.
- `201 Created` — A resource was created.
- `401 Unauthorized` — Authentication is missing or invalid.
- `403 Forbidden` — The authenticated user lacks permission.
- `404 Not Found` — The requested resource does not exist or is not accessible.
- `422 Unprocessable Entity` — Validation or business-rule failure.
- `429 Too Many Requests` — Rate limit exceeded.
- `500 Internal Server Error` — Unexpected server-side failure.

The exact status code depends on the implemented endpoint behavior.

## 11. Security Considerations

- Protected routes must require valid authentication.
- Authorization must be enforced by backend controllers or middleware, not only by frontend navigation.
- Payment review must validate installment ownership and remaining balances.
- Receipt downloads must verify that the requester is permitted to access the relevant file.
- Rate limits should remain enabled for sensitive endpoints.
- Production credentials and tokens must not be committed to Git.

## 12. API Verification

Before release, verify every endpoint with valid, invalid, unauthorized, and boundary-case requests. Confirm the response schema, HTTP status codes, role restrictions, and rate-limiting behavior against the actual implementation.
