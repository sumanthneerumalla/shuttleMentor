# Coaches Route Specification

## Overview

The coaches route will allow users to browse, search, and filter coaches based on various criteria. The implementation will be similar to the video collections route but with coach-specific filtering options.

## Routes

1. **Main Listing Page**: `/coaches`
   - Lists all coaches with filtering options
   - Pagination support
   - Search functionality

2. **Coach Detail Page**: `/coaches/[username]`
   - Uses the new `displayUsername` field for human-readable URLs
   - Shows detailed coach information
   - Booking interface
   - Reviews section

## API Endpoints

### 1. Get Coaches List

```
GET /api/coaches
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term for name/bio
- `specialties`: Array of specialties to filter by
- `teachingStyles`: Array of teaching styles to filter by
- `minRate`: Minimum rate
- `maxRate`: Maximum rate
- `isVerified`: Boolean to filter verified coaches
- `sortBy`: Field to sort by (options: 'rate', 'createdAt', 'name')
- `sortOrder`: 'asc' or 'desc'

Response:
```json
{
  "coaches": [
    {
      "coachProfileId": "string",
      "displayUsername": "string",
      "firstName": "string",
      "lastName": "string",
      "bio": "string",
      "specialties": ["string"],
      "teachingStyles": ["string"],
      "rate": 0,
      "isVerified": false,
      "profileImageUrl": "string"
    }
  ],
  "pagination": {
    "totalCount": 0,
    "pageCount": 0,
    "currentPage": 0,
    "perPage": 0
  }
}
```

### 2. Get Coach Detail

```
GET /api/coaches/[username]
```

Path parameters:
- `username`: The coach's displayUsername

Response:
```json
{
  "coachProfileId": "string",
  "displayUsername": "string",
  "firstName": "string",
  "lastName": "string",
  "bio": "string",
  "experience": "string",
  "specialties": ["string"],
  "teachingStyles": ["string"],
  "rate": 0,
  "isVerified": false,
  "headerImage": "string",
  "profileImageUrl": "string",
  "createdAt": "string"
}
```

## Components

### 1. CoachCard Component

A reusable card component for displaying coach information in the listing page:
- Profile image (using ProfileAvatar with fallback)
- Name
- Bio (truncated)
- Specialties (limited display)
- Rate
- Verification badge (if verified)

### 2. CoachFilters Component

A sidebar or dropdown component for filtering coaches:
- Specialties multi-select
- Teaching styles multi-select
- Rate range slider
- Verification toggle
- Sort options

### 3. CoachDetail Component

A detailed view of a coach's profile:
- Large profile image
- Header image
- Full bio and experience
- Complete list of specialties and teaching styles
- Rate information
- Booking interface
- Reviews section

## Implementation Plan

1. **Database Migration**
   - Add displayUsername field to CoachProfile and StudentProfile models ✅
   - Create migration to update the database

2. **API Implementation**
   - Create coaches router in TRPC
   - Implement getCoaches endpoint with filtering
   - Implement getCoachByUsername endpoint

3. **Frontend Implementation**
   - Create coaches listing page
   - Create coach detail page
   - Implement coach card component
   - Implement filtering components

4. **Profile Management**
   - Add displayUsername field to CoachProfile form
   - Implement validation for unique usernames
   - Add username availability checking

## Username Requirements

- Must be unique across all coaches
- 3-30 characters long
- Can contain letters, numbers, and underscores
- Cannot start with a number
- Must be URL-safe (no spaces or special characters)
- Case insensitive (stored as lowercase)
