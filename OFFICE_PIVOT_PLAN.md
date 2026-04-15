# Office Use Case Plan

## Goal
Create an enterprise-grade office access use case alongside the existing hotel management product.

The hotel system remains intact. The office use case should reuse the shared technical foundation that already works:

- TTLock integration
- Lock provisioning
- Passcode and card credential flows
- Authentication and roles
- Audit logging
- Mobile Android dev-client workflow

## Product Strategy
This is not a replacement project.

We will keep:

- Hotel management as one business module
- Office access control as a second business module
- Shared infrastructure for locks, credentials, auth, and auditing

The architecture direction is:

- `Shared platform layer`
- `Hotel domain layer`
- `Office domain layer`

## What Stays Unchanged
The following hotel features should continue to exist:

- Reservations
- Check-in and check-out
- Rooms
- Housekeeping
- Maintenance
- Hotel dashboard and operations screens

## What Office Adds
The office use case should support:

- Employee access to offices, meeting rooms, and secure zones
- Visitor and contractor temporary access
- Time-bound passcodes and cards
- Department-based or role-based access
- Security and facility operations visibility
- Access event history and credential revocation

## Shared Core
These modules should be treated as cross-domain platform capabilities:

- `locks`
- `lock-keys`
- TTLock programming flows
- auth and role enforcement
- audit logs

These should serve both hotel and office use cases.

## Office Domain Model

### Core entities
- `Organization`
- `Site`
- `Floor`
- `Space`
- `AccessPoint`
- `Person`
- `Department`
- `Visit`
- `Credential`
- `AccessPolicy`
- `AccessEvent`

### Person types
- `EMPLOYEE`
- `VISITOR`
- `CONTRACTOR`
- `SECURITY`
- `FACILITY_ADMIN`

### Credential types
- `PASSCODE`
- `CARD`
- `FINGERPRINT`
- `EKEY`

## Relationship To Current System

### Reuse directly
- Lock registration screens
- Lock detail and lock control screens
- Lock key lifecycle
- Passcode programming
- Card programming

### Keep for hotel only
- Reservations
- Check-in and check-out semantics
- Room availability workflows
- Housekeeping workflows

### Build separately for office
- Spaces
- People
- Visitors
- Access issuance
- Access revocation
- Access logs

## Backend Direction
Add office-specific models and routes without removing hotel routes.

Recommended new office modules:

- `spaces`
- `people`
- `visits`
- `access-policies`
- `access-events`

Keep using:

- `locks`
- `lock-keys`

Where needed, expand shared models so they can reference either hotel or office entities cleanly.

## Mobile App Direction
Do not rename the hotel app flows in place.

Instead, add an office section or office mode that includes:

- Office dashboard
- Spaces list
- People list
- Visitor access issuance
- Credential revoke flow
- Access activity timeline

The lock setup screens can be reused with minimal change.

## Recommended Rollout

### Phase 1: Shared platform cleanup
- Stabilize shared lock and credential flows
- Keep hotel behavior unchanged
- Identify which APIs are shared versus hotel-only

### Phase 2: Office backend foundation
- Add `Space`, `Person`, and `Visit` models
- Add office routes
- Reuse `locks` and `lock-keys`

### Phase 3: Office mobile foundation
- Add office navigation entry
- Add spaces, people, and visitor issuance screens
- Reuse TTLock credential programming

### Phase 4: Enterprise controls
- Access schedules
- Department-based permissions
- Multi-site support
- Compliance and audit reporting

## First Milestone
Build an `Office Access Foundation` while keeping hotel untouched.

Scope:

- Office dashboard
- Spaces list and space detail
- People list
- Visitor pass issuance
- Passcode and card programming
- Credential revoke flow

## Working Rule
Treat hotel and office as two parallel use cases on one shared lock platform.

Do not replace hotel modules unless we explicitly choose to later.
