import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newProduct = products.find(savedProduct => savedProduct.id === id);
      const savedProducts = products.filter(
        savedProduct => savedProduct.id !== id,
      );

      if (newProduct) {
        newProduct.quantity += 1;

        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(products),
        );

        setProducts([...savedProducts, newProduct]);
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProduct = products.find(savedProduct => savedProduct.id === id);
      const savedProducts = products.filter(
        savedProduct => savedProduct.id !== id,
      );

      if (newProduct && newProduct.quantity > 1) {
        newProduct.quantity -= 1;

        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(products),
        );

        setProducts([...savedProducts, newProduct]);
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productIndex = products.findIndex(
        savedProduct => savedProduct.id === product.id,
      );

      if (productIndex === -1) {
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify([...products, { ...product, quantity: 1 }]),
        );

        setProducts([...products, { ...product, quantity: 1 }]);
      } else {
        increment(product.id);
      }
    },
    [increment, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
