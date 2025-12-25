
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  CASHIER = 'CASHIER',
  WAITER = 'WAITER'
}

export enum BranchType {
  RESTAURANT = 'RESTAURANT',
  FOOD_CART = 'FOOD_CART'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  COOKING = 'COOKING',
  READY = 'READY',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
  CARD = 'CARD'
}

export interface User {
  id: string;
  name: string;
  role: Role;
  assignedBranchIds: string[];
  username: string;
  password?: string;
  salary?: number;
  advanceLimit?: number;
  walletBalance?: number;
  permissions?: string[]; // List of navigation IDs the user can access
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  createdAt: number;
  read: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface Branch {
  id: string;
  name: string;
  type: BranchType;
  address: string;
  profitMargin: number; // e.g., 40 means 40% profit, 60% costing
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  category: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  unit: 'kg' | 'pcs' | 'liter';
  costPrice: number;
  currentStock: number;
  supplierId: string;
  minStock: number;
}

export interface Variant {
  id: string;
  name: string;
  price: number;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  branchPrices?: BranchPriceOverride[];
}

export interface BranchPriceOverride {
  branchId: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string; 
  price: number;
  description: string;
  image: string;
  variants?: Variant[];
  addOns?: string[]; 
  recipe?: RecipeIngredient[];
  allowedBranchIds: string[]; // Branches that can sell this item
  branchPrices?: BranchPriceOverride[]; // Price overrides per branch
}

export interface RecipeIngredient {
  rawMaterialId: string;
  quantity: number;
}

export interface OrderItem {
  id: string; 
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  variant?: Variant;
  addOns: AddOn[];
}

// 🔹 NEW FEATURE START
export interface PromoCode {
  id: string;
  code: string;
  type: 'FIXED' | 'PERCENT';
  value: number;
  minOrderAmount?: number;
}
// 🔹 NEW FEATURE END

export interface Order {
  id: string;
  branchId: string;
  tableNumber?: string;
  counterNumber?: string;
  items: OrderItem[];
  subtotal: number;
  vat: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  customerPhone?: string;
  customerName?: string;
  createdAt: number;
  userId: string;
  // 🔹 NEW FEATURE START
  loyaltyPointsEarned?: number;
  loyaltyPointsRedeemed?: number;
  promoCodeUsed?: string;
  promoDiscount?: number;
  // 🔹 NEW FEATURE END
}

export interface AccountingEntry {
  id: string;
  date: number;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  branchId: string;
}

export interface WastageEntry {
  id: string;
  rawMaterialId: string;
  quantity: number;
  reason: 'SPOILED' | 'DAMAGED' | 'EXPIRED' | 'OTHER';
  note?: string;
  date: number;
}

export interface SystemSettings {
  appName: string;
  currencySymbol: string;
  currencyCode: string;
  logoUrl?: string;
  vatPercentage: number;
  defaultDiscount: number;
  // 🔹 NEW FEATURE START
  promoCodes?: PromoCode[];
  // 🔹 NEW FEATURE END
}
