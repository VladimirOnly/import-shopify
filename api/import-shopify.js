const fetch = require('node-fetch'); 
const { parseStringPromise } = require('xml2js');

module.exports = async (req, res) => {
  const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
  const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
  const XML_URL = "https://partizanstore.eu/wp-cron.php?security_token=616fb82a7edee8a7&export_id=16&action=get_data";

  if (!SHOPIFY_ACCESS_TOKEN || !SHOPIFY_STORE) {
    return res.status(500).send("Missing Shopify credentials");
  }

  try {
    const xmlData = await fetch(XML_URL).then(r => r.text());
    const result = await parseStringPromise(xmlData);

    const products = result.SHOP?.SHOPITEM;
    if (!products || !Array.isArray(products)) {
      return res.status(500).send("Ошибка: товары не найдены в XML (ожидается SHOP -> SHOPITEM)");
    }

    for (let product of products) {
      const title = product.PRODUCT?.[0] || "Без названия";
      const price = parseFloat((product.PRICE_VAT || [0])[0]);
      const sku = (product.CODE || [""])[0];

      const body = {
        product: {
          title,
          variants: [
            {
              price: price.toFixed(2),
              sku
            }
          ]
        }
      };

      await fetch(`https://${SHOPIFY_STORE}.myshopify.com/admin/api/2023-10/products.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
        },
        body: JSON.stringify(body)
      });
    }

    res.status(200).send("Импорт завершен успешно");
  } catch (error) {
    console.error(error);
    res.status(500).send("Ошибка импорта: " + error.message);
  }
};
