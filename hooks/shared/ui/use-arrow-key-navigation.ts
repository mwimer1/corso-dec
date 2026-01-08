// hooks/ui/use-arrow-key-navigation.ts
'use client';

import * as React from 'react';

/**
 * Props for the arrow key navigation hook
 */
interface ArrowKeyNavigationProps {
  /** The total number of items in the navigation list. */
  itemCount: number;
  /** Callback fired with the new index when an arrow key is pressed. */
  onSelect: () => void;
}

/**
 * A hook to manage arrow key (left/right) navigation for a list of items.
 * It handles focus management and calls a selection handler.
 *
 * This hook is useful for creating keyboard-accessible navigation components
 * like carousels, tabs, or any horizontal list of interactive elements.
 *
 * @template T - The type of the HTML element being navigated (e.g., HTMLButtonElement).
 * @param {ArrowKeyNavigationProps} props - The properties for the hook.
 * @returns An object containing a `getRef` function to attach to each item
 * and an `onKeyDown` handler for keyboard events.
 * 
 * @example
 * ```tsx
 * import { useArrowKeyNavigation } from '@/hooks/shared';
 * 
 * function TabNavigation() {
 *   const tabs = ['Home', 'Profile', 'Settings', 'Help'];
 *   const [activeTab, setActiveTab] = React.useState(0);
 * 
 *   const { getRef, onKeyDown } = useArrowKeyNavigation({
 *     itemCount: tabs.length,
 *     onSelect: () => console.log('Tab selected')
 *   });
 * 
 *   return (
 *     <div role="tablist">
 *       {tabs.map((tab, index) => (
 *         <button
 *           key={tab}
 *           ref={getRef(index)}
 *           role="tab"
 *           aria-selected={index === activeTab}
 *           onKeyDown={(e) => onKeyDown(e, index)}
 *           onClick={() => setActiveTab(index)}
 *         >
 *           {tab}
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Image carousel with arrow navigation
 * function ImageCarousel({ images }) {
 *   const [currentIndex, setCurrentIndex] = React.useState(0);
 * 
 *   const { getRef, onKeyDown } = useArrowKeyNavigation({
 *     itemCount: images.length,
 *     onSelect: () => console.log('Image selected')
 *   });
 * 
 *   return (
 *     <div className="carousel">
 *       {images.map((image, index) => (
 *         <div
 *           key={image.id}
 *           ref={getRef(index)}
 *           tabIndex={0}
 *           onKeyDown={(e) => onKeyDown(e, index)}
 *           onClick={() => setCurrentIndex(index)}
 *           className={`carousel-item ${index === currentIndex ? 'active' : ''}`}
 *         >
 *           <img src={image.src} alt={image.alt} />
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Product grid with keyboard navigation
 * function ProductGrid({ products }) {
 *   const [selectedProduct, setSelectedProduct] = React.useState(0);
 * 
 *   const { getRef, onKeyDown } = useArrowKeyNavigation({
 *     itemCount: products.length,
 *     onSelect: () => {
 *       const product = products[selectedProduct];
 *       console.log('Selected product:', product.name);
 *     }
 *   });
 * 
 *   return (
 *     <div className="product-grid" role="grid">
 *       {products.map((product, index) => (
 *         <div
 *           key={product.id}
 *           ref={getRef(index)}
 *           role="gridcell"
 *           tabIndex={0}
 *           onKeyDown={(e) => onKeyDown(e, index)}
 *           onClick={() => setSelectedProduct(index)}
 *           className={`product-card ${index === selectedProduct ? 'selected' : ''}`}
 *         >
 *           <h3>{product.name}</h3>
 *           <p>{product.price}</p>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useArrowKeyNavigation = <T extends HTMLElement>({
  itemCount,
  onSelect,
}: ArrowKeyNavigationProps) => {
  const itemRefs = React.useRef<(T | null)[]>([]);

  /**
   * Returns a ref callback to be attached to each navigable item.
   * @param {number} index - The index of the item in the list.
   * @returns A ref callback function.
   */
  const getRef = (index: number) => (el: T | null) => {
    itemRefs.current[index] = el;
  };

  /**
   * Handles the key down event for arrow navigation.
   * @param {React.KeyboardEvent} event - The keyboard event.
   * @param {number} currentIndex - The index of the currently focused item.
   */
  const onKeyDown = (event: React.KeyboardEvent, currentIndex: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();

    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const newIndex = (currentIndex + direction + itemCount) % itemCount;

    const nextItem = itemRefs.current[newIndex];
    if (nextItem) {
      nextItem.focus();
      onSelect();
    }
  };

  return { getRef, onKeyDown };
}; 

