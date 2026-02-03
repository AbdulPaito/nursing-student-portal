# Nursing Student Portal - Tailwind CSS Refactor

A modern, professional, and fully responsive nursing student portal refactored with Tailwind CSS.

## 🎨 Design Philosophy

This refactor transforms the existing portal into a modern, clean, and professional interface inspired by **Vercel, Notion, and Stripe** design principles:

- **Clean typography** with Montserrat for headings and Open Sans for body text
- **Smooth animations** with fade-ins, slide effects, and hover transitions
- **Modern color palette** with Primary Blue (#1E90FF) and Accent Grey (#F5F5F5)
- **Glass morphism** effects and backdrop blurs
- **Responsive design** for mobile, tablet, and desktop
- **Micro-interactions** on buttons, cards, and interactive elements

## 📁 Project Structure

```
public/
├── css/
│   ├── animations.css          # Custom CSS animations and effects
│   └── style.css              # Original Bootstrap styles (backup)
├── js/
│   ├── home-tailwind.js       # Refactored home page functionality
│   └── public.js              # Shared utilities
├── admin/
│   ├── index.html             # Tailwind admin dashboard
│   ├── login.html             # Tailwind login page
│   └── admin-tailwind.js      # Admin dashboard functionality
├── images/                    # Logo and image assets
├── index.html                 # Tailwind home page
├── events.html                # Tailwind events page
├── daily-subjects.html        # Tailwind subjects page
└── announcements.html         # Tailwind announcements page
```

## ✨ Key Features

### Student Portal

1. **Home Page** (`index.html`)
   - Hero banner with countdown timer for next event
   - Animated announcements carousel with navigation dots
   - Event cards with status badges and hover effects
   - Today's subjects with color-coded type badges
   - Mini calendar with event indicators
   - Quick links with hover animations
   - Responsive mobile navigation

2. **Events Page** (`events.html`)
   - Filterable event grid (All, Upcoming, Past)
   - Search functionality
   - Color-coded status badges
   - Countdown timers for upcoming events
   - Animated card reveals

3. **Daily Subjects** (`daily-subjects.html`)
   - Day tab navigation with smooth transitions
   - Color-coded subject types:
     - Theory = Blue (#1E90FF)
     - Lab = Green (#228B22)
     - Seminar = Yellow (#DAA520)
   - Subject cards with hover effects
   - Items checklist display

4. **Announcements** (`announcements.html`)
   - Filter by priority (All, New, Important)
   - Expandable announcement cards
   - Priority badges with color coding
   - Search functionality

### Admin Dashboard

1. **Login Page** (`admin/login.html`)
   - Modern card design with gradient header
   - Password visibility toggle
   - Shake animation on error
   - Loading spinner during authentication
   - Responsive layout

2. **Dashboard** (`admin/index.html`)
   - Collapsible sidebar navigation
   - Animated stat cards with counters
   - Analytics chart (Chart.js)
   - Recent activity feed
   - Mobile-responsive hamburger menu

3. **CRUD Management**
   - **Events**: Add, Edit, Delete with modal forms
   - **Daily Subjects**: Manage weekly schedule
   - **Announcements**: Create and manage notices
   - Color-coded action buttons:
     - Add = Green
     - Edit = Orange
     - Delete = Red
   - Toast notifications for feedback

## 🎭 Animations & Effects

All animations are defined in `public/css/animations.css`:

### Entrance Animations
- `animate-fade-in` - Fade in with upward movement
- `animate-fade-in-up` - Fade in from below
- `animate-slide-in-right` - Slide in from right
- `animate-slide-in-left` - Slide in from left
- `animate-scale-in` - Scale up with fade

### Interactive Effects
- `hover-scale` - Scale up on hover with shadow
- `hover-lift` - Lift up with enhanced shadow
- `hover-glow` - Glow effect on hover
- `card-tilt` - 3D tilt effect

### Utility Animations
- `animate-pulse` - Pulsing animation for logos
- `animate-pulse-glow` - Pulsing glow effect
- `animate-float` - Floating animation
- `animate-shake` - Shake animation for errors

### Scroll Effects
- `scroll-reveal` - Fade in elements as they enter viewport
- Smooth scroll behavior enabled globally

## 🎨 Color System

### Primary Colors
```css
--primary: #1E90FF        /* Main brand color */
--primary-dark: #1873CC   /* Hover/Active state */
--primary-light: #4da3ff  /* Lighter accents */
```

### Subject Type Colors
```css
--theory: #1E90FF   /* Blue */
--lab: #228B22      /* Green */
--seminar: #DAA520  /* Yellow/Gold */
```

### Admin Action Colors
```css
--add: #22C55E      /* Green */
--edit: #F97316     /* Orange */
--delete: #EF4444   /* Red */
```

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

All pages are fully responsive with mobile-first design.

## 🚀 Key Enhancements

### Performance
- Tailwind CSS via CDN for fast loading
- Minimal custom CSS (animations only)
- Optimized JavaScript with async/await

### Accessibility
- Semantic HTML5 elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus states on all interactive elements

### User Experience
- Loading spinners for async operations
- Toast notifications for feedback
- Smooth transitions between states
- Backdrop blur on modals
- Hover states on all interactive elements

## 🔧 Development Notes

### Tailwind Configuration
The Tailwind config is embedded in each HTML file for customization:

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1E90FF', dark: '#1873CC', light: '#4da3ff' },
        theory: '#1E90FF',
        lab: '#228B22',
        seminar: '#DAA520',
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['Open Sans', 'sans-serif'],
      }
    }
  }
}
```

### Animation Usage
Add animation classes to elements:

```html
<div class="animate-fade-in scroll-reveal hover-scale">
  <!-- Content -->
</div>
```

### Modal System
Custom modal implementation with backdrop blur:

```javascript
// Open modal
openModal('modalId');

// Close modal
closeModal('modalId');
```

## 🎯 Browser Support

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

## 📦 Dependencies

- Tailwind CSS (CDN)
- Bootstrap Icons (CDN)
- Google Fonts (Montserrat, Open Sans)
- Chart.js (Admin dashboard only)

## 🔄 Migration from Bootstrap

The original Bootstrap files have been preserved:
- `public/css/style.css` - Original styles
- `public/js/home.js` - Original home page script
- `public/admin/admin.css` - Original admin styles
- `public/admin/admin.js` - Original admin script

To revert to Bootstrap, simply restore the original file references in each HTML file.

## 📝 Customization Guide

### Changing Primary Color
Edit the Tailwind config in each HTML file:

```javascript
colors: {
  primary: { DEFAULT: '#YOUR-COLOR', dark: '#DARKER-VARIANT', light: '#LIGHTER-VARIANT' }
}
```

### Adding New Animations
Add to `public/css/animations.css`:

```css
@keyframes yourAnimation {
  from { /* start state */ }
  to { /* end state */ }
}

.animate-your-animation {
  animation: yourAnimation 0.5s ease-out;
}
```

### Modifying Toast Notifications
Edit the toast function in admin-tailwind.js:

```javascript
function toast(message, type) {
  // Customize appearance here
}
```

## 🤝 Credits

- Design inspiration: Vercel, Notion, Stripe
- Icons: Bootstrap Icons
- Fonts: Google Fonts (Montserrat, Open Sans)
- CSS Framework: Tailwind CSS

## 📄 License

This project is part of the Nursing Student Portal educational system.
