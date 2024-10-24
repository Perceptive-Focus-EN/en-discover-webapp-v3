# TYPE SAFETY RULES FOR THIS PROJECT

## 1. Interfaces

## "interface LogEntry { }"

## 2. Type definitions

## "type Environment = 'dev' | 'prod';"

## 3. Utility functions

## const isValidLog = (log: unknown): log is LogEntry => { }

## 4. Type guards

## const isEnvironment = (env: string): env is Environment => { }

## To Check for Circular issues within src use both of the commands

## One command is to install if you have not and the other to run it after installing

-npm install -g madge
-madge --circular ./src

## Extended Use Case Scenarios

### A. Business Layer (as previously described)

### B. Social Media Layer

### Personal Account Creation

- Use `/api/tenant/create` to set up a personal tenant.
- Use `/api/tenant/user/create` to create the user's profile.

### Friend Connections

- Use `/api/users/connections/request` to send friend requests.
- Use `/api/users/connections/accept` to accept friend requests.

### Group Creation

- Use `/api/tenant/create-sub-tenant` to create a group within a user's personal tenant.
- Use `/api/tenant/add-user` to add friends to the group.

### Public Figure/Celebrity Accounts

- Use `/api/tenant/create` for the public figure's main account.
- Use `/api/tenant/create-sub-tenant` for different aspects (e.g., music, acting, charity work).
- Use `/api/tenant/user/create` for team members managing different aspects.

### C. Family Account Layer

### Family Account Setup

- Use `/api/tenant/create` to create the family's main account.
- Use `/api/tenant/user/create` to add adult family members.

### Child Accounts

- Use `/api/tenant/create-sub-tenant` to create supervised accounts for children.
- Use `/api/tenant/user/create` to set up profiles for children.

### Extended Family

- Use `/api/tenant/add-user` to give access to extended family members (e.g., grandparents).

### Family Group Management

- Use `/api/tenant/create-sub-tenant` for different family groups (e.g., immediate family, extended family).

### D. Institutional Layer (Universities, Schools, etc.)

### University Setup

- Use `/api/tenant/create` to set up the main university tenant.
- Use `/api/tenant/user/create` for administrative staff.

### College/Department Creation

- Use `/api/tenant/create-sub-tenant` for each college or department.
- Use `/api/tenant/user/create` for faculty and staff of each college.

### Student Enrollment

- Use `/api/tenant/user/create` to create student accounts.
- Use `/api/tenant/add-user` to give students access to relevant department sub-tenants.

### Research Groups

- Use `/api/tenant/create-sub-tenant` within department tenants for research groups.
- Use `/api/tenant/add-user` to add researchers to specific groups.

### Cross-Departmental Collaboration

- Use `/api/tenant/add-user` to give faculty access to multiple department tenants.

### Alumni Association

- Use `/api/tenant/create-sub-tenant` for the alumni association.
- Use `/api/tenant/add-user` to add graduated students to the alumni sub-tenant.

### E. Healthcare System

### Hospital Network Setup

- Use `/api/tenant/create` for the main hospital network.
- Use `/api/tenant/create-sub-tenant` for individual hospitals or clinics.
- Use `/api/tenant/user/create` for medical staff.

### Department Management

- Use `/api/tenant/create-sub-tenant` for different departments (e.g., ER, Pediatrics).
- Use `/api/tenant/add-user` to assign staff to departments.

### Patient Accounts

- Use `/api/tenant/user/create` to create patient profiles.
- Use `/api/tenant/add-user` to give patients access to relevant department portals.

