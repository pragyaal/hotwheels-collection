# Hot Wheels Collection Website - Copilot Instructions

This is a static website for managing a Hot Wheels and toy car collection, designed for GitHub Pages hosting.

## Project Overview
- **Type**: Static HTML/CSS/JavaScript website
- **Purpose**: Personal inventory management for Hot Wheels/toy car collection
- **Hosting**: GitHub Pages (static hosting)
- **Data Storage**: JSON files (cars.json, wishlist.json, config.json)
- **Authentication**: Simple password-based admin access

## Key Features
1. **Collection Management**: Add, edit, delete cars with photos and details
2. **Admin Panel**: Password-protected management interface
3. **Search & Filter**: Advanced filtering by brand, series, color, condition
4. **Statistics**: Charts and analytics of collection
5. **Wishlist**: Track desired cars to purchase
6. **Export/Import**: Data backup and restore functionality
7. **Responsive Design**: Works on desktop, tablet, and mobile

## Technical Details
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Charts**: Chart.js for statistics visualization
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Inter)
- **Storage**: JSON files for persistence
- **Images**: Local file storage in /images/cars/

## Code Structure
- `data-manager.js`: Core data management and storage
- `main.js`: Main collection page functionality
- `admin.js`: Admin panel functionality
- `statistics.js`: Analytics and charts
- `wishlist.js`: Wishlist management
- `style.css`: Main styles with CSS Grid/Flexbox
- `admin.css`: Admin-specific styles

## Development Guidelines
- Use modern JavaScript (ES6+ features)
- Follow semantic HTML structure
- Use CSS custom properties for theming
- Maintain responsive design principles
- Keep code modular and well-commented
- Use consistent naming conventions

## Data Security
- Admin password is encrypted (simple base64 + character shift)
- No sensitive data exposed in client code
- All data stored in user's repository
- Session-based authentication

## GitHub Pages Deployment
- Static files only (no server-side processing)
- Automatic deployment via GitHub Actions
- All assets must be relative paths
- Data persisted in JSON files in repository

When making changes:
1. Maintain backward compatibility with existing data
2. Test on mobile devices
3. Ensure all features work without server
4. Follow the existing code patterns and style
5. Update README.md if adding new features
