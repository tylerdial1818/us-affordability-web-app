/**
 * Fetch Historical ACS Data (5 years back)
 * 
 * Fetches median home value, median rent, and median income for:
 * - 2019, 2020, 2021, 2022, 2023
 * 
 * Output: public/data/counties_acs_trends.json
 * Format: { [fips]: { year: { median_home_value, median_gross_rent, median_household_income } } }
 */

const fs = require('fs');
const path = require('path');

const CENSUS_API_KEY = process.env.CENSUS_API_KEY;
const OUTPUT_PATH = path.join(__dirname, '../public/data/counties_acs_trends.json');

// ACS 5-Year estimate years to fetch (most recent 5)
const YEARS = [2019, 2020, 2021, 2022, 2023];

// Variable codes
const VARIABLES = {
  median_home_value: 'B25077_001E',     // Median home value
  median_gross_rent: 'B25064_001E',     // Median gross rent
  median_household_income: 'B19013_001E' // Median household income
};

async function fetchYearData(year) {
  console.log(`Fetching ${year} data...`);
  
  const varList = Object.values(VARIABLES).join(',');
  const url = `https://api.census.gov/data/${year}/acs/acs5?get=NAME,${varList}&for=county:*&key=${CENSUS_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  const yearData = {};
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const state = row[row.length - 2];
    const county = row[row.length - 1];
    const fips = state + county;
    
    yearData[fips] = {
      median_home_value: parseFloat(row[1]) || null,
      median_gross_rent: parseFloat(row[2]) || null,
      median_household_income: parseFloat(row[3]) || null,
    };
  }
  
  return yearData;
}

async function main() {
  if (!CENSUS_API_KEY) {
    console.error('❌ ERROR: CENSUS_API_KEY environment variable not set');
    console.error('Get your free API key at: https://api.census.gov/data/key_signup.html');
    console.error('Then run: export CENSUS_API_KEY="your_key_here"');
    process.exit(1);
  }
  
  console.log('='*60);
  console.log('Fetching 5-Year Historical ACS Data');
  console.log('='*60);
  
  const allData = {};
  
  for (const year of YEARS) {
    const yearData = await fetchYearData(year);
    
    // Merge into allData structure
    for (const [fips, values] of Object.entries(yearData)) {
      if (!allData[fips]) {
        allData[fips] = {};
      }
      allData[fips][year] = values;
    }
    
    console.log(`  ✓ ${year}: ${Object.keys(yearData).length} counties`);
    
    // Rate limiting - wait 200ms between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Calculate growth rates
  console.log('\n📊 Calculating growth rates...');
  
  for (const [fips, years] of Object.entries(allData)) {
    const sortedYears = Object.keys(years).map(Number).sort();
    const oldestYear = sortedYears[0];
    const newestYear = sortedYears[sortedYears.length - 1];
    
    if (years[oldestYear] && years[newestYear]) {
      const old = years[oldestYear];
      const recent = years[newestYear];
      
      allData[fips].growth = {
        home_value: old.median_home_value && recent.median_home_value
          ? ((recent.median_home_value - old.median_home_value) / old.median_home_value * 100)
          : null,
        rent: old.median_gross_rent && recent.median_gross_rent
          ? ((recent.median_gross_rent - old.median_gross_rent) / old.median_gross_rent * 100)
          : null,
        income: old.median_household_income && recent.median_household_income
          ? ((recent.median_household_income - old.median_household_income) / old.median_household_income * 100)
          : null,
      };
      
      // Calculate affordability trend (ratio of home value growth to income growth)
      if (allData[fips].growth.home_value !== null && allData[fips].growth.income !== null) {
        allData[fips].growth.affordability_trend = 
          allData[fips].growth.income - allData[fips].growth.home_value;
        // Positive = improving (income growing faster than home values)
        // Negative = declining (home values growing faster than income)
      } else {
        allData[fips].growth.affordability_trend = null;
      }
    }
  }
  
  // Save
  const dir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allData, null, 2));
  
  console.log(`\n✅ Success!`);
  console.log(`   Saved to: ${OUTPUT_PATH}`);
  console.log(`   Counties: ${Object.keys(allData).length}`);
  console.log(`   Years: ${YEARS.join(', ')}`);
  
  // Sample output
  const sampleFips = Object.keys(allData)[0];
  console.log(`\n📊 Sample data (FIPS ${sampleFips}):`);
  console.log(JSON.stringify(allData[sampleFips], null, 2));
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
