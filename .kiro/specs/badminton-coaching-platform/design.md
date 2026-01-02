# Design Document

## Overview

ShuttleMentor is a full-stack web application built on the T3 Stack (Next.js, tRPC, Prisma, Tailwind CSS) with Clerk authentication. The platform follows a modern React Server Components architecture with type-safe API communication and role-based access control. The system is designed to handle multiple user types (Student, Coach, Admin, Facility) with distinct capabilities and data access patterns.

The architecture emphasizes:
- Type safety across the entire stack (TypeScript, tRPC, Prisma)
- Server-side rendering for optimal performance and SEO
- Role-based access control at both API and UI levels
- Soft deletion for data recovery and audit trails
- Binary image storage in PostgreSQL for simplicity
- Base64 encoding for image transmission to frontend

## Architecture

### Technology Stack

**Frontend:**
- Next.js 15 with App Router (React Server Components)
- React 19 for UI components
- Tailwind CSS 4 for styling
- shadcn/ui components for consistent UI patterns
- Clerk for authentication UI
- TanStack Query (React Query) for client-side state management

**Backend:**
- tRPC 11 for type-safe API layer
- Prisma 6 as ORM for PostgreSQL
- Clerk for authentication and user management
- Zod for runtime validation
- SuperJSON for data serialization

**Database:**
- PostgreSQL for relational data storage
- Binary storage for profile images (Bytes type)
- Soft deletion pattern for Video Collections and Media

**Infrastructure:**
- Docker for containerization
- Docker Compose for local development
- OrbStack (macOS) or Docker Desktop for container runtime

### Application Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── coaches/                  # Coach discovery and profiles
│   ├── profile/                  # User profile management
│   ├── video-collections/        # Video collection management
│   └── _components/              # Shared React components
├── server/
│   ├── api/
│   │   ├── routers/              # tRPC routers (user, coaches, videoCollection, coachingNotes)
│   │   ├── trpc.ts               # tRPC configuration and procedures
│   │   └── root.ts               # Root router
│   ├── db.ts                     # Prisma client instance
│   └── utils/                    # Server-side utilities
├── trpc/                         # tRPC client configuration
└── middleware.ts                 # Clerk authentication middleware
```

## Components and Interfaces

### Authentication Layer

**Clerk Integration:**
- Handles user registration, login, and session management
- Provides `clerkUserId` as the external user identifier
- Middleware protects routes requiring authentication
- `SignedIn` and `SignedOut` components for conditional rendering

**Local User Management:**
- System maintains local User records linked to Clerk via `clerkUserId`
- First authentication triggers user profile creation
- Default profiles created based on user type

### tRPC Procedures

**Procedure Types:**
1. `publicProcedure` - No authentication required (coach listings, coach profiles)
2. `protectedProcedure` - Requires authentication (profile management, video collections)
3. `adminProcedure` - Requires Admin role (user management, system settings)
4. `facilityProcedure` - Requires Facility role (facility-specific operations)

**Router Organization:**
- `userRouter` - User profile CRUD, role switching, profile image management
- `coachesRouter` - Coach discovery, filtering, sorting, profile retrieval
- `videoCollectionRouter` - Video collection and media CRUD with access control
- `coachingNotesRouter` - Coaching note CRUD operations, coach-media interaction tracking

### Data Access Patterns

**Role-Based Filtering:**
- Students see only their own video collections
- Coaches see all video collections (for review purposes)
- Admins see all data across the platform
- Facilities have restricted access (future implementation)

**Soft Deletion:**
- Video Collections and Media use `isDeleted` flag and `deletedAt` timestamp
- Queries filter out soft-deleted records by default
- Admin procedures can restore soft-deleted records

## Data Models

### User Model
```typescript
{
  userId: string (cuid, primary key)
  clerkUserId: string (unique, indexed)
  email: string?
  firstName: string?
  lastName: string?
  profileImage: string? (URL)
  userType: UserType (STUDENT | COACH | ADMIN | FACILITY)
  timeZone: string?
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  studentProfile: StudentProfile?
  coachProfile: CoachProfile?
  videoCollections: VideoCollection[]
}
```

### StudentProfile Model
```typescript
{
  studentProfileId: string (cuid, primary key)
  userId: string (unique, foreign key)
  displayUsername: string? (unique, lowercase)
  skillLevel: string? (Beginner | Intermediate | Advanced | Professional)
  goals: string? (text)
  bio: string? (text)
  profileImage: Bytes? (binary data)
  profileImageType: string? (MIME type)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### CoachProfile Model
```typescript
{
  coachProfileId: string (cuid, primary key)
  userId: string (unique, foreign key)
  displayUsername: string? (unique, lowercase)
  bio: string? (max 300 chars)
  experience: string? (max 1000 chars)
  specialties: string[] (array)
  teachingStyles: string[] (array)
  headerImage: string? (URL)
  profileImage: Bytes? (binary data)
  profileImageType: string? (MIME type)
  rate: number (integer, default 0)
  isVerified: boolean (default false)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### VideoCollection Model
```typescript
{
  collectionId: string (cuid, primary key)
  userId: string (foreign key, indexed)
  title: string
  description: string? (text)
  mediaType: MediaType (URL_VIDEO | FILE_VIDEO)
  isDeleted: boolean (default false, indexed)
  deletedAt: DateTime?
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  media: Media[]
}
```

### Media Model
```typescript
{
  mediaId: string (cuid, primary key)
  collectionId: string (foreign key, indexed)
  title: string
  description: string? (text)
  videoUrl: string? (for URL_VIDEO)
  fileKey: string? (for FILE_VIDEO)
  fileName: string?
  fileSize: number? (bytes)
  duration: number? (seconds)
  thumbnailUrl: string?
  isDeleted: boolean (default false, indexed)
  deletedAt: DateTime?
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  coachingNotes: MediaCoachNote[]
}
```

### MediaCoachNote Model
```typescript
{
  noteId: string (cuid, primary key)
  mediaId: string (foreign key, indexed)
  coachId: string (foreign key, indexed)
  noteContent: string (max 2000 chars)
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  media: Media
  coach: User
}
```

### Validation Constraints

**Display Username:**
- Length: 3-30 characters
- Pattern: Must start with letter, then letters/numbers/underscores
- Case: Stored as lowercase
- Uniqueness: Unique within StudentProfile and CoachProfile separately

**Profile Images:**
- Maximum size: 5MB
- Storage: Binary data in PostgreSQL
- Transmission: Base64 encoded data URLs
- Supported formats: PNG, JPEG (stored as MIME type)

**Coach Profile:**
- Bio: Maximum 300 characters (for card display)
- Experience: Maximum 1000 characters (for full profile)
- Rate: Non-negative integer
- Specialties/Teaching Styles: Arrays of strings

**Video Collections:**
- URL_VIDEO collections: Limited to 3 videos
- FILE_VIDEO collections: No explicit limit (future file storage implementation)

**Coaching Notes:**
- Note content: Maximum 2000 characters
- Access control: Only COACH and ADMIN user types can create notes
- Relationship: One coach can have multiple notes per media item (versioning through updates)

## Data Flow

### Profile Image Handling

**Upload Flow:**
1. Client captures/crops image using react-image-crop
2. Image converted to base64 string
3. Sent to tRPC endpoint via mutation
4. Server validates size (≤5MB)
5. Server decodes base64 to binary Buffer
6. Binary data stored in Prisma with MIME type
7. Success response returned to client

**Display Flow:**
1. Server queries profile with binary image data
2. Server converts Buffer to base64 string
3. Server creates data URL: `data:{mimeType};base64,{data}`
4. Data URL sent to client
5. Client renders image using data URL in `<img>` tag

### Video Collection Access Control

**Student Access:**
1. Student requests video collections
2. Server queries with `userId` filter
3. Returns only student's own collections
4. Filters out soft-deleted records

**Coach/Admin Access:**
1. Coach/Admin requests video collections
2. Server queries without `userId` filter
3. Returns all collections with creator information
4. Filters out soft-deleted records
5. Includes user firstName and lastName for attribution

### Coach Discovery

**Filtering Pipeline:**
1. Client sends filter criteria (specialties, rate range, verification, search)
2. Server builds Prisma where clause dynamically
3. Applies text search on bio, firstName, lastName
4. Filters by specialties array overlap
5. Filters by rate range
6. Filters by verification status
7. Applies sorting (rate, name, createdAt)
8. Paginates results
9. Transforms data for frontend (includes base64 profile images)
10. Returns coaches with pagination metadata

### Coaching Notes Management

**Note Creation Flow:**
1. Coach views student media item
2. Coach submits coaching note content
3. Server validates coach permissions (COACH or ADMIN role)
4. Server validates note content length (≤2000 characters)
5. Server creates MediaCoachNote record with mediaId, coachId, and content
6. Server returns success response with note details

**Note Retrieval Flow:**
1. Coach or student requests media with coaching notes
2. Server queries Media with included MediaCoachNote records
3. Server includes coach profile information (name, profileImage)
4. Server returns media with associated coaching notes and coach details
5. Client displays notes with coach attribution and timestamps

**Note Update Flow:**
1. Coach submits updated note content for existing note
2. Server validates coach ownership of note
3. Server validates updated content length
4. Server updates noteContent and updatedAt timestamp
5. Server preserves original createdAt timestamp
6. Server returns updated note details


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Authentication and User Management

**Property 1: User Record Creation on Authentication**
*For any* Clerk user who successfully authenticates, the system should create or retrieve a User record with that clerkUserId, ensuring every authenticated user has a corresponding local record.
**Validates: Requirements 1.2**

**Property 2: Profile Update Persistence**
*For any* valid profile update (firstName, lastName, email, timeZone), the changes should be persisted to the database and retrievable in subsequent queries.
**Validates: Requirements 2.2**

**Property 3: Profile Data Completeness**
*For any* user profile query, the response should contain userId, name fields, email, timeZone, userType, and createdAt date.
**Validates: Requirements 2.3**

### Profile Image Management

**Property 4: Profile Image Round Trip**
*For any* valid profile image uploaded as base64, the system should store it as binary data with MIME type, and when retrieved, convert it back to a base64 data URL that can be displayed.
**Validates: Requirements 2.4, 11.1, 11.2, 11.3**

**Property 5: Image Size Validation**
*For any* profile image upload, if the size exceeds 5 megabytes, the system should reject the upload with a validation error.
**Validates: Requirements 2.5**

### Student Profile Management

**Property 6: Student Profile Field Acceptance**
*For any* student profile creation or update, the system should accept and persist displayUsername, skillLevel, goals, bio, and profileImage fields.
**Validates: Requirements 3.1, 3.3**

**Property 7: Student Username Uniqueness**
*For any* displayUsername in StudentProfile, if another StudentProfile already has that username (case-insensitive), the system should reject the duplicate with a uniqueness error.
**Validates: Requirements 3.2, 12.2**

**Property 8: Student-User Relationship**
*For any* StudentProfile, there should exist exactly one User record linked via userId, and deleting the StudentProfile should cascade delete the User.
**Validates: Requirements 3.4, 3.5**

### Coach Profile Management

**Property 9: Coach Profile Field Acceptance**
*For any* coach profile creation or update, the system should accept and persist displayUsername, bio, experience, specialties, teachingStyles, headerImage, profileImage, rate, and isVerified fields.
**Validates: Requirements 4.1**

**Property 10: Coach Bio and Experience Length Validation**
*For any* coach profile, if bio exceeds 300 characters or experience exceeds 1000 characters, the system should reject the input with a validation error.
**Validates: Requirements 4.2, 4.3**

**Property 11: Coach Username Uniqueness**
*For any* displayUsername in CoachProfile, if another CoachProfile already has that username (case-insensitive), the system should reject the duplicate with a uniqueness error.
**Validates: Requirements 4.4, 12.3**

**Property 12: Coach Data Type Storage**
*For any* coach profile, specialties and teachingStyles should be stored as arrays of strings, and rate should be stored as an integer with a default value of 0 if not provided.
**Validates: Requirements 4.5, 4.6**

**Property 13: Coach-User Relationship**
*For any* CoachProfile, there should exist exactly one User record linked via userId, and deleting the CoachProfile should cascade delete the User.
**Validates: Requirements 4.7, 4.8**

### Display Username Validation

**Property 14: Display Username Format Validation**
*For any* displayUsername input, the system should validate that it is 3-30 characters long, starts with a letter, contains only letters/numbers/underscores, and is stored in lowercase format.
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

### Coach Discovery

**Property 15: Coach Listing Completeness**
*For any* request to view coaches, the system should return all Coach profiles (including Admins with coach profiles) with displayUsername, name, bio, rate, specialties, teachingStyles, profileImage, and isVerified status.
**Validates: Requirements 6.1, 6.2**

**Property 16: Coach Profile Resolution**
*For any* valid displayUsername or coachProfileId, the system should resolve it to the correct CoachProfile record with all profile details.
**Validates: Requirements 6.4, 6.5**

**Property 17: Coach Profile Display Completeness**
*For any* coach profile view, the response should include name, bio, experience, specialties, teachingStyles, rate, isVerified status, headerImage, profileImage, and createdAt date.
**Validates: Requirements 7.1, 7.5**

**Property 18: Binary to Base64 Conversion**
*For any* coach with a profileImage stored as binary data, the system should convert it to a base64 data URL using the stored MIME type for display.
**Validates: Requirements 7.4**

### Video Collection Management

**Property 19: Video Collection Creation Requirements**
*For any* video collection creation, the system should require a title and accept optional description and mediaType, linking it to the creator's userId.
**Validates: Requirements 8.1, 8.3**

**Property 20: Soft Deletion Behavior**
*For any* Video Collection or Media deletion, the system should set isDeleted to true and record the deletedAt timestamp, rather than removing the record from the database.
**Validates: Requirements 8.5, 9.5, 13.1, 13.2, 13.3, 13.4**

**Property 21: Soft Deletion Filtering**
*For any* query for Video Collections or Media, the system should exclude records where isDeleted is true by default.
**Validates: Requirements 8.4, 9.4, 13.5**

### Media Management

**Property 22: Media Creation Requirements**
*For any* media creation, the system should require a title and collectionId, and store appropriate fields based on mediaType (videoUrl for URL_VIDEO, fileKey/fileName/fileSize/duration/thumbnailUrl for FILE_VIDEO).
**Validates: Requirements 9.1, 9.2, 9.3**

**Property 23: Cascade Soft Deletion**
*For any* Video Collection that is deleted, all associated Media records should also be soft-deleted (isDeleted set to true).
**Validates: Requirements 9.6**

### Access Control

**Property 24: Student Video Collection Access**
*For any* Student viewing video collections, the system should return only collections where userId matches the student's userId and isDeleted is false.
**Validates: Requirements 10.1**

**Property 25: Coach and Admin Video Collection Access**
*For any* Coach or Admin viewing video collections, the system should return all collections (regardless of owner) with creator firstName and lastName, filtering out soft-deleted records.
**Validates: Requirements 10.2, 10.3, 10.4**

**Property 26: Video Collection Creation Permissions**
*For any* user attempting to create a video collection, the system should allow the operation if userType is STUDENT or ADMIN, and deny it if userType is COACH or FACILITY.
**Validates: Requirements 10.5, 10.6, 10.7**

### Data Integrity

**Property 27: Clerk User ID Uniqueness**
*For any* two User records, they should have different clerkUserId values, enforced by a unique database constraint.
**Validates: Requirements 12.1**

**Property 28: Input Validation with Zod**
*For any* API endpoint input, the system should validate it against a Zod schema, rejecting invalid inputs with descriptive error messages.
**Validates: Requirements 14.2, 14.5**

### Coach-Student Media Interaction

**Property 29: Coach Media Access**
*For any* Coach viewing student media, the system should return all Media items from all Students with associated Student information (name, collection title).
**Validates: Requirements 15.1, 15.2**

**Property 30: Coaching Notes Inclusion**
*For any* Media item viewed by a Coach, the system should include all existing coaching notes associated with that media, along with coach identification and timestamps.
**Validates: Requirements 15.3**

**Property 31: Coaching Note Persistence**
*For any* coaching note created or updated by a Coach, the system should persist the note with correct mediaId, coachId, content, and timestamps.
**Validates: Requirements 15.4**

**Property 32: Coaching Note Deletion**
*For any* coaching note deleted by a Coach, the system should remove the note while preserving the associated Media record.
**Validates: Requirements 15.5**

### Media Coaching Notes Management

**Property 33: Coaching Note Required Fields**
*For any* coaching note creation attempt, the system should require mediaId, coachId, and note content, rejecting requests with missing fields.
**Validates: Requirements 16.1**

**Property 34: Timestamp Preservation on Update**
*For any* coaching note update, the system should preserve the original createdAt timestamp while updating the updatedAt timestamp to the current time.
**Validates: Requirements 16.2**

**Property 35: Coaching Note Display Completeness**
*For any* coaching note display, the response should include Coach name, note content, creation date, and last modified date.
**Validates: Requirements 16.3**

**Property 36: Note Content Length Validation**
*For any* coaching note content exceeding 2000 characters, the system should reject the input with a validation error.
**Validates: Requirements 16.4**

**Property 37: Note Preservation During Media Soft Deletion**
*For any* Media item that is soft-deleted, all associated coaching notes should remain accessible for audit purposes.
**Validates: Requirements 16.5**

### Coach-Media Relationship Tracking

**Property 38: MediaCoachNote Model Relationships**
*For any* MediaCoachNote record, the system should maintain proper foreign key relationships to Media and Coach (User) records.
**Validates: Requirements 17.1**

**Property 39: Coaching Note Query Completeness**
*For any* coaching note query, the response should include Coach profile information and Media details through proper relationship joins.
**Validates: Requirements 17.3**

**Property 40: Coaching Note Access Control**
*For any* coaching note creation attempt, the system should allow the operation only if the user type is COACH or ADMIN, rejecting attempts by STUDENT or FACILITY users.
**Validates: Requirements 17.4**


## Error Handling

### API Error Patterns

**tRPC Error Codes:**
- `UNAUTHORIZED` - User not authenticated
- `FORBIDDEN` - User lacks required permissions
- `NOT_FOUND` - Requested resource doesn't exist
- `BAD_REQUEST` - Invalid input data
- `INTERNAL_SERVER_ERROR` - Unexpected server errors

**Error Response Structure:**
```typescript
{
  code: TRPCErrorCode,
  message: string, // Human-readable error description
  data?: {
    zodError?: ZodError, // Detailed validation errors
    path?: string, // API path where error occurred
  }
}
```

### Validation Error Handling

**Zod Validation:**
- Input validation occurs at tRPC procedure level
- Zod errors are automatically transformed to tRPC errors
- Field-level error messages provided for form validation
- Size limits enforced for text fields and images

**Database Constraint Violations:**
- Unique constraint violations caught and transformed to user-friendly errors
- Foreign key violations indicate data integrity issues
- Cascade deletions handled automatically by Prisma

### Image Processing Errors

**Base64 Decoding:**
- Invalid base64 strings rejected with BAD_REQUEST
- Oversized images (>5MB) rejected before processing
- MIME type validation for supported formats

**Binary Storage:**
- Database storage failures logged and reported
- Fallback to null for corrupted image data
- Default avatars displayed when images unavailable

### Soft Deletion Edge Cases

**Accessing Deleted Resources:**
- Soft-deleted collections return NOT_FOUND
- Queries automatically filter isDeleted=true
- Admin procedures can restore deleted records

**Cascade Deletion:**
- Deleting collection soft-deletes all media
- Timestamps recorded for audit trail
- No orphaned media records

## Testing Strategy

### Unit Testing

**Test Framework:**
- Vitest for unit and integration tests
- Testing Library for React component tests
- MSW (Mock Service Worker) for API mocking

**Unit Test Coverage:**
- Utility functions (image processing, username generation)
- Validation schemas (Zod schema tests)
- Data transformation functions
- Access control helper functions

**Example Unit Tests:**
```typescript
// Test username validation
describe('displayUsername validation', () => {
  it('should accept valid usernames', () => {
    expect(validateUsername('john_doe123')).toBe(true);
  });
  
  it('should reject usernames starting with numbers', () => {
    expect(() => validateUsername('123john')).toThrow();
  });
  
  it('should convert to lowercase', () => {
    expect(normalizeUsername('JohnDoe')).toBe('johndoe');
  });
});

// Test image size validation
describe('profile image validation', () => {
  it('should reject images over 5MB', () => {
    const largeImage = generateBase64Image(6 * 1024 * 1024);
    expect(() => validateImageSize(largeImage)).toThrow();
  });
});
```

### Property-Based Testing

**PBT Framework:**
- fast-check for JavaScript/TypeScript property-based testing
- Minimum 100 iterations per property test
- Custom generators for domain-specific data

**Property Test Implementation:**
- Each correctness property from the design document should have a corresponding property-based test
- Tests tagged with feature name and property number
- Generators create valid and invalid inputs to test boundaries

**Example Property Tests:**
```typescript
import fc from 'fast-check';

/**
 * Feature: badminton-coaching-platform, Property 14: Display Username Format Validation
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */
describe('Property 14: Display Username Format Validation', () => {
  it('should validate username format for all inputs', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 30 })
          .filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s)),
        (username) => {
          const result = validateAndNormalizeUsername(username);
          expect(result).toBe(username.toLowerCase());
          expect(result.length).toBeGreaterThanOrEqual(3);
          expect(result.length).toBeLessThanOrEqual(30);
          expect(result[0]).toMatch(/[a-z]/);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should reject invalid usernames', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string({ maxLength: 2 }), // Too short
          fc.string({ minLength: 31 }), // Too long
          fc.string().filter(s => /^[0-9]/.test(s)), // Starts with number
          fc.string().filter(s => /[^a-zA-Z0-9_]/.test(s)) // Invalid chars
        ),
        (invalidUsername) => {
          expect(() => validateAndNormalizeUsername(invalidUsername)).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: badminton-coaching-platform, Property 20: Soft Deletion Behavior
 * Validates: Requirements 8.5, 9.5, 13.1, 13.2, 13.3, 13.4
 */
describe('Property 20: Soft Deletion Behavior', () => {
  it('should soft delete collections and media', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1 }),
          description: fc.option(fc.string()),
          mediaType: fc.constantFrom('URL_VIDEO', 'FILE_VIDEO')
        }),
        async (collectionData) => {
          // Create collection
          const collection = await createCollection(collectionData);
          const beforeDelete = new Date();
          
          // Delete collection
          await deleteCollection(collection.collectionId);
          
          // Verify soft deletion
          const deleted = await getCollectionIncludingDeleted(collection.collectionId);
          expect(deleted.isDeleted).toBe(true);
          expect(deleted.deletedAt).toBeInstanceOf(Date);
          expect(deleted.deletedAt.getTime()).toBeGreaterThanOrEqual(beforeDelete.getTime());
          
          // Verify not returned in normal queries
          const collections = await getCollections();
          expect(collections.find(c => c.collectionId === collection.collectionId)).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: badminton-coaching-platform, Property 4: Profile Image Round Trip
 * Validates: Requirements 2.4, 11.1, 11.2, 11.3
 */
describe('Property 4: Profile Image Round Trip', () => {
  it('should preserve image data through storage and retrieval', () => {
    fc.assert(
      fc.property(
        fc.uint8Array({ minLength: 100, maxLength: 5000 }), // Random image data
        fc.constantFrom('image/png', 'image/jpeg'),
        (imageData, mimeType) => {
          // Convert to base64
          const base64 = Buffer.from(imageData).toString('base64');
          const dataUrl = `data:${mimeType};base64,${base64}`;
          
          // Store as binary
          const stored = processBase64Image(dataUrl);
          
          // Retrieve as base64
          const retrieved = binaryToBase64DataUrl(stored, mimeType);
          
          // Verify round trip
          expect(retrieved).toBe(dataUrl);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Custom Generators:**
```typescript
// Generator for valid display usernames
const validUsernameArb = fc.string({ minLength: 3, maxLength: 30 })
  .filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s));

// Generator for coach profiles
const coachProfileArb = fc.record({
  displayUsername: fc.option(validUsernameArb),
  bio: fc.option(fc.string({ maxLength: 300 })),
  experience: fc.option(fc.string({ maxLength: 1000 })),
  specialties: fc.array(fc.string(), { maxLength: 10 }),
  teachingStyles: fc.array(fc.string(), { maxLength: 10 }),
  rate: fc.nat(),
  isVerified: fc.boolean()
});

// Generator for video collections
const videoCollectionArb = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ maxLength: 500 })),
  mediaType: fc.constantFrom('URL_VIDEO', 'FILE_VIDEO')
});
```

### Integration Testing

**API Integration Tests:**
- Test complete tRPC procedure flows
- Mock Clerk authentication
- Use test database for isolation
- Verify database state after operations

**Test Scenarios:**
- User registration and profile creation flow
- Coach profile creation with image upload
- Video collection creation and media addition
- Role-based access control enforcement
- Soft deletion and restoration

### End-to-End Testing

**E2E Framework:**
- Playwright for browser automation
- Test critical user journeys
- Visual regression testing for UI components

**Critical Paths:**
- Student signs up, creates profile, uploads videos
- Coach signs up, creates profile, views student videos
- Student browses coaches, views coach profile
- Admin manages users and content

## Performance Considerations

### Database Optimization

**Indexing Strategy:**
- `User.clerkUserId` - Unique index for authentication lookups
- `VideoCollection.userId` - Index for user-specific queries
- `VideoCollection.isDeleted` - Index for soft deletion filtering
- `Media.collectionId` - Index for collection media queries
- `Media.isDeleted` - Index for soft deletion filtering
- `MediaCoachNote.mediaId` - Index for media-specific coaching notes
- `MediaCoachNote.coachId` - Index for coach-specific notes
- `CoachProfile.displayUsername` - Unique index for profile lookups
- `StudentProfile.displayUsername` - Unique index for profile lookups

**Query Optimization:**
- Use Prisma `select` to fetch only needed fields
- Implement pagination for coach listings (default 10 per page)
- Eager load related data with `include` to avoid N+1 queries
- Use `findFirst` with OR conditions for username/ID lookups

### Image Handling

**Binary Storage Trade-offs:**
- Pros: Simple implementation, no external dependencies, transactional consistency
- Cons: Database size growth, limited to 5MB per image
- Future: Consider migration to object storage (S3, Cloudflare R2) for larger files

**Base64 Transmission:**
- Increases payload size by ~33%
- Acceptable for profile images (typically <1MB)
- Consider CDN caching for frequently accessed images

### Caching Strategy

**Server-Side Caching:**
- React Server Components cache by default
- tRPC queries cached by TanStack Query on client
- Consider Redis for session data (future enhancement)

**Client-Side Caching:**
- TanStack Query caches API responses
- Stale-while-revalidate pattern for coach listings
- Optimistic updates for profile changes

## Security Considerations

### Authentication

**Clerk Integration:**
- JWT-based authentication
- Secure session management
- CSRF protection built-in
- Rate limiting on authentication endpoints

### Authorization

**Role-Based Access Control:**
- Middleware enforces authentication on protected routes
- tRPC procedures check user roles
- Database queries filter by userId for data isolation
- Admin procedures restricted to Admin role

### Data Validation

**Input Sanitization:**
- Zod schemas validate all inputs
- SQL injection prevented by Prisma parameterized queries
- XSS prevention through React's automatic escaping
- File upload validation (size, type)

### Sensitive Data

**Profile Images:**
- Stored as binary in database (not publicly accessible)
- Transmitted as base64 data URLs (requires authentication)
- No direct file system access

**User Data:**
- Email addresses not publicly exposed
- Profile visibility controlled by user type
- Soft deletion preserves data for audit

## Deployment Architecture

### Container Strategy

**Docker Compose:**
- `app` service: Next.js application
- `db` service: PostgreSQL database
- Volume mounts for database persistence
- Environment-based configuration

**Production Deployment:**
- Separate compose files for dev/prod
- Health checks for services
- Automatic restart policies
- Log aggregation

### Environment Configuration

**Required Environment Variables:**
```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# Application
NODE_ENV="production"
```

### Database Migrations

**Prisma Migrations:**
- Development: `prisma migrate dev` (generates and applies)
- Production: `prisma migrate deploy` (applies only)
- Migration history tracked in `_prisma_migrations` table
- Rollback strategy: restore database backup

### Monitoring and Logging

**Application Logs:**
- Console logging for development
- Structured logging for production
- Error tracking (future: Sentry integration)

**Database Monitoring:**
- Prisma query logging in development
- Connection pool monitoring
- Slow query identification

## Future Enhancements

### Planned Features

**Session Booking:**
- Calendar integration for coach availability
- Real-time booking system
- Payment processing integration
- Video call integration

**Messaging:**
- Real-time chat between students and coaches
- Message notifications
- File sharing in conversations

**Reviews and Ratings:**
- Student reviews of coaches
- Rating system (1-5 stars)
- Review moderation

**Advanced Search:**
- Full-text search for coach bios
- Geolocation-based coach discovery
- Advanced filtering (availability, price range)

### Technical Improvements

**Performance:**
- Migrate to object storage for images and videos
- Implement CDN for static assets
- Add Redis for session caching
- Optimize database queries with materialized views

**Testing:**
- Increase property-based test coverage
- Add visual regression tests
- Implement load testing
- Add mutation testing

**Monitoring:**
- Application performance monitoring (APM)
- Real-time error tracking
- User analytics
- Database performance metrics

**Security:**
- Implement rate limiting
- Add CAPTCHA for registration
- Two-factor authentication
- Security audit and penetration testing
