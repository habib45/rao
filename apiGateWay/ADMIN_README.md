# ORH API Gateway - Admin Login & JWT Token Management

A modern, secure, and professional admin interface for managing JWT tokens for domain authorization in the ORH API Gateway.

## 🎯 Features

### Admin Authentication
- **Secure Login**: Email/Username and password authentication
- **Remember Me**: Extended session (30 days vs 7 days)
- **Forgot Password**: Email-based password reset with secure tokens
- **Account Lockout**: Automatic temporary lock after 5 failed attempts (15 minutes)
- **Session Management**: Secure HTTP-only cookies with JWT tokens
- **Audit Logging**: All authentication events are logged for security monitoring

### JWT Token Management
- **Token Generation**: Create JWT tokens for specific domains and usernames
- **Custom Expiration**: Set token expiration from 1 to 365 days
- **Token Status**: Active, Deactivated, or Expired
- **Token Actions**:
  - Copy token to clipboard
  - View token details
  - Deactivate tokens
  - Reactivate deactivated tokens
  - Delete tokens permanently
- **Usage Tracking**: Track token usage count and last used timestamp

### Security Features
- **CSRF Protection**: Secure cookie handling
- **Role-Based Access Control (RBAC)**: Super Admin, Admin, Editor roles
- **JWT Signing**: Secure token generation with configurable secret
- **Password Hashing**: bcrypt with salt rounds
- **Audit Logs**: Complete audit trail for all actions
- **Secure Session Handling**: HTTP-only, SameSite, secure cookies

### UI/UX Design
- **Modern SaaS Dashboard**: Clean, professional interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Automatic theme detection
- **Bootstrap 5**: Modern, accessible components
- **Smooth Animations**: Professional transitions and hover effects
- **Toast Notifications**: Real-time feedback for user actions
- **Modal Dialogs**: Confirmation dialogs for destructive actions

## 📋 Tech Stack

### Backend
- **Runtime**: Node.js with ES modules
- **Framework**: Express.js
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Database**: MySQL 8.0 with mysql2
- **Validation**: Zod
- **Security**: CORS, cookie-parser

### Frontend
- **Framework**: Bootstrap 5.3.2
- **Icons**: Bootstrap Icons 1.11.1
- **JavaScript**: Vanilla ES6+
- **Styling**: Custom CSS with CSS variables

## 🚀 Setup Instructions

### 1. Database Setup

Run the admin schema SQL file to create the required tables:

```bash
mysql -u your_user -p your_database < apiGateWay/mysql/admin_schema.sql
```

This will create:
- `admin_users` - Admin user accounts
- `jwt_tokens` - JWT token storage
- `audit_logs` - Security audit trail
- `password_reset_tokens` - Password reset tokens

### 2. Environment Configuration

Update your `.env` file with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=orh_bestfinds

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production

# API Secret (for existing admin routes)
API_SECRET=your_api_secret

# Server Configuration
PORT=4000
NODE_ENV=development
```

### 3. Default Admin User

The schema includes a default admin user:
- **Username**: admin
- **Email**: admin@orh.com
- **Password**: Admin@123

⚠️ **IMPORTANT**: Change this password immediately after first login!

### 4. Install Dependencies

```bash
cd apiGateWay
npm install
```

### 5. Start the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### 6. Access the Admin Interface

- **Login Page**: http://localhost:4000/admin/login.html
- **Dashboard**: http://localhost:4000/admin/dashboard.html

## 📁 Project Structure

```
apiGateWay/
├── mysql/
│   └── admin_schema.sql          # Database schema for admin features
├── public/
│   └── admin/
│       ├── login.html            # Login page
│       ├── dashboard.html        # Main dashboard
│       └── js/
│           └── dashboard.js      # Dashboard JavaScript
├── src/
│   ├── middleware/
│   │   └── auth.js               # Authentication middleware
│   ├── routes/
│   │   ├── auth.js               # Authentication endpoints
│   │   └── tokens.js             # Token management endpoints
│   └── index.js                  # Main Express server
└── package.json
```

## 🔌 API Endpoints

### Authentication

#### POST /api/auth/login
Login to the admin panel.

**Request Body:**
```json
{
  "email": "admin@orh.com",
  "password": "Admin@123",
  "rememberMe": false
}
```

**Response:**
```json
{
  "id": "user-id",
  "email": "admin@orh.com",
  "role": "super_admin",
  "name": "System Administrator",
  "username": "admin"
}
```

#### GET /api/auth/me
Get current authenticated user.

**Response:**
```json
{
  "id": "user-id",
  "email": "admin@orh.com",
  "role": "super_admin",
  "name": "System Administrator",
  "username": "admin"
}
```

#### POST /api/auth/logout
Logout from the admin panel.

**Response:**
```json
{
  "success": true
}
```

#### POST /api/auth/forgot-password
Request a password reset link.

**Request Body:**
```json
{
  "email": "admin@orh.com"
}
```

**Response:**
```json
{
  "message": "If the email exists, a reset link has been sent.",
  "resetToken": "token-in-development-only",
  "resetLink": "http://localhost:4000/admin/reset-password?token=..."
}
```

#### POST /api/auth/reset-password
Reset password with a valid token.

**Request Body:**
```json
{
  "token": "reset-token",
  "newPassword": "NewSecurePassword123!"
}
```

**Response:**
```json
{
  "message": "Password has been reset successfully"
}
```

### Token Management

#### GET /api/tokens
Get all tokens for the current admin user.

**Response:**
```json
{
  "tokens": [
    {
      "id": "token-id",
      "username": "api_user",
      "domain": "example.com",
      "issued_at": "2024-01-15T10:00:00.000Z",
      "expiration_at": "2024-02-15T10:00:00.000Z",
      "status": "active",
      "last_used_at": "2024-01-20T15:30:00.000Z",
      "usage_count": 15,
      "created_at": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

#### POST /api/tokens
Generate a new JWT token.

**Request Body:**
```json
{
  "username": "api_user",
  "domain": "example.com",
  "expirationDays": 30
}
```

**Response:**
```json
{
  "id": "token-id",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "api_user",
  "domain": "example.com",
  "issued_at": "2024-01-15T10:00:00.000Z",
  "expiration_at": "2024-02-15T10:00:00.000Z",
  "status": "active"
}
```

#### PUT /api/tokens/:id/deactivate
Deactivate a token.

**Response:**
```json
{
  "message": "Token deactivated successfully"
}
```

#### PUT /api/tokens/:id/reactivate
Reactivate a deactivated token.

**Response:**
```json
{
  "message": "Token reactivated successfully"
}
```

#### DELETE /api/tokens/:id
Delete a token permanently.

**Response:**
```json
{
  "message": "Token deleted successfully"
}
```

## 🔒 Security Best Practices

### Production Deployment

1. **Change Default Credentials**: Immediately change the default admin password
2. **Strong JWT Secret**: Use a cryptographically secure random string for JWT_SECRET
3. **HTTPS Only**: Enable HTTPS in production (cookies are set to secure: true)
4. **Environment Variables**: Never commit `.env` files to version control
5. **Database Security**: Use strong database passwords and restrict access
6. **Rate Limiting**: Implement rate limiting on authentication endpoints
7. **Input Validation**: All inputs are validated using Zod schemas
8. **SQL Injection Prevention**: Use parameterized queries (mysql2)

### Token Security

- Tokens are hashed before storage (SHA-256)
- Tokens contain expiration timestamps
- Deactivated tokens cannot be reactivated if expired
- Audit logs track all token operations
- Tokens are shown only once during generation

### Password Security

- Passwords are hashed using bcrypt (10 salt rounds)
- Password reset tokens expire after 1 hour
- Account lockout after 5 failed attempts (15 minutes)
- Reset tokens can only be used once

## 🎨 UI/UX Features

### Login Page
- Modern gradient background
- Floating form labels with icons
- Remember me checkbox
- Forgot password link with modal
- Loading states with spinner
- Error and success notifications
- Responsive design for mobile

### Dashboard
- Sidebar navigation with icons
- User profile display
- Statistics cards (total, active, expiring, deactivated tokens)
- Token management table with actions
- Generate token modal
- Token details modal
- Toast notifications
- Mobile-responsive sidebar toggle

### Dark Mode
- Automatic theme detection
- Consistent color scheme
- High contrast for accessibility
- Smooth transitions

## 📊 Audit Logging

All sensitive actions are logged to the `audit_logs` table:

- LOGIN / LOGOUT
- PASSWORD_RESET_REQUEST / PASSWORD_RESET
- TOKEN_CREATED / TOKEN_DELETED
- TOKEN_DEACTIVATED / TOKEN_REACTIVATED

Each log entry includes:
- Admin user ID
- Action type
- Entity type and ID
- Details (JSON)
- IP address
- User agent
- Timestamp

## 🔧 Troubleshooting

### Login Issues

**Problem**: Cannot login with default credentials
**Solution**: 
1. Check database connection
2. Verify admin user exists in database
3. Reset password using database or create new admin user

**Problem**: Account locked
**Solution**: Wait 15 minutes or reset `locked_until` and `failed_login_attempts` in database

### Token Issues

**Problem**: Token generation fails
**Solution**: 
1. Verify JWT_SECRET is set in .env
2. Check database connection
3. Ensure user is authenticated

**Problem**: Token not accepted by API Gateway
**Solution**:
1. Verify token is active (not deactivated or expired)
2. Check domain matches
3. Verify JWT_SECRET is consistent across services

## 📝 Future Enhancements

- Email service integration for password reset
- Two-factor authentication (2FA)
- Token usage analytics dashboard
- Bulk token operations
- Token export functionality
- IP whitelist management
- Webhook notifications for token events
- Admin user management UI
- Role permissions configuration
- Token templates for common use cases

## 📄 License

This is part of the ORH BestFinds project.

## 🤝 Support

For issues or questions, please contact the development team.
