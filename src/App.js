const puppeteer = require('puppeteer')
const fs = require('fs').promises;

(async () => { 
	//initiate the browser 
	const browser = await puppeteer.launch(); 
 
	//create a new in headless chrome 
	const page = await browser.newPage(); 
 
	//go to target website 
	await page.goto('https://www.weather.com/weather/today/l/29.7106,-95.5963', { 
		//wait for content to load 
		waitUntil: 'networkidle0', 
	}); 
  
  await page.waitForSelector('[class="CurrentConditions--tempValue--MHmYY"]', { timeout: 10000 });

  // Extract temperature and weather condition
  const weatherData = await page.evaluate(() => {
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
  
    // For future forecast, we might want to get multiple days
    const forecastElements = document.querySelectorAll('.DailyForecast--narrative--3Ti6_');
    data.futureForecast = Array.from(forecastElements).map(el => el.textContent.trim());
  
    return data;
  
  });

  await page.goto('https://www.weather.com/weather/tenday/l/29.7106,-95.5963', {
    waitUntil: 'networkidle0',
  });
  
  // Wait for the 10-day forecast to load
  await page.waitForSelector('.DailyForecast--DisclosureList--nosQS', { timeout: 10000 });
  
  // Extract 10-day forecast data
  const tenDayForecast = await page.evaluate(() => {
    const forecastElements = document.querySelectorAll('.DailyForecast--DisclosureList--nosQS > details');
    return Array.from(forecastElements).map(detail => {
      const dayElement = detail.querySelector('.DetailsSummary--daypartName--kbngc');
      const tempElements = detail.querySelectorAll('.DetailsSummary--temperature--1kVVZ');
      const descElement = detail.querySelector('.DetailsSummary--extendedData--aaFeV');
      
      return {
        day: dayElement ? dayElement.textContent.trim() : 'N/A',
        highTemp: tempElements[0] ? tempElements[0].textContent.trim() : 'N/A',
        lowTemp: tempElements[1] ? tempElements[1].textContent.trim() : 'N/A',
        description: descElement ? descElement.textContent.trim() : 'N/A'
      };
    });
  });
  
  // Combine today's weather and 10-day forecast
  const combinedWeatherData = {
    ...todayData,
    tenDayForecast
  };
  
  console.log(JSON.stringify(combinedWeatherData, null, 2));

    waitUntil: 'networkidle0',
  });
  
  // Wait for the 10-day forecast to load
  await page.waitForSelector('.DailyForecast--DisclosureList--nosQS', { timeout: 10000 });
  
  // Extract 10-day forecast data
  const tenDayForecast = await page.evaluate(() => {
    const forecastElements = document.querySelectorAll('.DailyForecast--DisclosureList--nosQS > details');
    return Array.from(forecastElements).map(detail => {
      const dayElement = detail.querySelector('.DetailsSummary--daypartName--kbngc');
      const tempElements = detail.querySelectorAll('.DetailsSummary--temperature--1kVVZ');
      const descElement = detail.querySelector('.DetailsSummary--extendedData--aaFeV');
      
      return {
        day: dayElement ? dayElement.textContent.trim() : 'N/A',
        highTemp: tempElements[0] ? tempElements[0].textContent.trim() : 'N/A',
        lowTemp: tempElements[1] ? tempElements[1].textContent.trim() : 'N/A',
        description: descElement ? descElement.textContent.trim() : 'N/A'
      };
    });
  });
  
  // Combine today's weather and 10-day forecast
  const combinedWeatherData = {
    ...todayData,
    tenDayForecast
  };
  
  console.log(JSON.stringify(combinedWeatherData, null, 2));

	//get full page html 
	const html = await page.content(); 
 
	//store html content in the reactstorefront file 
	await fs.writeFile('weather.html', html); 
 
	//close headless chrome 
	await browser.close(); 
})();