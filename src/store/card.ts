import { create } from "zustand";

type CartItem = {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
};

type AddToCartItem = Omit<CartItem, "quantity">;

export interface CartState {
    items: CartItem[];
    addToCart: (newItem: AddToCartItem) => void;
    increaseQuantity: (productId: string) => void;
    decreaseQuantity: (productId: string) => void;
    clearCart?: () => void;
}

export const useCartStore = create<CartState>()((set) => ({
    items: [],
    addToCart: (newItem) => {
        set((currentState) => {
            const duplicateItems = [...currentState.items];

            const existingItemIndex = duplicateItems.findIndex(
                (item) => item.productId === newItem.productId,
            );

            if (existingItemIndex === -1) {
                duplicateItems.push({
                    productId: newItem.productId,
                    name: newItem.name,
                    imageUrl: newItem.imageUrl,
                    price: newItem.price,
                    quantity: 1,
                })
            } else {
                const itemToUpdate = duplicateItems[existingItemIndex];

                if (!itemToUpdate)
                    return {
                        ...currentState,
                    };

                itemToUpdate.quantity += 1;
            }

            return {
                ...currentState,
                items: duplicateItems,
            }
        })
    },

    clearCart: () => set({ items: [] }),

    increaseQuantity: (productId) => set((state) => {
        const updatedItems = state.items.map((item) =>
            item.productId === productId
                ? { ...item, quantity: item.quantity + 1 }
                : item
        );
        return { items: updatedItems };
    }),

    decreaseQuantity: (productId) => set((state) => {
        const updatedItems = state.items.map((item) =>
            item.productId === productId
                ? { ...item, quantity: item.quantity > 1 ? item.quantity - 1 : 1 }
                : item
        ).filter((item) => item.quantity > 0);

        return { items: updatedItems };
    }),
}));