# Coaches Route Specification - Remaining Tasks

## Components to Implement

### 1. CoachFilters Component

A sidebar or dropdown component for filtering coaches:
- Specialties multi-select
- Teaching styles multi-select
- Rate range slider
- Verification toggle
- Sort options

### 2. Additional Coach Detail Features

- Booking interface
- Reviews section
- Header image support

## Profile Management

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

## Search Functionality

- Implement search functionality in the UI
- Connect search to the existing API endpoint
