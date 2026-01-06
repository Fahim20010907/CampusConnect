# Admin Dashboard Implementation Guide

## Overview

A complete admin dashboard system has been implemented for the CampusConnect application. This system provides administrators with tools to manage users, events, and monitor platform activity with complete audit logging.

---

## 1. Database & Authentication

### User Model Update
✅ **Status:** Already Implemented (User model includes role field)

The User model at `backend/models/user.js` includes:
```javascript
role: { 
  type: String, 
  enum: ['student', 'faculty', 'club_coordinator', 'admin'], 
  default: 'student' 
}
```

### Admin Verification Middleware
✅ **Location:** `backend/middleware/verifyAdmin.js`

**Features:**
- Validates user ID from request headers (`x-user-id`)
- Checks if user has 'admin' role
- Returns 403 Forbidden for unauthorized access
- Logs unauthorized access attempts for security

**Usage in Routes:**
```javascript
import { verifyAdmin } from "../middleware/verifyAdmin.js";

router.use(verifyAdmin); // Protect routes
```

### Admin Logging System
✅ **Location:** `backend/middleware/verifyAdmin.js`

**Features:**
- Logs all admin actions to console and file
- File location: `backend/logs/admin-actions.log`
- Timestamp, action type, user ID, and details recorded
- Useful for audit trails and security monitoring

**Log Format:**
```
[2024-01-06T10:30:45.123Z] ACTION: DELETE_USER | USER: 507f1f77bcf86cd799439011 | DETAILS: {...}
```

---

## 2. Backend API Routes

### New Admin Routes
✅ **Location:** `backend/routes/adminRoutes.js`

#### 1. **GET /api/admin/stats**
Fetch high-level platform metrics.

**Headers:**
```
x-user-id: <user_id>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 45,
    "totalEvents": 12,
    "totalPosts": 0,
    "reportedContent": 0,
    "lastUpdated": "2024-01-06T10:30:45Z"
  }
}
```

#### 2. **GET /api/admin/reports**
View all reported content.

**Headers:**
```
x-user-id: <user_id>
```

**Response:**
```json
{
  "success": true,
  "data": [],
  "message": "Reports retrieval. Implement Report model for full functionality."
}
```

#### 3. **GET /api/admin/users**
Get all users with optional filtering.

**Query Parameters:**
- `search` - Search by name or email
- `role` - Filter by role (student, faculty, club_coordinator, admin)

**Headers:**
```
x-user-id: <user_id>
```

**Response:**
```json
{
  "success": true,
  "count": 45,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@university.edu",
      "role": "student",
      "department": "Computer Science",
      "createdAt": "2024-01-01T10:30:45Z"
    }
  ]
}
```

#### 4. **DELETE /api/admin/users/:id**
Permanently delete a user.

**Headers:**
```
x-user-id: <user_id>
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": { /* deleted user object */ }
}
```

#### 5. **DELETE /api/admin/users/:id/soft-delete**
Deactivate a user (soft delete).

**Headers:**
```
x-user-id: <user_id>
```

**Response:**
```json
{
  "success": true,
  "message": "User deactivated successfully",
  "data": { /* user object */ }
}
```

#### 6. **PUT /api/admin/users/:id/role**
Update user role.

**Headers:**
```
x-user-id: <user_id>
Content-Type: application/json
```

**Body:**
```json
{
  "role": "faculty"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User role updated successfully",
  "data": { /* updated user object */ }
}
```

#### 7. **GET /api/admin/events**
Get all events with optional filtering.

**Query Parameters:**
- `search` - Search by title or description
- `createdBy` - Filter by creator

**Headers:**
```
x-user-id: <user_id>
```

#### 8. **DELETE /api/admin/events/:id**
Delete an event.

**Headers:**
```
x-user-id: <user_id>
```

**Response:**
```json
{
  "success": true,
  "message": "Event deleted successfully",
  "data": { /* deleted event object */ }
}
```

---

## 3. Frontend Implementation

### Admin Context
✅ **Location:** `frontned/src/context/AdminContext.js`

**Features:**
- Manages admin state globally
- Fetches user role on login
- Provides `useAdmin()` hook
- Checks if user is admin

**Usage:**
```javascript
const { isAdmin, userRole, loading } = useAdmin();
```

### Protected Admin Route
✅ **Location:** `frontned/src/component/ProtectedAdminRoute.jsx`

**Features:**
- Wraps admin pages
- Redirects non-admins to home
- Redirects unauthenticated users to login
- Shows loading state

**Usage:**
```javascript
export default function AdminPage() {
  return (
    <ProtectedAdminRoute>
      {/* Page content */}
    </ProtectedAdminRoute>
  );
}
```

### Admin Layout
✅ **Location:** `frontned/src/component/AdminLayout.jsx`

**Features:**
- Sidebar navigation for admin pages
- Collapsible sidebar with icons
- Quick links to dashboard, users, events, reports
- Logout button
- Link back to main app

### Admin Dashboard Pages

#### 1. **Admin Dashboard Overview**
📍 **Location:** `frontned/src/app/admin/dashboard/page.jsx`
📍 **Route:** `/admin/dashboard`

**Features:**
- Overview statistics cards (Users, Events, Posts, Reports)
- Quick action buttons
- Admin info display
- Last updated timestamp

#### 2. **User Management**
📍 **Location:** `frontned/src/app/admin/users/page.jsx`
📍 **Route:** `/admin/users`

**Features:**
- Table of all users
- Search by name or email
- Filter by role
- Change user role
- Delete users
- Displays: Name, Email, Role, Department, Join Date, Actions

#### 3. **Event Management**
📍 **Location:** `frontned/src/app/admin/events/page.jsx`
📍 **Route:** `/admin/events`

**Features:**
- Table of all events
- Search by title or description
- Delete events
- Displays: Title, Description, Location, Date, RSVP Count, Created Date, Actions

#### 4. **Reports Management**
📍 **Location:** `frontned/src/app/admin/reports/page.jsx`
📍 **Route:** `/admin/reports`

**Features:**
- View reported content (when implemented)
- Implementation guide for Report model
- Ready for future report management features

---

## 4. Frontend Integration

### Updated Root Layout
✅ **Location:** `frontned/src/app/layout.js`

**Changes:**
- Added `AdminProvider` wrapper
- Wraps all pages with admin context

### Updated Navbar
✅ **Location:** `frontned/src/component/Navbar.jsx`

**Changes:**
- Added `useAdmin()` hook
- Shows "Admin Dashboard" link in profile dropdown for admins
- Link only appears if user has admin role

---

## 5. Security Features

### Authentication
- User ID passed via `x-user-id` header
- Role validation on every admin route
- 403 Forbidden response for unauthorized access

### Authorization
- All routes check for 'admin' role
- Middleware prevents direct API access without proper role

### Audit Logging
- All admin actions logged to console
- All admin actions logged to file (`backend/logs/admin-actions.log`)
- Includes: timestamp, action, user ID, details
- Useful for security compliance and debugging

### Constraints Met
✅ UI clearly distinguishes between Admin and User views
✅ Admin actions logged in console and file
✅ Protected routes prevent non-admin access
✅ Comprehensive error handling

---

## 6. Testing Guide

### To Promote a User to Admin
1. Use MongoDB/Database CLI
2. Update user's role field to 'admin':
```javascript
db.users.updateOne(
  { _id: ObjectId("...") },
  { $set: { role: "admin" } }
)
```

### Admin Dashboard Access
1. Login with an admin account
2. Click profile picture in navbar
3. Select "Admin Dashboard" (only visible to admins)
4. Navigate through dashboard, users, events, reports

### Test Scenarios
- ✅ Non-admin users cannot access `/admin/*` routes
- ✅ Admins can see all users and delete them
- ✅ Admins can modify user roles
- ✅ Admins can view and delete events
- ✅ All actions are logged

---

## 7. File Structure

```
backend/
├── middleware/
│   └── verifyAdmin.js          # Admin verification & logging
├── controller/
│   └── adminController.js      # Admin API logic
├── routes/
│   └── adminRoutes.js          # Admin routes
├── logs/
│   └── admin-actions.log       # Admin action logs
└── index.js                    # Updated with admin routes

frontned/
├── src/
│   ├── context/
│   │   └── AdminContext.js     # Admin state management
│   ├── component/
│   │   ├── AdminLayout.jsx     # Admin page layout
│   │   └── ProtectedAdminRoute.jsx  # Route protection
│   └── app/
│       ├── admin/
│       │   ├── dashboard/page.jsx   # Dashboard
│       │   ├── users/page.jsx       # User management
│       │   ├── events/page.jsx      # Event management
│       │   └── reports/page.jsx     # Reports
│       └── layout.js           # Updated with AdminProvider
```

---

## 8. Future Enhancements

### Report System
- Create Report model
- Add report submission endpoint
- Implement report action buttons (Approve, Reject, Delete)
- Track report history

### Advanced Features
- Audit trail with detailed timestamps
- User activity logs
- Platform analytics dashboard
- Bulk user/event management
- Ban/suspension system
- Email notifications for admin actions

### Performance
- Pagination for user/event tables
- Search optimization
- Caching for frequently accessed data

---

## 9. Environment Variables

**Ensure your `.env` file includes:**
```
MONGO_URI=your_mongodb_connection_string
PORT=5000
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 10. Support

For issues or questions:
1. Check the admin-actions.log for error details
2. Ensure user has proper admin role
3. Verify x-user-id header is being sent
4. Check network requests in browser DevTools

---

**Implementation Date:** January 6, 2026
**Status:** ✅ Complete and Ready for Use
