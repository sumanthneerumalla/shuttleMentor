# Coach Media Collections Design Document

## Overview

The Coach Media Collections feature extends the existing ShuttleMentor platform to enable coaches and facility managers to create, manage, and share instructional video collections with students and coaches in their club. This feature leverages the existing video collection infrastructure while adding new models and APIs specifically for coach and facility-created content with multi-user sharing capabilities including coach-to-coach sharing for facility-managed content.

## Architecture

The feature follows the existing platform architecture patterns:

- **Frontend**: React/Next.js components using existing UI patterns
- **Backend**: tRPC routers with Zod validation
- **Database**: Prisma ORM with PostgreSQL
- **Authentication**: Clerk integration with role-based access control
- **State Management**: tRPC React Query for client-side caching

### Key Architectural Decisions

1. **Separate Models**: Create distinct models (CoachMediaCollection, CoachMedia, CoachCollectionShare) rather than extending existing VideoCollection to maintain clear separation of concerns
2. **Club-Based Sharing**: Enforce club-level isolation to maintain organizational boundaries
3. **Soft Deletion**: Implement soft deletion for all coach collection entities to enable recovery
4. **Permission Inheritance**: Leverage existing user role system (COACH, FACILITY, ADMIN, STUDENT) for access control
5. **Flexible Sharing**: Support sharing with Students, Coaches, or both to enable facility-level content distribution

## Components and Interfaces

### Database Models

#### CoachMediaCollection
```prisma
model CoachMediaCollection {
  collectionId    String    @id @default(cuid())
  coachId         String
  coach           User      @relation("CoachCollections", fields: [coachId], references: [userId], onDelete: Cascade)
  title           String
  description     String?   @db.Text
  mediaType       MediaType
  isDeleted       Boolean   @default(false)
  deletedAt       DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  media           CoachMedia[]
  sharedWith      CoachCollectionShare[]

  @@index([coachId])
  @@index([isDeleted])
}
```

#### CoachMedia
```prisma
model CoachMedia {
  mediaId      String               @id @default(cuid())
  collectionId String
  collection   CoachMediaCollection @relation(fields: [collectionId], references: [collectionId], onDelete: Cascade)
  title        String
  description  String?              @db.Text
  videoUrl     String?
  thumbnailUrl String?
  isDeleted    Boolean              @default(false)
  deletedAt    DateTime?
  createdAt    DateTime             @default(now())
  updatedAt    DateTime             @updatedAt

  @@index([collectionId])
  @@index([isDeleted])
}
```

#### CoachCollectionShare
```prisma
model CoachCollectionShare {
  shareId      String               @id @default(cuid())
  collectionId String
  collection   CoachMediaCollection @relation(fields: [collectionId], references: [collectionId], onDelete: Cascade)
  sharedWithId String
  sharedWith   User                 @relation("SharedCollections", fields: [sharedWithId], references: [userId], onDelete: Cascade)
  sharedAt     DateTime             @default(now())

  @@unique([collectionId, sharedWithId])
  @@index([collectionId])
  @@index([sharedWithId])
}
```

### API Interfaces

#### CoachMediaCollectionRouter
- `create`: Create new coach collection with optional initial sharing
- `getAll`: Get all collections for current coach or facility
- `getSharedWithMe`: Get collections shared with current student or coach
- `getById`: Get specific collection with access control
- `update`: Update collection metadata
- `delete`: Soft delete collection
- `addMedia`: Add video to collection
- `updateMedia`: Update video metadata
- `deleteMedia`: Soft delete video
- `shareWithUsers`: Share collection with multiple students and/or coaches
- `unshareFromUsers`: Remove sharing from users
- `getClubUsers`: Get students and coaches from same club for sharing
- `getFacilityCollections`: Get all collections in facility's club

### Frontend Components

#### CoachMediaCollectionForm
- Extends existing VideoCollectionForm patterns
- Adds user selection for initial sharing (students and/or coaches)
- Validates coach or facility permissions
- Handles URL video creation (3 video limit)
- Supports "All Students", "All Coaches", or "Specific Users" sharing modes

#### UserSelector
- Multi-select component for choosing students and coaches
- Filters users by club membership and user type
- Shows user names, usernames, and roles
- Handles bulk selection operations
- Supports "All Students" and "All Coaches" options

#### CoachCollectionDashboard
- Lists coach or facility-created collections
- Shows sharing status and user counts
- Provides collection management actions
- Integrates with existing dashboard layout
- Displays both owned and club collections for facility users

#### SharedCollectionsList
- Student and coach view of shared collections
- Shows creator information and share dates
- Provides access to collection content
- Integrates with student and coach dashboards

#### FacilityCollectionManagement
- Facility-specific dashboard for creating and managing collections
- Shows all collections in the club (owned by facility and coaches)
- Provides sharing interface for students and coaches
- Displays analytics on content distribution

## Data Models

### CoachMediaCollection Entity
```typescript
interface CoachMediaCollection {
  collectionId: string;
  coachId: string;
  title: string;
  description?: string;
  mediaType: MediaType;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  coach: User;
  media: CoachMedia[];
  sharedWith: CoachCollectionShare[];
}
```

### CoachMedia Entity
```typescript
interface CoachMedia {
  mediaId: string;
  collectionId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  collection: CoachMediaCollection;
}
```

### CoachCollectionShare Entity
```typescript
interface CoachCollectionShare {
  shareId: string;
  collectionId: string;
  sharedWithId: string;
  sharedAt: Date;
  
  // Relations
  collection: CoachMediaCollection;
  sharedWith: User;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Club Isolation Enforcement
*For any* coach or facility collection sharing operation, all target users must belong to the same club as the creator
**Validates: Requirements 3.1, 3.2**

### Property 2: Collection Ownership Validation
*For any* coach or facility collection modification operation, the requesting user must be either the collection owner or an admin
**Validates: Requirements 7.1, 7.3**

### Property 3: User Access Control
*For any* student or coach attempting to access a collection, they must have an active sharing relationship or be a facility user in the same club
**Validates: Requirements 6.4, 7.2, 7.5**

### Property 4: Soft Deletion Consistency
*For any* coach or facility collection or media deletion, the isDeleted flag must be set to true and deletedAt must be recorded, while preserving the actual data
**Validates: Requirements 8.1, 8.3**

### Property 5: Share Relationship Uniqueness
*For any* collection-user pair, there can be at most one active sharing relationship at any time
**Validates: Requirements 4.5, 13.7**

### Property 6: URL Video Limit Enforcement
*For any* coach or facility collection with mediaType URL_VIDEO, the number of non-deleted media items must not exceed 3
**Validates: Requirements 2.3**

### Property 7: Creator Permission Validation
*For any* coach or facility collection creation or modification, the requesting user must have userType COACH, FACILITY, or ADMIN
**Validates: Requirements 1.4, 17.2**

### Property 8: Club User Filtering
*For any* request to get club users for sharing, only users with userType STUDENT or COACH and matching clubId should be returned
**Validates: Requirements 3.3, 3.4**

### Property 9: Sharing Type Enforcement
*For any* collection with sharingType ALL_STUDENTS, all students in the same club must have active share relationships
**Validates: Requirements 15.2, 15.5**

### Property 10: Facility Access Control
*For any* facility user accessing collections, they must be able to view all collections in their club regardless of sharing status
**Validates: Requirements 16.5, 7.5**

### Property 11: Coach Assignment Validation
*For any* collection shared with "All Coaches", all coaches in the same club must have active share relationships
**Validates: Requirements 18.1, 18.4**

## Error Handling

### Client-Side Error Handling
- Form validation errors with field-specific messages
- Network error recovery with retry mechanisms
- Permission denied errors with appropriate user guidance
- Loading states during async operations

### Server-Side Error Handling
- Input validation using Zod schemas
- Database constraint violation handling
- Permission check failures with descriptive messages
- Soft deletion state validation

### Error Categories
1. **Validation Errors**: Invalid input data, URL format issues
2. **Permission Errors**: Unauthorized access, role violations
3. **Business Logic Errors**: Club mismatch, video limits exceeded
4. **System Errors**: Database failures, network issues

## Testing Strategy

### Unit Testing
- API endpoint validation with various input scenarios
- Permission checking logic with different user roles
- Database model relationships and constraints
- URL validation and media type handling

### Property-Based Testing
- Generate random coach collections and verify club isolation
- Test sharing operations with random student sets
- Validate soft deletion behavior across all entities
- Verify access control with random user-collection combinations

### Integration Testing
- End-to-end collection creation and sharing workflows
- Cross-component communication between coach and student views
- Database transaction integrity during sharing operations
- Authentication and authorization flow testing

### Testing Framework
- **Unit Tests**: Vitest for component and utility testing
- **Property Tests**: fast-check for property-based testing
- **Integration Tests**: Playwright for end-to-end scenarios
- **API Tests**: tRPC testing utilities for router validation

## Implementation Notes

### Reusable Components
- Leverage existing VideoCollectionForm as base for CoachMediaCollectionForm
- Reuse video display components for coach media
- Extend existing dashboard layouts for coach collection management
- Utilize existing error handling and loading state patterns

### Performance Considerations
- Index optimization for club-based queries
- Pagination for large student lists in sharing interface
- Efficient loading of collection metadata vs full content
- Caching strategies for frequently accessed shared collections

### Security Considerations
- Club-level data isolation enforcement
- Role-based access control validation
- Input sanitization for video URLs and descriptions
- Audit logging for sharing operations

### Migration Strategy
- Add new database models without affecting existing data
- Gradual rollout to coach users first
- Backward compatibility with existing video collection features
- Data migration scripts for any schema changes