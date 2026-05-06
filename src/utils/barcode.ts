export interface BarcodeProduct {
  name: string;
  brand?: string;
  image_url?: string;
  category?: string;
}

export async function fetchProductByBarcode(barcode: string): Promise<BarcodeProduct | null> {
  if (!barcode || barcode.length < 8) return null;

  try {
    // 1. Tentar Open Food Facts (Excelente para alimentos e bebidas)
    const offResponse = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,image_url,categories`);
    
    if (offResponse.ok) {
      const data = await offResponse.json();
      if (data.status === 1 && data.product) {
        return {
          name: data.product.product_name || '',
          brand: data.product.brands || '',
          image_url: data.product.image_url || '',
          category: data.product.categories?.split(',')[0] || ''
        };
      }
    }

    // Nota: Aqui poderíamos adicionar outros fallbacks como Cosmos (se houver chave)
    // ou APIs de busca pública se necessário.

    return null;
  } catch (error) {
    console.error('Erro ao buscar produto pelo código de barras:', error);
    return null;
  }
}

export async function compressImageFromUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 400;
      let width = img.width;
      let height = img.height;

      if (width > height && width > MAX_SIZE) {
        height *= MAX_SIZE / width;
        width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width *= MAX_SIZE / height;
        height = MAX_SIZE;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve(compressedDataUrl);
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}
