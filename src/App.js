const puppeteer = require('puppeteer');
const cron = require('node-cron');
const fs = require('fs').promises;

async function scrapeWeather() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
    });
    const page = await browser.newPage();

    await page.goto('https://www.weather.com/weather/today/l/29.7858,-95.8245', {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForSelector('[class="CurrentConditions--tempValue--MHmYY"]', { timeout: 10000 });

    const todayData = await page.evaluate(() => {
      const selectors = [
        { selector: '.CurrentConditions--tempValue--MHmYY', property: 'temperature' },
        { selector: '.CurrentConditions--phraseValue--mZC_p', property: 'condition' },
        { selector: '.TodayDetailsCard--feelsLikeTempValue--2icPt', property: 'feelsLike' },
        { selector: '.WeatherDetailsListItem--wxData--kK35q', property: 'highLow' },
        { selector: '[data-testid="Wind"] span:nth-child(2)', property: 'wind' },
        { selector: '[data-testid="PercentageValue"', property: 'humidity' },
      ];

      return selectors.reduce((acc, { selector, property }) => {
        const element = document.querySelector(selector);
        acc[property] = element ? element.textContent.trim() : 'N/A';
        return acc;
      }, {});
    });

    await page.goto('https://www.weather.com/weather/tenday/l/29.7106,-95.5963', {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForSelector('.DailyForecast--DisclosureList--nosQS', { timeout: 10000 });

    const tenDayForecast = await page.evaluate(() => {
      const forecastElements = document.querySelectorAll('.DailyForecast--DisclosureList--nosQS > details');
      return Array.from(forecastElements).map(detail => {
        const dayElement = detail.querySelector('.DetailsSummary--daypartName--kbngc');
        const tempElements = detail.querySelectorAll('.DailyContent--dataPoints--3wPp2 .DailyContent--label--30_yg span');

        return {
          day: dayElement ? dayElement.textContent.trim() : 'N/A',
          rain: tempElements[0] ? tempElements[0].textContent.trim() : 'N/A',
          wind: tempElements[1] ? tempElements[1].textContent.trim() : 'N/A',
        };
      });
    });

    const combinedWeatherData = {
      ...todayData,
      tenDayForecast
    };

    await fs.writeFile('weather_data.json', JSON.stringify(combinedWeatherData, null, 2));
    console.log(combinedWeatherData);
    console.log('Data scraped and saved successfully at:', new Date().toLocaleString());
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    if (browser) await browser.close();
  }
}

// Run immediately on start
scrapeWeather().catch(console.error);

// Then schedule to run every minute
cron.schedule('*/5 * * * *', () => {
  console.log('Running weather scraper...');
  scrapeWeather().catch(console.error);
});

console.log('Weather scraper scheduled. Running every 10 minutes.');