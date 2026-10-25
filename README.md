# SREMS-Project
Smart Real Estate Management Systerm 

## Property Management Module (Person 1 - Ayesha Jahan)

### Features & Endpoints
- **GET /api/properties**: Paginated property list with search keyword & status/type filters.
- **GET /api/properties/{id}**: Detailed view of single property with creator and image relationships.
- **POST /api/properties**: Admin/Authority creation of new property with unique code validation.
- **PUT /api/properties/{id}**: Update property details with business rule guard on approved bookings.
- **DELETE /api/properties/{id}**: Foreign-key protected deletion (blocks if linked booking exists).
- **POST /api/properties/{id}/images**: Multi-image upload (up to 10 images, max 5MB, rollback support).
- **DELETE /api/properties/{id}/images/{imageId}**: Specific property image deletion from storage & DB.
