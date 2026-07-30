
/**
 * ShareService.ts
 * Handles native web sharing, WhatsApp sharing, and analytics tracking.
 */

interface ShareData {
  title: string;
  text: string;
  url: string;
}

export const ShareService = {
  /**
   * Shares a product using the best available method.
   * Priority: Native Web Share -> Fallback (WhatsApp/Clipboard)
   */
  async shareProduct(product: { name: string; sku?: string; category: string; id: string }, baseUrl?: string) {
    const rootUrl = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const productUrl = `${rootUrl}/?category=${encodeURIComponent(product.category)}&product=${encodeURIComponent(product.sku || product.id)}`;
    const shareTitle = `ח. סבן קטלוג - ${product.name}`;
    const shareText = `אהלן, צירפתי לך פרטים על *${product.name}* מקטלוג ח. סבן:\n${productUrl}\n\nמומלץ לבדוק את המפרט הטכני המלא באנציקלופדיה שלנו.`;
    
    // Track analytics event
    this.trackShare(`Product_Shared_${product.name.replace(/\s+/g, '_')}`);

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: productUrl,
        });
        return { method: 'native' };
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    }

    // Fallback to WhatsApp
    this.shareToWhatsApp(product, productUrl);
    return { method: 'whatsapp' };
  },

  /**
   * Specifically handles WhatsApp sharing with the new production link format.
   */
  shareToWhatsApp(product: { name: string; sku?: string; category: string; id: string }, customUrl?: string) {
    const rootUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const productUrl = customUrl || `${rootUrl}/?category=${encodeURIComponent(product.category)}&product=${encodeURIComponent(product.sku || product.id)}`;
    const shareText = `אהלן, צירפתי לך פרטים על *${product.name}* מקטלוג ח. סבן:\n${productUrl}\n\nמומלץ לבדוק את המפרט הטכני המלא באנציקלופדיה שלנו.`;
    const encodedText = encodeURIComponent(shareText);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  },

  /**
   * Logs a share event to the console for tracking.
   * In a real app, this would send data to an analytics endpoint.
   */
  trackShare(eventName: string) {
    console.log(`[Analytics] Event Tracked: ${eventName}`);
    // Optional: Send to GA4 or search-based tracking if available
  }
};
