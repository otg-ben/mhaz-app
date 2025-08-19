# MHAZ Database Schema

This document describes the database schema for the MHAZ (Marin Hazard Alert Zone) trail alerts application.

## Overview

The database uses PostgreSQL with Supabase and consists of two main tables:
- `profiles` - User profile information
- `alerts` - Trail alerts and incidents

## Tables

### profiles

Stores user profile information, linked to Supabase Auth users.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, references auth.users(id) |
| email | TEXT | User email address (unique) |
| username | TEXT | Display username (unique) |
| location | TEXT | Optional user location |
| created_at | TIMESTAMPTZ | Account creation timestamp |
| updated_at | TIMESTAMPTZ | Last profile update timestamp |

### alerts

Stores all trail alerts, incidents, and citations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| type | alert_type | Alert type: 'Trail', 'LEO', or 'Citation' |
| status | alert_status | Alert status: 'Active' or 'Resolved' |
| category | TEXT | Alert category (Obstruction, Hazard, etc.) |
| location | TEXT | Human-readable location description |
| description | TEXT | Detailed alert description |
| reported_by | UUID | Foreign key to profiles(id) |
| reported_at | TIMESTAMPTZ | When alert was reported |
| latitude | DECIMAL(10,8) | GPS latitude coordinate |
| longitude | DECIMAL(11,8) | GPS longitude coordinate |
| photos | TEXT[] | Array of photo URLs |
| resolved_at | TIMESTAMPTZ | When alert was resolved (if applicable) |
| resolved_by | UUID | Who resolved the alert (if applicable) |
| citation_date | DATE | Citation date (Citation alerts only) |
| citation_time | TIME | Citation time (Citation alerts only) |
| agency | TEXT | Issuing agency (Citation alerts only) |
| created_at | TIMESTAMPTZ | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

## Enums

### alert_type
- `Trail` - Trail conditions, obstructions, hazards
- `LEO` - Law enforcement activities, safety notices  
- `Citation` - Traffic citations, parking tickets

### alert_status
- `Active` - Alert is current and relevant
- `Resolved` - Alert has been resolved or is no longer relevant

## Constraints

### Geographic Constraints
- Coordinates must be valid: latitude [-90, 90], longitude [-180, 180]
- Location must be within Marin County bounds (with 2-mile buffer):
  - Latitude: 37.85 to 38.35
  - Longitude: -122.95 to -122.35

### Business Logic Constraints
- Citation alerts must have `citation_date` and `agency`
- Resolved alerts must have `resolved_at` and `resolved_by`

## Indexes

Performance indexes are created on:
- `alerts.type` - Filter by alert type
- `alerts.status` - Filter by active/resolved status
- `alerts.latitude, longitude` - Geographic queries
- `alerts.reported_at` - Chronological sorting
- `alerts.reported_by` - User's alerts

## Row Level Security (RLS)

### Profiles
- Anyone can view all profiles
- Users can only update their own profile
- Users can only insert their own profile

### Alerts
- Anyone can view all alerts (public information)
- Authenticated users can create alerts
- Users can update their own alerts
- Any authenticated user can resolve Trail alerts
- Only alert creator can update LEO/Citation alerts

## Triggers

- Auto-update `updated_at` timestamps on record changes
- Auto-create profile record when new user signs up via Auth

## Usage Examples

### Creating an Alert
```sql
INSERT INTO alerts (type, category, location, description, latitude, longitude, reported_by)
VALUES ('Trail', 'Obstruction', 'Mount Tam - Rock Spring Trail', 'Fallen tree blocking path', 37.9063, -122.5969, auth.uid());
```

### Finding Nearby Active Alerts
```sql
SELECT * FROM alerts 
WHERE status = 'Active' 
  AND latitude BETWEEN 37.8 AND 38.0
  AND longitude BETWEEN -122.7 AND -122.4
ORDER BY reported_at DESC;
```

### Resolving a Trail Alert
```sql
UPDATE alerts 
SET status = 'Resolved', resolved_at = NOW(), resolved_by = auth.uid()
WHERE id = 'alert-uuid' AND type = 'Trail' AND status = 'Active';
```

## Migration Files

1. `001_initial_schema.sql` - Creates tables, constraints, indexes, RLS policies
2. `002_sample_data.sql` - Sample data for development
3. `seed.sql` - Realistic test data with Marin County locations

## Environment Setup

Set these environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key