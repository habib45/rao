import type { CartItem, Product } from "@/types/domain";

const CART_KEY = "bestfinds_cart";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getCartItems(): CartItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function saveCartItems(items: CartItem[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addToCart(product: Product, quantity: number = 1): CartItem[] {
  const items = getCartItems();
  const existing = items.find((item) => item.product.id === product.id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ product, quantity });
  }

  saveCartItems(items);
  return items;
}

export function removeFromCart(productId: string): CartItem[] {
  const items = getCartItems().filter((item) => item.product.id !== productId);
  saveCartItems(items);
  return items;
}

export function updateCartQuantity(
  productId: string,
  quantity: number,
): CartItem[] {
  if (quantity <= 0) return removeFromCart(productId);

  const items = getCartItems();
  const item = items.find((i) => i.product.id === productId);
  if (item) {
    item.quantity = quantity;
  }
  saveCartItems(items);
  return items;
}

export function clearCart(): CartItem[] {
  if (isBrowser()) {
    localStorage.removeItem(CART_KEY);
  }
  return [];
}

export function getCartCount(): number {
  return getCartItems().reduce((sum, item) => sum + item.quantity, 0);
}
