import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const KEY = "exqga.requestList";
const MAX_ITEMS = 50; // same limit as the server
const MAX_QTY = 100000; // same limit as the server
const NOTES_KEY = "exqga.requestNotes";

function loadNotes() {
  try {
    return localStorage.getItem(NOTES_KEY) ?? "";
  } catch {
    return "";
  }
}
// Read the saved list. If anything is broken, start with an empty list.
function load() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// Quantity is always a whole number between the product minimum and the max.
function clamp(quantity, min) {
  const n = Math.floor(Number(quantity)) || min;
  return Math.min(MAX_QTY, Math.max(min, n));
}

const RequestListContext = createContext(null);

export function RequestListProvider({ children }) {
  const [items, setItems] = useState(load);
  const [isOpen, setIsOpen] = useState(false);
  const [pulse, setPulse] = useState(0); // goes up by 1 every time something is added
  const [notes, setNotes] = useState(loadNotes);

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_KEY, notes);
    } catch {
      /* ignore */
    }
  }, [notes]);
  // Save on every change, so a refresh keeps the list.
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* storage full or blocked: the list still works in memory */
    }
  }, [items]);

  const addItem = useCallback((product, quantity) => {
    setItems((prev) => {
      const min = product.minQuantity;
      const qty = clamp(quantity ?? min, min);
      const found = prev.find((i) => i.productId === product.id);
      if (found) {
        // Same product again: add to the quantity, no duplicate line.
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: clamp(i.quantity + qty, i.minQuantity) }
            : i,
        );
      }
      if (prev.length >= MAX_ITEMS) return prev;
      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          sku: product.sku,
          image: product.images?.[0] ?? null,
          price: product.price,
          finalPrice: product.finalPrice,
          discountPercent: product.discountPercent,
          minQuantity: product.minQuantity,
          quantity: qty,
        },
      ];
    });
    setPulse((p) => p + 1); // the header badge pops (the drawer no longer opens by itself)
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: clamp(quantity, i.minQuantity) }
          : i,
      ),
    );
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setNotes("");
  }, []);

  // Display only: the server recalculates the real total.
  const estimatedTotal = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.finalPrice) * i.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      estimatedTotal,
      isOpen,
      pulse,
      notes,
      setNotes,
      openList: () => setIsOpen(true),
      closeList: () => setIsOpen(false),
      addItem,
      updateQuantity,
      removeItem,
      clear,
    }),
    [
      items,
      estimatedTotal,
      isOpen,
      pulse,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      notes,
    ],
  );

  return (
    <RequestListContext.Provider value={value}>
      {children}
    </RequestListContext.Provider>
  );
}

export function useRequestList() {
  const ctx = useContext(RequestListContext);
  if (!ctx)
    throw new Error("useRequestList must be used inside RequestListProvider");
  return ctx;
}
