import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();

// Stable per-line key. Same product with different size/color = different lines.
const keyOf = (productId, variantId) => `${productId}:${variantId || 'novar'}`;

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem('bv_cart');
      const parsed = raw ? JSON.parse(raw) : [];
      // Legacy items (pre-variants) had no cart_key. Backfill so they still work.
      return parsed.map((i) => ({ ...i, cart_key: i.cart_key || keyOf(i.product_id, i.variant_id) }));
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('bv_cart', JSON.stringify(items));
  }, [items]);

  /**
   * Add a product to the cart. If `variant` is provided (from ProductDetail
   * after size/color selection), the line is keyed per variant so the same
   * product in different sizes/colors show as separate cart lines.
   */
  const addItem = (product, quantity = 1, variant = null) => {
    const cart_key = keyOf(product.id, variant?.id);
    setItems((prev) => {
      const existing = prev.find((i) => i.cart_key === cart_key);
      if (existing) {
        return prev.map((i) =>
          i.cart_key === cart_key ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          cart_key,
          product_id: product.id,
          name_fr: product.name_fr,
          name_ar: product.name_ar,
          price: product.price,
          image_url: product.image_url,
          quantity,
          variant_id: variant?.id || null,
          size: variant?.size || null,
          color_name: variant?.color_name || null,
          color_hex: variant?.color_hex || null,
          variant_stock: variant?.stock ?? null,
        },
      ];
    });
  };

  const updateQuantity = (cart_key, quantity) => {
    if (quantity <= 0) return removeItem(cart_key);
    setItems((prev) =>
      prev.map((i) => (i.cart_key === cart_key ? { ...i, quantity } : i))
    );
  };

  const removeItem = (cart_key) => {
    setItems((prev) => prev.filter((i) => i.cart_key !== cart_key));
  };

  const clear = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
