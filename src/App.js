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

  console.log(weatherData)
	//get full page html 
	const html = await page.content(); 
 
	//store html content in the reactstorefront file 
	await fs.writeFile('weather.html', html); 
 
	//close headless chrome 
	await browser.close(); 
})();