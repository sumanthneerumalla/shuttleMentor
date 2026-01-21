# Coach Media Collections Design Document

## Overview

The Coach Media Collections feature extends the existing ShuttleMentor platform to enable coaches to create, manage, and share instructional video collections with students in their club. This feature leverages the existing video collection infrastructure while adding new models and APIs specifically for coach-created content with multi-student sharing capabilities.

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
4. **Permission Inheritance**: Leverage existing user role system (COACH, ADMIN, STUDENT) for access control

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
  studentId    String
  student      User                 @relation("SharedCollections", fields: [studentId], references: [userId], onDelete: Cascade)
  sharedAt     DateTime             @default(now())

  @@unique([collectionId, studentId])
  @@index([collectionId])
  @@index([studentId])
}
```

### API Interfaces

#### CoachMediaCollectionRouter
- `create`: Create new coach collection with optional initial sharing
- `getAll`: Get all collections for current coach
- `getSharedWithMe`: Get collections shared with current student
- `getById`: Get specific collection with access control
- `update`: Update collection metadata
- `delete`: Soft delete collection
- `addMedia`: Add video to collection
- `updateMedia`: Update video metadata
- `deleteMedia`: Soft delete video
- `shareWithStudents`: Share collection with multiple students
- `unshareFromStudents`: Remove sharing from students
- `getClubStudents`: Get students from same club for sharing

### Frontend Components

#### CoachMediaCollectionForm
- Extends existing VideoCollectionForm patterns
- Adds student selection for initial sharing
- Validates coach permissions
- Handles URL video creation (3 video limit)

#### StudentSelector
- Multi-select component for choosing students
- Filters students by club membership
- Shows student names and usernames
- Handles bulk selection operations

#### CoachCollectionDashboard
- Lists coach-created collections
- Shows sharing status and student counts
- Provides collection management actions
- Integrates with existing dashboard layout

#### SharedCollectionsList
- Student view of shared collections
- Shows coach information and share dates
- Provides access to collection content
- Integrates with student dashboard

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
  studentId: string;
  sharedAt: Date;
  
  // Relations
  collection: CoachMediaCollection;
  student: User;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Club Isolation Enforcement
*For any* coach collection sharing operation, all target students must belong to the same club as the coach creating the share
**Validates: Requirements 3.1, 3.2**

### Property 2: Collection Ownership Validation
*For any* coach collection modification operation, the requesting user must be either the collection owner or an admin
**Validates: Requirements 7.1, 7.3**

### Property 3: Student Access Control
*For any* student attempting to access a coach collection, they must have an active sharing relationship or the collection must be owned by them (which is impossible for coach collections)
**Validates: Requirements 6.4, 7.2**

### Property 4: Soft Deletion Consistency
*For any* coach collection or media deletion, the isDeleted flag must be set to true and deletedAt must be recorded, while preserving the actual data
**Validates: Requirements 8.1, 8.3**

### Property 5: Share Relationship Uniqueness
*For any* collection-student pair, there can be at most one active sharing relationship at any time
**Validates: Requirements 4.3, 13.6**

### Property 6: URL Video Limit Enforcement
*For any* coach collection with mediaType URL_VIDEO, the number of non-deleted media items must not exceed 3
**Validates: Requirements 2.3**

### Property 7: Coach Permission Validation
*For any* coach collection creation or modification, the requesting user must have userType COACH or ADMIN
**Validates: Requirements 1.4, 15.2**

### Property 8: Club Student Filtering
*For any* request to get club students for sharing, only users with userType STUDENT and matching clubId should be returned
**Validates: Requirements 3.3, 3.4**

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