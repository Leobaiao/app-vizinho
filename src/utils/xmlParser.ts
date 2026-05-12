export interface NFeItem {
  name: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  supplierCode: string;
  batch?: string;
  expiry?: string;
}

export function parseNFeXML(xmlString: string): NFeItem[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  
  // O seletor 'det' contém os detalhes de cada item na NF-e
  const itemsNodes = xmlDoc.getElementsByTagName("det");
  const parsedItems: NFeItem[] = [];

  for (let i = 0; i < itemsNodes.length; i++) {
    const prod = itemsNodes[i].getElementsByTagName("prod")[0];
    
    if (prod) {
      const name = prod.getElementsByTagName("xProd")[0]?.textContent || "";
      const barcode = prod.getElementsByTagName("cEAN")[0]?.textContent || "";
      const quantity = parseFloat(prod.getElementsByTagName("qCom")[0]?.textContent || "0");
      const unitPrice = parseFloat(prod.getElementsByTagName("vUnCom")[0]?.textContent || "0");
      const supplierCode = prod.getElementsByTagName("cProd")[0]?.textContent || "";

      // Tentar capturar informações de lote/validade (tag rastro)
      const rastro = itemsNodes[i].getElementsByTagName("rastro")[0];
      const batch = rastro?.getElementsByTagName("nLote")[0]?.textContent || undefined;
      const expiry = rastro?.getElementsByTagName("dVal")[0]?.textContent || undefined;

      // Só adicionamos se tiver um nome válido
      if (name) {
        parsedItems.push({
          name,
          barcode: barcode === "SEM GTIN" ? "" : barcode,
          quantity,
          unitPrice,
          supplierCode,
          batch,
          expiry
        });
      }
    }
  }

  return parsedItems;
}

