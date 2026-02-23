const fs = require('fs');
const path = require('path');
const axios = require('axios');
const csv = require('csv-parser');

// URL of the county CSV (replace with actual)
const CSV_URL = 'https://www.alpenacounty.org/property-sales.csv';

async function updateBasePrices() {
  try {
    const response = await axios.get(CSV_URL, { responseType: 'stream' });
    const basePrices = {};

    response.data
      .pipe(csv())
      .on('data', (row) => {
        const zip = row['ZIP'];
        const price = parseFloat(row['SalePrice']);
        const sqft = parseFloat(row['SqFt']);

        if (!zip || !price || !sqft) return;

        if (!basePrices[zip]) basePrices[zip] = [];
        basePrices[zip].push(price / sqft);
      })
      .on('end', () => {
        const averages = {};
        for (let zip in basePrices) {
          const arr = basePrices[zip];
          averages[zip] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
        }

        fs.writeFileSync(path.join(__dirname, '../base-prices.json'), JSON.stringify(averages, null, 2));
        console.log('Updated base-prices.json:', averages);
      });
  } catch (err) {
    console.error('Failed to update base prices:', err);
  }
}

updateBasePrices();
