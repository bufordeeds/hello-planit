# Changelog

All notable changes to Planit will be documented in this file.

## [Unreleased] - Current Production Version

###  Completed Features

#### Authentication System

- **Google OAuth Integration** - Users can sign in with Google accounts
- **Email/Password Authentication** - Traditional signup and login flow
- **User Profile Management** - Display names, avatars, and user initials
- **Session Management** - Persistent authentication across page reloads
- **Password Reset** - Forgot password functionality via email
- **Protected Routes** - Authentication required for event access

#### Event Management (CRUD)

- **Event Creation** - Full wizard with templates (General, Birthday, Vacation, Business, Wedding, Party, Weekend)
- **Event Editing** - Complete event metadata updates including dates, descriptions, and settings
- **Event Deletion** - Secure event removal with confirmation
- **Event Viewing** - Individual event pages with full details
- **Event Sharing** - Secure link sharing requiring authentication
- **Event Templates** - Pre-configured event types with appropriate settings

#### User Interface

- **Responsive Design** - Mobile-friendly layout with adaptive components
- **Dashboard** - Event listing with status indicators (Upcoming, In Progress, Completed, Unknown)
- **Navigation** - Header with user menu, sign-in/sign-up flows
- **Modal System** - Edit, share, and authentication modals
- **Loading States** - Proper loading indicators throughout the app
- **Error Handling** - User-friendly error messages and validation

#### Data Management

- **Firebase Realtime Database** - Real-time event data synchronization
- **Multi-tenant Architecture** - User-specific event isolation
- **Role-based Permissions** - Owner, Admin, Editor, Member, Viewer roles
- **Data Validation** - Client and server-side validation rules
- **Date Handling** - Proper date parsing and status calculation

#### Deployment & Analytics

- **Vercel Deployment** - Production deployment at https://www.hello-planit.com/
- **Vercel Analytics** - User behavior and performance tracking
- **Environment Configuration** - Separate dev/prod Firebase configurations
- **Domain Authorization** - Proper OAuth domain setup for production

### Technical Improvements

#### Server-Side Rendering (SSR) Fixes

- **Firebase Initialization** - Proper browser-only Firebase setup
- **Navigation Guards** - Server-safe routing with authentication checks
- **Document Access** - Browser-only DOM manipulation
- **Authentication Flow** - Redirect handling for shared event links

#### Security Enhancements

- **Config Sanitization** - Environment variable trimming to prevent malformed URLs
- **Authentication Requirements** - All event access requires user accounts
- **Database Rules** - Secure Firebase rules for data access control
- **Error Handling** - Secure error messages without sensitive data exposure

### Recent Fixes (Production Issues Resolved)

- **Google Sign-in Errors** - Fixed malformed URLs caused by newlines in environment variables
- **Event Status Display** - Fixed date parsing for "UNKNOWN" status issue
- **Shared Event Loading** - Fixed authentication loading states for shared links
- **Reactive Loading** - Improved event loading when authentication state changes

### Latest Updates - Phase 4 Week 1-2 (Core Feature Implementation)

#### Week 1: Meal Planning Implementation (Completed)

- **Firebase Meal Service** - Complete meal CRUD operations with real-time synchronization
- **Meal Planning Tab** - Enabled functional Meals tab in event detail pages
- **Template-Based Meal Slots** - Dynamic meal slots based on event type (breakfast/lunch/dinner for general, appetizers/main/dessert for parties, etc.)
- **Event-Type Days** - Dynamic days based on event type (Fri/Sat/Sun for weekends, party-day for parties, etc.)
- **User Permissions** - Proper edit permissions based on user roles and event settings
- **Real-time Updates** - Live meal synchronization across all users viewing the event

#### Week 2: Expense Tracking Implementation (Completed)

- **Firebase Expense Service** - Complete expense CRUD operations with real-time synchronization
- **Expense Tracking Tab** - Enabled functional Expenses tab in event detail pages
- **Smart Expense Splitting** - Support for "all members" or "selected members" expense splitting
- **Settlement Calculations** - Automatic "who owes who" calculations with minimum transactions
- **Member Balance Tracking** - Real-time balance updates showing who paid what and owes what
- **Venmo Integration** - Direct payment links for easy settlement (when Venmo usernames available)
- **Multi-tab Summary Interface** - Overview, Categories, Balances, and Settlements views

#### Week 3: Missing Features & UX Enhancement (Completed)

- **Itinerary Planning System** - Complete Firebase itinerary service with real-time collaborative editing
- **Itinerary Tab Integration** - Added Itinerary as first tab matching POC structure (Itinerary, Meals, Expenses, Guests)
- **Guest Invitation System** - Complete invitation lifecycle with email-based invitations, role assignment, and expiration handling
- **Event Joining Flow** - Dedicated join pages with automatic invitation detection and acceptance workflow
- **Dashboard Invitation Detection** - Automatic display of pending invitations on user dashboard
- **Guest Management Interface** - Full guest management with member lists, pending invitations, and role-based permissions
- **Enhanced Meal Interaction** - Clickable meal cards with visual feedback and improved delete button visibility
- **Member Assignment Dropdown** - Meal assignment now uses member dropdown instead of text input
- **Real-time Invitation Updates** - Live invitation status updates and automatic cleanup of accepted invitations
- **Terminology Updates** - Changed "Members" to "Guests" throughout the application for better clarity

---

## Development Timeline

**Phase 1** (Completed): Core Authentication & Event CRUD

- User authentication system
- Basic event creation, editing, deletion
- Firebase integration and deployment

**Phase 2** (Completed): Enhanced Features & Production Deployment

- Event sharing with secure authentication
- Date picker implementation
- Modal-based editing interface
- Production deployment and analytics

**Phase 3** (Completed): Production Stabilization

- SSR issue resolution
- Security improvements
- Authentication flow optimization
- Performance and error handling improvements

**Phase 4 Week 1-2** (Completed): Core Feature Implementation

- Firebase meal service with real-time synchronization
- Firebase expense service with smart splitting and settlements
- Enabled Meals and Expenses tabs in event detail pages
- Template-based meal slots and days
- User permission-based editing
- Venmo integration for easy payments

**Phase 4 Week 3** (Completed): Missing Features & UX Enhancement

- Itinerary planning system with Firebase integration
- Complete guest invitation and joining system
- Enhanced meal interaction and assignment features
- Real-time invitation detection and management
- Mobile-optimized interface improvements
