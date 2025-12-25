
import React from 'react';
import { LayoutDashboard, ShoppingCart, Package, Users, BarChart3, Settings, BookOpen, Warehouse, Wallet, UserCircle, MapPin } from 'lucide-react';

export const DEFAULT_SETTINGS = {
  appName: 'RR Restro POS',
  currencySymbol: '৳',
  currencyCode: 'TK',
  vatPercentage: 0,
  defaultDiscount: 0,
  // 🔹 NEW FEATURE START
  promoCodes: [
    { id: 'p1', code: 'FIRST10', type: 'PERCENT', value: 10, minOrderAmount: 0 },
    { id: 'p2', code: 'SAVETK50', type: 'FIXED', value: 50, minOrderAmount: 300 },
  ],
  // 🔹 NEW FEATURE END
};

export const INITIAL_CATEGORIES = [
  { id: 'cat1', name: 'Burgers' },
  { id: 'cat2', name: 'Pizza' },
  { id: 'cat3', name: 'Beverages' },
  { id: 'cat4', name: 'Snacks' },
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'pos', label: 'POS Terminal', icon: <ShoppingCart size={20} /> },
  { id: 'orders', label: 'Order History', icon: <BookOpen size={20} /> },
  { id: 'branches', label: 'Branches', icon: <MapPin size={20} /> },
  { id: 'inventory', label: 'Inventory', icon: <Warehouse size={20} /> },
  { id: 'menu', label: 'Menu Setup', icon: <Package size={20} /> },
  { id: 'customers', label: 'Customers', icon: <Users size={20} /> },
  { id: 'staff', label: 'Staff Management', icon: <UserCircle size={20} /> },
  { id: 'accounting', label: 'Accounting', icon: <Wallet size={20} /> },
  { id: 'reports', label: 'Reports', icon: <BarChart3 size={20} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  { id: 'wallet', label: 'My Wallet', icon: <Wallet size={20} /> },
];

export const MOCK_BRANCHES = [
  { id: 'b1', name: 'Main Branch - Dhaka', type: 'RESTAURANT', address: 'Banani, Block C', profitMargin: 40 },
  { id: 'b2', name: 'Cart #01 - Gulshan', type: 'FOOD_CART', address: 'Gulshan 2 Circle', profitMargin: 35 },
];

export const MOCK_SUPPLIERS = [
  { id: 's1', name: 'Fresh Farm Ltd.', phone: '01712345678', category: 'Meat & Poultry' },
  { id: 's2', name: 'Daily Dairy', phone: '01812345679', category: 'Dairy' },
];

export const MOCK_MENU_ITEMS = [
  { 
    id: 'm1', 
    name: 'Classic Beef Burger', 
    category: 'Burgers', 
    price: 350, 
    image: 'https://picsum.photos/400/300?random=1',
    description: 'Juicy beef patty with special sauce.',
    variants: [
      { id: 'v1', name: 'Regular', price: 0 },
      { id: 'v2', name: 'Double Patty', price: 150 },
    ],
    addOns: ['a1', 'a2'],
    recipe: [],
    allowedBranchIds: ['b1', 'b2']
  },
  { 
    id: 'm2', 
    name: 'Cheesy Margherita', 
    category: 'Pizza', 
    price: 550, 
    image: 'https://picsum.photos/400/300?random=2',
    description: 'Fresh mozzarella and tomato sauce.',
    variants: [
      { id: 'v3', name: 'Small (8")', price: 0 },
      { id: 'v4', name: 'Medium (12")', price: 200 },
    ],
    addOns: ['a3'],
    recipe: [],
    allowedBranchIds: ['b1']
  },
];

export const MOCK_ADDONS = [
  { id: 'a1', name: 'Extra Cheese', price: 50 },
  { id: 'a2', name: 'Jalapenos', price: 30 },
  { id: 'a3', name: 'Extra Sauce', price: 20 },
];
