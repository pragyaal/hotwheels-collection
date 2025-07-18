# Hot Wheels Collection Website

A modern, responsive static website for managing and displaying your Hot Wheels and toy car collection. Perfect for GitHub Pages hosting!

## 🚗 Features

### 📊 **Collection Management**
- **Grid & Table Views**: Switch between visual grid and detailed table layouts
- **Advanced Search & Filtering**: Find cars by name, brand, series, color, or condition
- **Detailed Car Information**: Store comprehensive details including purchase price, date, condition, and description
- **Image Support**: Upload and display car photos
- **Statistics Dashboard**: Track collection value, growth, and analytics

### 🔐 **Admin Panel**
- **Secure Access**: Password-protected admin panel with encrypted credentials
- **Easy Car Management**: Add, edit, and delete cars from your collection
- **Wishlist Management**: Track cars you want to buy
- **Data Export/Import**: Backup and restore your collection data
- **Settings Configuration**: Customize site settings and change admin password

### 📈 **Analytics & Insights**
- **Collection Statistics**: Total cars, value, average price
- **Visual Charts**: Interactive charts showing collection breakdown by brand, series, color
- **Timeline Analysis**: Track collection growth over time
- **Price Analysis**: Monitor spending patterns and expensive/cheapest items

### 💝 **Wishlist System**
- **Want List**: Keep track of cars you want to purchase
- **Expected Pricing**: Set target prices for wishlist items
- **Notes System**: Add personal notes and search criteria
- **Easy Management**: Add items to wishlist directly from admin panel

## 🛠️ **Technical Features**

### 🌐 **GitHub Pages Ready**
- **Static Website**: No server required - perfect for GitHub Pages
- **JSON Data Storage**: All data stored in JSON files
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Modern UI**: Beautiful gradient design with smooth animations

### 🔧 **Development Features**
- **Vanilla JavaScript**: No complex frameworks - easy to modify
- **Modular Structure**: Well-organized code with separate files for different features
- **Local Storage Backup**: Automatic backup to browser storage
- **Export Functionality**: Export collection to CSV or JSON

## 📁 **Project Structure**

```
website/
├── index.html              # Main collection page
├── admin.html              # Admin panel
├── statistics.html         # Analytics dashboard
├── wishlist.html           # Wishlist page
├── css/
│   ├── style.css           # Main styles
│   └── admin.css           # Admin panel styles
├── js/
│   ├── data-manager.js     # Data management and storage
│   ├── main.js             # Main collection functionality
│   ├── admin.js            # Admin panel functionality
│   ├── statistics.js       # Analytics and charts
│   └── wishlist.js         # Wishlist functionality
├── data/
│   ├── config.json         # Site configuration and settings
│   ├── cars.json           # Car collection data
│   └── wishlist.json       # Wishlist data
└── images/
    └── cars/               # Car photos directory
```

## 🚀 **Quick Start**

### 1. **Setup Repository**
1. Fork or download this repository
2. Upload to your GitHub repository
3. Enable GitHub Pages in repository settings

### 2. **Admin Access**
- **Default Password**: `hotwheels123`
- **Admin URL**: `yoursite.com/admin.html`
- **Change Password**: Go to Admin → Settings → Change Password

### 3. **Adding Your First Car**
1. Go to Admin panel
2. Enter password
3. Fill out the "Add Car" form
4. Upload car image
5. Save - your car will appear on the main page!

### 4. **Data Management**
- **Backup**: Use Admin → Settings → Export All Data
- **Images**: Save uploaded images to `/images/cars/` folder
- **JSON Files**: Keep `/data/` folder files in your repository

## 📱 **Usage Guide**

### **Main Collection Page**
- **Search**: Type in search box to find specific cars
- **Filter**: Use dropdowns to filter by brand, series, color, condition
- **Sort**: Choose sorting criteria (name, brand, price, date)
- **View**: Switch between grid and table views
- **Details**: Click any car to see full details

### **Admin Panel**
1. **Add Cars**: Complete form with car details and upload image
2. **Manage Cars**: Edit or delete existing cars
3. **Wishlist**: Add cars you want to buy
4. **Settings**: Change password, site name, export data

### **Statistics Page**
- **Overview**: See total cars, value, average price
- **Charts**: Visual breakdown of collection
- **Timeline**: Track collection growth
- **Analysis**: Price trends and insights

## 🔒 **Security Features**

### **Password Protection**
- Admin password is encrypted and stored in `config.json`
- Session-based authentication
- No sensitive data exposed in client code

### **Data Privacy**
- All data stored in your repository
- No external databases or services
- Full control over your data

## 🎨 **Customization**

### **Styling**
- Edit `css/style.css` for main theme colors
- Modify `css/admin.css` for admin panel appearance
- All colors use CSS variables for easy theming

### **Configuration**
- Site name, currency, and settings in `data/config.json`
- Add custom car fields by modifying JavaScript files
- Extend functionality with additional pages

## 📊 **Data Structure**

### **Car Object**
```json
{
  "id": 1,
  "name": "Lamborghini Huracán",
  "brand": "Hot Wheels",
  "series": "Exotics",
  "year": "2023",
  "color": "Orange",
  "scale": "1:64",
  "condition": "Mint",
  "purchasePrice": 1.97,
  "purchaseDate": "2023-06-15",
  "description": "Beautiful orange Lamborghini...",
  "image": "images/cars/lambo-huracan.jpg",
  "dateAdded": "2025-01-18T10:00:00.000Z"
}
```

### **Wishlist Item**
```json
{
  "id": 1,
  "name": "McLaren P1",
  "brand": "Hot Wheels",
  "series": "Car Culture",
  "expectedPrice": 6.99,
  "notes": "Looking for orange variant",
  "dateAdded": "2025-01-18T12:00:00.000Z"
}
```

## 🤝 **Contributing**

Feel free to:
- Report bugs or request features
- Submit pull requests
- Share your customizations
- Suggest improvements

## 📄 **License**

This project is open source and available under the MIT License.

## 🎯 **Perfect For**

- **Hot Wheels Collectors**: Track your diecast car collection
- **Toy Car Enthusiasts**: Manage any scale model collection
- **Inventory Management**: Personal collection tracking
- **GitHub Pages**: Free hosting solution
- **Learning Project**: Great example of vanilla JavaScript application

## 🌟 **Live Demo**

Visit the demo site to see all features in action!

---

**Happy Collecting!** 🏎️✨
