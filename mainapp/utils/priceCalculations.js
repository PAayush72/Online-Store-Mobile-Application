export const calculateDiscountedPrice = (item) => {
  if (!item) return 0;
  
  // Parse price to ensure it's a number, and default to 0 if undefined
  const originalPrice = parseFloat(item.price) || 0;
  
  // Check if the item is on sale and has a valid discount percentage
  if (item.onSale && typeof item.discount === 'number' && item.discount > 0) {
    // Calculate the discount amount
    const discountAmount = originalPrice * (item.discount / 100);
    
    // Apply discount and ensure 2 decimal precision
    return parseFloat((originalPrice - discountAmount).toFixed(2));
  }
  
  // Return original price if not on sale or no valid discount
  return originalPrice;
};

export const calculateOrderTotal = (items) => {
  const subtotal = items.reduce((acc, item) => {
    const discountedPrice = calculateDiscountedPrice(item);
    return acc + (discountedPrice * item.quantity);
  }, 0);

  const deliveryFee = items.length > 0 ? 40 : 0;
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const total = subtotal + deliveryFee + cgst + sgst;
  
  return {
    subtotal,
    deliveryFee,
    cgst,
    sgst,
    total
  };
}; 