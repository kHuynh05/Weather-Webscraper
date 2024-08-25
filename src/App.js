const puppeteer = require('puppeteer')
const fs = require('fs').promises;

(async () => { 
	//initiate the browser 
	const browser = await puppeteer.launch({
    headless: 'new',  // Use the new headless mode
  });
	//create a new in headless chrome 
	const page = await browser.newPage(); 
 
	//go to target website 
	await page.goto('https://www.weather.com/weather/today/l/29.7106,-95.5963', { 
		//wait for content to load 
		waitUntil: 'domcontentloaded', 
	}); 
  
  await page.waitForSelector('[class="CurrentConditions--tempValue--MHmYY"]', { timeout: 10000 });

  // Extract temperature and weather condition
  const todayData = await page.evaluate(() => {
    const selectors = [
      { selector: '.CurrentConditions--tempValue--MHmYY', property: 'temperature' },
      { selector: '.CurrentConditions--phraseValue--mZC_p', property: 'condition' },
      { selector: '.TodayDetailsCard--feelsLikeTempValue--2icPt', property: 'feelsLike' },
      { selector: '.WeatherDetailsListItem--wxData--kK35q', property: 'highLow' },
      { selector: '[data-testid="Wind"] span:nth-child(2)', property: 'wind' },
      { selector: '[data-testid="PercentageValue"', property: 'humidity' },
    ];


    const data = selectors.reduce((acc, { selector, property }) => {
      const element = document.querySelector(selector);
      acc[property] = element ? element.textContent.trim() : 'N/A';
      return acc;
    }, {});
  
    return data;
  
  });

  await page.goto('https://www.weather.com/weather/tenday/l/29.7106,-95.5963', {
    waitUntil: 'domcontentloaded',
  });
  
  // Wait for the 10-day forecast to load
  await page.waitForSelector('.DailyForecast--DisclosureList--nosQS', { timeout: 10000 });
  
  // Extract 10-day forecast data
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
  
  // Combine today's weather and 10-day forecast
  const combinedWeatherData = {
    ...todayData,
    tenDayForecast
  };
  
  console.log(JSON.stringify(combinedWeatherData, null, 2));

	//close headless chrome 
	await browser.close(); 
})();