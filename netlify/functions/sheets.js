const { google } = require('googleapis');

const SPREADSHEET_ID = '1yeu5nTSClzdWkjqboPPGoU627w7r5HytGTisSj9CDf0';
const SHEET_NAME = 'inventory';

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

exports.handler = async function (event) {
  try {
    const sheets = google.sheets({ version: 'v4', auth: getAuth() });

    // ── GET: read cellar ──────────────────────────────────────────────
    if (event.httpMethod === 'GET') {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:J`,
      });

      const rows = response.data.values || [];
      if (rows.length < 2) return { statusCode: 200, body: JSON.stringify([]) };

      const [headers, ...dataRows] = rows;
      const wines = dataRows
        .map((cols, i) => {
          const w = {
            id: `sheet_${i}`,
            name: '', winery: '', vintage: '', price: null,
            inventory: 0, style: '', country: '', region: '', subRegion: '', type: '',
          };
          headers.forEach((h, j) => {
            const v = (cols[j] || '').trim();
            if      (h === 'Name')       w.name      = v;
            else if (h === 'Winery')     w.winery    = v;
            else if (h === 'Vintage')    w.vintage   = v;
            else if (h === 'Price')      w.price     = v && v !== '-' ? parseFloat(v.replace(/[^0-9.]/g, '')) || null : null;
            else if (h === 'Inventory')  w.inventory = parseInt(v) || 0;
            else if (h === 'Style')      w.style     = v;
            else if (h === 'Country')    w.country   = v;
            else if (h === 'Region')     w.region    = v;
            else if (h === 'Sub-Region') w.subRegion = v;
            else if (h === 'Type')       w.type      = v;
          });
          return w;
        })
        .filter(w => w.name);

      return { statusCode: 200, body: JSON.stringify(wines) };
    }

    // ── POST: update inventory ────────────────────────────────────────
    if (event.httpMethod === 'POST') {
      const { wineIndex, inventory } = JSON.parse(event.body);
      const row = wineIndex + 2; // +1 skip header, +1 for 1-based index

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!E${row}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[inventory]] },
      });

      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // ── PUT: append new wine row ──────────────────────────────────────
    if (event.httpMethod === 'PUT') {
      const { name, winery, vintage, price, inventory, style, country, region, subRegion, type } = JSON.parse(event.body);

      const row = [
        name       || '',
        winery     || '',
        vintage    || '',
        price      != null ? price : '',
        inventory  != null ? inventory : 1,
        style      || '',
        country    || '',
        region     || '',
        subRegion  || '',
        type       || '',
      ];

      const appendResponse = await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:J`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
      });

      // updatedRange looks like "inventory!A5:J5" — extract appended row number
      const updatedRange = appendResponse.data.updates.updatedRange;
      const rowMatch = updatedRange.match(/!A(\d+)/);
      const rowNum = rowMatch ? parseInt(rowMatch[1], 10) : null;
      // Row 1 = header; data rows start at row 2 → wineIndex 0
      const wineIndex = rowNum != null ? rowNum - 2 : null;

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, wineIndex }),
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
