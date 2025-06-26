# Teacher Integration

This document explains how the Teacher model integrates with the Staff model in the system.

## Overview

The system now has a Teacher model that extends the Staff model with teacher-specific fields. This allows:

1. Creating teachers from either the Staff Management page or the Teachers page
2. Storing additional teacher-specific information like qualifications, experience, etc.
3. Maintaining a single source of truth for user data

## Models

### Staff Model
The Staff model contains basic information about all staff members, including:
- Personal information (name, contact details, etc.)
- Employment details (hire date, status, etc.)
- Financial information (salary, bank details, etc.)

### Teacher Model
The Teacher model extends the Staff model with:
- Academic information (qualification, experience, primary subject)
- Additional financial details (PAN number, IFSC code)
- Leave balances (sick leave, casual leave)
- Tax and deduction information

## API Endpoints

- `/teachers/` - For creating and listing teachers
- `/teachers/<id>/` - For retrieving, updating, and deleting specific teachers
- `/teachers/<id>/upload_documents/` - For uploading teacher documents

## Frontend Integration

### Staff Management Page
- When adding a staff member with role "teacher", the system creates both a Staff record and a Teacher record
- The Staff Management page can handle both regular staff and teachers

### Teachers Page
- Dedicated page for managing teachers
- Provides teacher-specific fields and functionality
- Uses the same backend API for consistency

## How to Use

### Adding a Teacher from Staff Management
1. Go to Staff Management
2. Click "Add New Staff"
3. Fill in the required fields
4. Select "teacher" as the role
5. Submit the form

### Adding a Teacher from Teachers Page
1. Go to Teachers
2. Click "Add New Teacher"
3. Fill in the required fields
4. Submit the form

## Implementation Details

- One-to-one relationship between Staff and Teacher models
- Shared user credentials
- Consistent status management
- Integrated leave management