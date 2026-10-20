# 🍽️ Multi-Tenant SaaS Restaurant Platform

A modern, multi-tenant B2B SaaS web application that enables restaurant owners to manage digital menus, categories, pricing, item availability, and restaurant settings in real time. Built with React, TypeScript, Tailwind CSS, and Firebase.

## 🌐 Live Demo

**Live Website:**  https://restaurant-menu-easyaccess.lovable.app/burger2rolls

## ✨ Key Features

* **Multi-Tenant Architecture:** Supports multiple restaurants through dynamic URL-based routing, with each restaurant accessing its own menu data.
* **Role-Based Access Control (RBAC):** Separates Super Admin privileges from restaurant owner permissions.
* **Dynamic Digital Menus:** Displays restaurant-specific menus, categories, pricing, and item availability.
* **Real-Time Synchronization:** Reflects menu changes using Firebase Firestore subscriptions.
* **Restaurant Admin Dashboard:** Enables restaurant owners to manage menu items and restaurant settings.
* **CRUD Operations:** Supports creating, reading, updating, and managing menu data.
* **Firestore Security Rules:** Enforces access permissions and tenant-specific data boundaries.
* **Responsive UI:** Built with Tailwind CSS for a clean and adaptable user interface.
* **Automated Data Seeding:** Supports initializing restaurant configurations and sample menu data.

## 🛠️ Tech Stack

| Category       | Technologies                     |
| -------------- | -------------------------------- |
| Frontend       | React 18, TypeScript             |
| Styling        | Tailwind CSS                     |
| Build Tool     | Vite                             |
| Routing        | React Router v6                  |
| Icons          | Lucide React                     |
| Authentication | Firebase Authentication          |
| Database       | Cloud Firestore                  |
| Security       | Firebase Security Rules          |
| Deployment     | Add your actual hosting platform |

## 🏗️ Architecture

The application uses a multi-tenant architecture to separate restaurant access information from restaurant menu data.

```text
Multi-Tenant SaaS Platform
│
├── Customer-Facing Menu
│   └── /:restaurantId
│
├── Restaurant Admin Dashboard
│   └── /:restaurantId/admin
│
└── Firebase
    ├── Authentication
    └── Cloud Firestore
        ├── restaurant_access/{restaurantId}
        └── restaurant_data/{restaurantId}
```

### Database Structure

| Collection          | Purpose                                                |
| ------------------- | ------------------------------------------------------ |
| `restaurant_access` | Stores restaurant ownership and access information     |
| `restaurant_data`   | Stores restaurant settings, categories, and menu items |

### Access Control

* **Super Admin:** Manages platform-level operations and restaurant configurations.
* **Restaurant Owner:** Manages menu items and permitted restaurant-specific settings.
* **Public Users:** Access customer-facing restaurant menus.

Firebase Security Rules enforce permissions for database operations.

## 🔗 Dynamic Routes

| Route                  | Description                            | Access           |
| ---------------------- | -------------------------------------- | ---------------- |
| `/:restaurantId`       | Displays the restaurant's digital menu | Public           |
| `/:restaurantId/admin` | Restaurant management dashboard        | Authorized users |

The restaurant ID in the URL determines which restaurant's data is loaded.

## 🔒 Security

* Firebase Authentication for user identity.
* Firestore Security Rules for authorization.
* Tenant-specific ownership checks.
* Restricted database operations based on user roles.
* Separate collections for restaurant access and restaurant data.

## 📸 Screenshots

Restaurant Menu
[Screenshot 2026-10-20 151611.png]

Super Admin Dashboard
[Screenshot 2026-10-20 151451.png]

## 🚀 Future Improvements

* Restaurant analytics and menu performance insights.
* Enhanced inventory and availability management.
* Additional restaurant customization options.
* Improved onboarding for new restaurant owners.

## 👨‍💻 About the Project

Developed as a full-stack SaaS project to explore multi-tenant architecture, role-based access control, real-time database synchronization, and secure cloud-based application development.


