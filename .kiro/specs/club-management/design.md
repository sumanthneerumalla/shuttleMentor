# Club Management and Media Collection Sharing Feature Design

## Overview

The Club Management and Media Collection Sharing feature extends the existing ShuttleMentor platform to support club-based organization of users and secure sharing of media collections between students and coaches within the same club. This feature adds club identification and naming capabilities to all user types while enabling students to selectively share their media collections with coaches from their club.

The design integrates seamlessly with the existing user management and media collection systems, adding club fields to the User model and coach assignment capabilities to media collections while maintaining backward compatibility. All users will have default club assignments that can be modified through the existing profile management interfaces, and students can control which coaches have access to their media collections.

The media collection sharing component ensures that students can only select coaches from their own club, providing a secure and organized approach to coaching relationships within club boundaries.

## Architecture

The club management and media collection sharing feature follows the existing architectural patterns in the ShuttleMentor platform:

- **Database Layer**: Extends the existing Prisma User model with club fields and VideoCollection model with coach assignment fields
- **API Layer**: Enhances existing tRPC user and video collection routers with club-based filtering and coach assignment handling
- **UI Layer**: Updates existing profile and media collection components to display club information and coach selection interfaces
- **Validation Layer**: Adds Zod schemas for club data validation and coach assignment validation
- **Access Control Layer**: Implements permission checking for media collection access based on coach assignments

### Integration Points

1. **User Model Extension**: Adds `clubId` and `clubName` fields to the existing User model
2. **VideoCollection Model Extension**: Adds `assignedCoachId` field to enable coach assignments
3. **API Enhancement**: Modifies existing user and video collection router endpoints to handle club data and coach assignments
4. **UI Updates**: Extends profile pages and media collection components to display club information and coach selection
5. **Access Control**: Implements middleware to verify coach access to assigned media collections
6. **Migration Strategy**: Provides database migrations to add club and coach assignment fields with default values

## Components and Interfaces

### Database Schema Changes

```prisma
model User {
  // ... existing fields
  clubId    String @default("default-club-001")
  clubName  String @default("ShuttleMentor Academy")
  // ... rest of existing fields
}

model VideoCollection {
  // ... existing fields
  assignedCoachId String? // Optional coach assignment
  assignedCoach   User?   @relation("AssignedCoach", fields: [assignedCoachId], references: [id])
  // ... rest of existing fields
}
```

### API Interface Extensions

The existing tRPC routers will be extended to handle club data and coach assignments:

```typescript
// Enhanced input schemas
const updateProfileInput = z.object({
  // ... existing fields
  clubId: z.string().regex(/^[a-zA-Z0-9-]+$/).min(1).max(50).optional(),
  clubName: z.string().min(1).max(100).optional(),
});

const assignCoachInput = z.object({
  collectionId: z.string(),
  coachId: z.string().optional(), // null to remove assignment
});

const getClubCoachesInput = z.object({
  clubId: z.string(),
});

// Enhanced response types
type UserWithClub = User & {
  clubId: string;
  clubName: string;
};

type VideoCollectionWithCoach = VideoCollection & {
  assignedCoach?: User;
};

type ClubCoach = {
  id: string;
  displayUsername: string;
  clubName: string;
  // ... other relevant coach fields
};
```

### UI Component Updates

1. **Profile Display Components**: Show club information in user profiles
2. **Profile Edit Forms**: Allow editing of club information
3. **User Lists**: Display club names in coach listings and user directories
4. **Media Collection Components**: 
   - Show assigned coach information
   - Provide coach selection interface for students
   - Display club-filtered coach lists
5. **Coach Selection Modal**: Interface for students to select coaches from their club
6. **Access Control Components**: Handle unauthorized access to media collections

## Data Models

### User Model Extensions

The existing User model will be extended with two new fields:

- `clubId`: String identifier for the club (alphanumeric with hyphens, 1-50 characters)
- `clubName`: Human-readable club name (1-100 characters)

Both fields will be non-nullable with default values to ensure data consistency.

### VideoCollection Model Extensions

The existing VideoCollection model will be extended with coach assignment capability:

- `assignedCoachId`: Optional string field referencing a User ID (nullable)
- `assignedCoach`: Optional relation to User model for the assigned coach

This allows students to assign coaches to their media collections while maintaining the ability to have unassigned collections.

### Default Values

- **Default Club ID**: "default-club-001"
- **Default Club Name**: "ShuttleMentor Academy"
- **Default Coach Assignment**: null (no coach assigned)

These defaults provide immediate functionality while allowing customization.

### Access Control Model

The system implements role-based access control for media collections:

- **Student Owner**: Full access to their own collections (view, edit, delete, assign coach)
- **Assigned Coach**: Read-only access to assigned collections
- **Unassigned Coach**: No access to collections not assigned to them
- **Admin**: Full access to all collections (for moderation purposes)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the requirements analysis, the following correctness properties ensure the club management and media collection sharing feature operates correctly:

**Property 1: User club data completeness**
*For any* user record in the system, querying that user should return both clubId and clubName fields with non-null values
**Validates: Requirements 1.1, 1.5, 6.1**

**Property 2: Default club assignment**
*For any* newly created user, the user should have clubId set to "default-club-001" and clubName set to "ShuttleMentor Academy"
**Validates: Requirements 2.1, 2.2, 6.3**

**Property 3: Club data persistence**
*For any* valid club data update, the updated values should be retrievable from the database after the update operation completes
**Validates: Requirements 4.2, 6.2**

**Property 4: Profile display includes club information**
*For any* user profile display (Student, Coach, or Admin), the rendered output should contain the user's club name
**Validates: Requirements 3.1, 3.2, 3.4, 7.1**

**Property 5: Club ID validation**
*For any* clubId input, it should be accepted if and only if it contains only alphanumeric characters and hyphens and is between 1-50 characters
**Validates: Requirements 8.1**

**Property 6: Club name validation**
*For any* clubName input, it should be accepted if and only if it is between 1 and 100 characters in length
**Validates: Requirements 8.2**

**Property 7: Invalid data rejection**
*For any* invalid club data submission, the system should reject the update and preserve existing club values
**Validates: Requirements 8.5**

**Property 8: Input sanitization**
*For any* club data input containing potentially malicious content, the system should sanitize the input before processing
**Validates: Requirements 8.3**

**Property 9: Same-club coach filtering**
*For any* student selecting a coach for media collection review, only coaches with matching clubId should be displayed as options
**Validates: Requirements 9.1, 9.2**

**Property 10: Coach assignment access control**
*For any* media collection with an assigned coach, only that specific coach and the student owner should have access to the collection
**Validates: Requirements 10.1, 10.2**

**Property 11: Unassigned collection access**
*For any* media collection with no assigned coach, only the student owner should have access to the collection
**Validates: Requirements 10.3**

**Property 12: Access permission updates**
*For any* change in coach assignment, access permissions should be updated immediately to reflect the new assignment
**Validates: Requirements 10.5, 11.3**

**Property 13: Coach assignment persistence**
*For any* coach assigned to a media collection, the coach's user ID should be stored in the assignedCoachId field and retrievable through queries
**Validates: Requirements 12.2, 12.5**

**Property 14: Multiple coach assignments**
*For any* student with multiple media collections, different coaches can be assigned to different collections independently
**Validates: Requirements 11.4**

**Property 15: Default club coach display**
*For any* student with no club affiliation or default club affiliation, coaches from the default club should be available for selection
**Validates: Requirements 9.3**

## Error Handling

The club management and media collection sharing feature implements comprehensive error handling:

### Validation Errors
- **Invalid Club ID Format**: Returns descriptive error when clubId contains invalid characters
- **Club Name Length**: Returns specific error when clubName exceeds 100 characters or is empty
- **Required Field Missing**: Returns error when attempting to set club fields to null
- **Invalid Coach Assignment**: Returns error when attempting to assign coach from different club
- **Coach Not Found**: Returns error when attempting to assign non-existent coach

### Access Control Errors
- **Unauthorized Collection Access**: Returns 403 error when coach attempts to access unassigned collection
- **Invalid Coach Assignment**: Returns error when student attempts to assign coach from different club
- **Collection Not Found**: Returns 404 error when accessing non-existent media collection
- **Permission Denied**: Returns error when non-owner attempts to modify coach assignments

### Database Errors
- **Migration Failures**: Rollback mechanism for schema changes
- **Constraint Violations**: Proper error handling for database constraint failures including foreign key violations for coach assignments
- **Connection Issues**: Graceful degradation when database is unavailable
- **Referential Integrity**: Error handling for invalid coach ID references

### API Errors
- **Input Validation**: tRPC validation errors with detailed field-level feedback for both club and coach assignment data
- **Authentication**: Proper error responses for unauthorized club data access and media collection access
- **Type Safety**: Compile-time and runtime type checking for club data and coach assignments
- **Rate Limiting**: Error handling for excessive API requests

### UI Error Handling
- **Form Validation**: Real-time validation feedback for club fields and coach selection
- **Network Errors**: User-friendly messages for API failures
- **Loading States**: Proper loading indicators during club data operations and coach assignment changes
- **Access Denied**: Clear messaging when users cannot access media collections
- **Coach Selection Errors**: Helpful messages when coach assignment fails

## Testing Strategy

The club management and media collection sharing feature employs a dual testing approach combining unit tests and property-based tests to ensure comprehensive coverage and correctness.

### Unit Testing Approach

Unit tests will cover specific scenarios and edge cases:

- **Default Value Assignment**: Verify new users receive correct default club values
- **Profile Display**: Test that club information appears in user profiles
- **Form Submission**: Verify club data is included in profile update forms
- **Validation Edge Cases**: Test boundary conditions for club name length and ID format
- **Error Scenarios**: Test behavior with invalid inputs and network failures
- **Coach Assignment**: Test specific coach assignment and removal scenarios
- **Access Control**: Test specific access scenarios for assigned and unassigned collections
- **Club Filtering**: Test coach filtering with specific club configurations

### Property-Based Testing Approach

Property-based tests will verify universal properties across all valid inputs using **fast-check** as the testing library. Each property-based test will run a minimum of 100 iterations to ensure thorough coverage.

Property-based tests will be tagged with comments explicitly referencing the correctness properties:

- **Feature: club-management, Property 1**: User club data completeness
- **Feature: club-management, Property 2**: Default club assignment  
- **Feature: club-management, Property 3**: Club data persistence
- **Feature: club-management, Property 4**: Profile display includes club information
- **Feature: club-management, Property 5**: Club ID validation
- **Feature: club-management, Property 6**: Club name validation
- **Feature: club-management, Property 7**: Invalid data rejection
- **Feature: club-management, Property 8**: Input sanitization
- **Feature: club-management, Property 9**: Same-club coach filtering
- **Feature: club-management, Property 10**: Coach assignment access control
- **Feature: club-management, Property 11**: Unassigned collection access
- **Feature: club-management, Property 12**: Access permission updates
- **Feature: club-management, Property 13**: Coach assignment persistence
- **Feature: club-management, Property 14**: Multiple coach assignments
- **Feature: club-management, Property 15**: Default club coach display

### Test Data Generation

Property-based tests will use intelligent generators:

- **Valid Club IDs**: Generate alphanumeric strings with hyphens of varying lengths
- **Invalid Club IDs**: Generate strings with special characters, empty strings, and oversized strings
- **Club Names**: Generate strings of various lengths including edge cases
- **User Data**: Generate complete user objects with different user types and club affiliations
- **Media Collections**: Generate collections with various ownership and assignment states
- **Coach Assignments**: Generate valid and invalid coach assignment scenarios
- **Access Scenarios**: Generate various user-collection-coach combinations for access testing
- **Malicious Inputs**: Generate strings with potential injection attacks for sanitization testing

### Integration Testing

Integration tests will verify the complete flow:

- **Database Migration**: Test schema updates and data migration for both User and VideoCollection models
- **API Integration**: Test tRPC endpoints with club data and coach assignment functionality
- **UI Integration**: Test profile components and media collection components with club information and coach selection
- **Access Control Integration**: Test complete access control flows from UI to database
- **End-to-End Workflows**: Test complete user workflows including profile updates, coach assignments, and media collection access

The testing strategy ensures both specific functionality (unit tests) and general correctness (property tests) are validated, providing confidence in the club management and media collection sharing feature's reliability and robustness.