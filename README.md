# BDPADrive - Modern Word Processing Web App

A modern, cloud-based word processing application built with Node.js, Express, and Bootstrap. This application supports both guest and authenticated users with a clean, responsive interface.

## Features

### For All Users
- Modern, responsive design with Bootstrap 5
- Professional landing page with feature highlights
- Consistent navigation and footer across all pages

### For Guest Users (Unauthenticated)
- Access to home page
- Access to authentication page (login/register)
- Cannot access protected areas

### For Authenticated Users
- Personalized dashboard
- File management capabilities (coming soon)
- Search functionality (coming soon)
- Profile management (coming soon)
- Session-based authentication

## Technology Stack

- **Backend**: Node.js, Express.js
- **View Engine**: EJS templates
- **Styling**: Bootstrap 5, Font Awesome icons
- **Session Management**: express-session
- **Environment Variables**: dotenv

## Project Structure

```
├── app.js                 # Main application file
├── package.json          # Project dependencies
├── .env                  # Environment variables
├── bin/
│   └── www              # Server startup script
├── middleware/
│   ├── APIRequests.js   # API request utilities
│   └── auth.js          # Authentication middleware
├── public/
│   └── stylesheets/
│       └── style.css    # Custom CSS styles
├── routes/
│   ├── index.js         # Main routes (home, dashboard)
│   ├── users.js         # User-related routes
│   └── auth.js          # Authentication routes
└── views/
    ├── partials/        # Reusable view components
    │   ├── head.ejs     # HTML head with meta, CSS, JS
    │   ├── menu.ejs     # Navigation menu
    │   └── footer.ejs   # Footer component
    ├── index.ejs        # Home page
    ├── auth.ejs         # Login/Register page
    ├── dashboard.ejs    # User dashboard
    └── error.ejs        # Error page
```

## Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```
   BEARER_TOKEN=your_bearer_token_here
   SESSION_SECRET=your_session_secret_here
   ```

3. **Start the application:**
   ```bash
   npm start
   ```

4. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`

## Usage

### Guest Users
1. Visit the home page to see the application overview
2. Click "Get Started" or "Login / Register" to access authentication
3. Use the registration form to create a new account
4. Use the login form with existing credentials

### Authentication (Demo)
For demonstration purposes, the application accepts any non-empty credentials:
- **Login**: Enter any username and password
- **Register**: Fill in all fields with valid data

### Authenticated Users
Once logged in, users can:
1. Access their personalized dashboard
2. View account information and storage usage
3. Use quick action buttons for future features
4. Navigate using the authenticated menu options

## Middleware

### Authentication Middleware (`middleware/auth.js`)
- `requireAuth`: Protects routes that require authentication
- `redirectIfAuth`: Redirects authenticated users away from auth pages
- `guestOnly`: Ensures only guests can access certain pages

### API Requests (`middleware/APIRequests.js`)
- Utilities for making authenticated API calls
- Bearer token support for external API integration

## Views & Partials

### Partials
- **head.ejs**: HTML head section with Bootstrap, Font Awesome, and custom CSS
- **menu.ejs**: Responsive navigation with different options for guests/authenticated users
- **footer.ejs**: Professional footer with social links

### Pages
- **index.ejs**: Feature-rich landing page with hero section
- **auth.ejs**: Side-by-side login and registration forms
- **dashboard.ejs**: Comprehensive user dashboard with quick actions and file overview

## Styling

The application uses a modern design with:
- Custom gradient backgrounds
- Smooth hover effects and transitions
- Responsive layout for all screen sizes
- Professional color scheme with primary blue theme
- Card-based layouts for better content organization

## Future Enhancements

- File creation and editing functionality
- Real-time collaboration features
- Advanced search capabilities
- File sharing and permissions
- Integration with external APIs
- Cloud storage management
- User profile management
- Mobile app companion

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is part of the BDPA Cloud Services initiative for modern word processing solutions.