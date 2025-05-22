// pages/api/debug.js
import xml2js from 'xml2js';

export default async function handler(req, res) {
  try {
    const response = await fetch('https://partizanstore.eu/wp-content/uploads/wpallexport/exports/fcf6c5e84131e02c05bb926e701c0b07/current-Product-Export-to-XML-cz.xml');
    const xml = await response.text();

    const parser = new xml2js.Parser({ explicitArray: true });
    const json = await parser.parseStringPromise(xml);

    const firstPost = json.data.post[0];

    // Возвращаем JSON первого товара
    res.status(200).json(firstPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
