# Admin Dashboard Setup & Quick Start

## ✅ What's Been Implemented

A complete **Admin Dashboard** system for managing users, events, and monitoring platform activity with full audit logging.

---

## 🚀 Quick Start

### 1. **Promote a User to Admin**

Connect to your MongoDB and update a user's role:

```javascript
// MongoDB CLI / Compass
db.users.updateOne(
  { email: "your-email@university.edu" },
  { $set: { role: "admin" } }
)
```

Or use MongoDB Compass:
1. Navigate to `users` collection
2. Find your user
3. Edit document
4. Change `role` from `"student"` to `"admin"`
5. Save

### 2. **Restart Backend Server**

The backend should already be running. If not:

```bash
cd backend
npm run dev
```

### 3. **Access Admin Dashboard**

1. **Login** to CampusConnect with your admin account
2. Click **Profile Picture** in navbar
3. Select **"Admin Dashboard"** (⚙️ only visible to admins)
4. You're now in the admin panel!

---

## 📊 Admin Dashboard Features

### Dashboard Overview (`/admin/dashboard`)
- **Statistics Cards**: Total Users, Events, Posts, Reports
- **Quick Actions**: Direct links to management pages
- **Admin Info**: Last updated time and admin user email

### User Management (`/admin/users`)
- 👥 **View All Users**: See all users in a table
- 🔍 **Search & Filter**: Search by name/email, filter by role
- ⚙️ **Change Role**: Promote/demote user roles
- 🗑️ **Delete Users**: Remove users from the system

### Event Management (`/admin/events`)
- 📅 **View All Events**: See all events in a table
- 🔍 **Search**: Find events by title or description
- 📊 **Event Details**: Title, location, date, RSVP count
- 🗑️ **Delete Events**: Remove inappropriate events

### Reports Management (`/admin/reports`)
- 📋 **Ready for Implementation**: Framework in place
- 📚 **Implementation Guide**: Step-by-step instructions included
- ⚠️ **Future Features**: Report approval, rejection, escalation

---

## 🔐 Security Features

✅ **Authentication**
- User ID validation via `x-user-id` header
- Role-based access control

✅ **Authorization**
- Admin role required for all admin endpoints
- 403 Forbidden for unauthorized access

✅ **Audit Logging**
- All admin actions logged to console
- All actions logged to file: `backend/logs/admin-actions.log`
- Includes: timestamp, action type, user ID, details

✅ **Protected Routes**
- Frontend routes check admin status
- Non-admins redirected to home page
- Unauthenticated users redirected to login

---

## 📁 Key Files

### Backend
```
backend/
├── middleware/verifyAdmin.js       # Admin verification & logging
├── controller/adminController.js   # Admin API logic
├── routes/adminRoutes.js           # Admin endpoints
├── logs/admin-actions.log          # Audit trail
└── index.js                        # Updated with /api/admin route
```

### Frontend
```
frontned/
├── src/context/AdminContext.js             # Admin state
├── src/component/AdminLayout.jsx           # Admin layout
├── src/component/ProtectedAdminRoute.jsx   # Route protection
├── src/app/admin/dashboard/page.jsx        # Dashboard
├── src/app/admin/users/page.jsx            # User management
├── src/app/admin/events/page.jsx           # Event management
├── src/app/admin/reports/page.jsx          # Reports page
└── src/app/layout.js                       # Updated with AdminProvider
```

---

## 🧪 Testing

### Test As Admin

1. **View Dashboard Stats**
   - Stats should show actual counts from database

2. **Manage Users**
   - Search for a user → Click "Change Role" → Update role
   - Delete a user → Confirm in dialog → User is removed
   - Check logs in `backend/logs/admin-actions.log`

3. **Manage Events**
   - View all events
   - Search for an event
   - Delete an event with confirmation

4. **Check Logs**
   ```bash
   # See logs in the file (each action is logged)
   cat backend/logs/admin-actions.log
   ```

### Test Non-Admin Access

1. Login with a non-admin user
2. Try accessing `/admin/dashboard`
   - ✅ Should redirect to home page

3. Try direct API access:
   ```bash
   curl -H "x-user-id: non-admin-user-id" \
        http://localhost:5000/api/admin/stats
   ```
   - ✅ Should return 403 Forbidden

---

## 🔗 API Endpoints

All endpoints require `x-user-id` header and admin role.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Get platform statistics |
| GET | `/api/admin/users` | Get all users (with search/filter) |
| GET | `/api/admin/events` | Get all events |
| GET | `/api/admin/reports` | Get reported content |
| PUT | `/api/admin/users/:id/role` | Update user role |
| DELETE | `/api/admin/users/:id` | Delete a user |
| DELETE | `/api/admin/users/:id/soft-delete` | Deactivate user |
| DELETE | `/api/admin/events/:id` | Delete an event |

---

## 📝 Audit Log Format

Admin actions are logged to `backend/logs/admin-actions.log`:

```
[2024-01-06T10:30:45.123Z] ACTION: DELETE_USER | USER: 507f1f77bcf86cd799439011 | DETAILS: {"deletedUser":{"id":"...","email":"...","name":"..."}}
```

---

## ⚙️ Customization

### Add More Admin Routes

1. Add controller in `backend/controller/adminController.js`
2. Add route in `backend/routes/adminRoutes.js`
3. Create frontend page in `frontned/src/app/admin/[feature]/page.jsx`
4. Wrap with `<ProtectedAdminRoute>`
5. Add link in `AdminLayout.jsx` sidebar

### Change Admin Role Options

Edit `backend/models/user.js`:
```javascript
role: { 
  type: String, 
  enum: ['student', 'faculty', 'club_coordinator', 'admin', 'superadmin'], // Add new roles
  default: 'student' 
}
```

---

## 🐛 Troubleshooting

### "Admin Dashboard" link not showing
- **Cause**: User is not an admin
- **Fix**: Update user role in database to 'admin'

### Getting 403 Forbidden on admin endpoints
- **Cause**: x-user-id header not sent or user not admin
- **Fix**: Ensure Firebase UID is passed in `x-user-id` header

### Admin actions not being logged
- **Cause**: logs directory not created
- **Fix**: Backend creates it automatically on first action

### Can't delete a user
- **Cause**: Invalid user ID or database issue
- **Fix**: Check MongoDB connection, verify user exists

---

## 📚 Documentation

For detailed API documentation, see: [ADMIN_DASHBOARD_README.md](./ADMIN_DASHBOARD_README.md)

---

## ✨ Next Steps

1. ✅ Promote yourself to admin
2. ✅ Test the dashboard
3. ✅ Review audit logs
4. 📋 Implement Report system (guide provided)
5. 📊 Add more analytics
6. 🔔 Add email notifications

---

**Status**: ✅ Ready to Use
**Created**: January 6, 2026
