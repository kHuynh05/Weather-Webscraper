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
    const temperatureElement = document.querySelector('.CurrentConditions--tempValue--MHmYY');
    const conditionElement = document.querySelector('.CurrentConditions--phraseValue--mZC_p');

      return {
          temperature: temperatureElement ? temperatureElement.textContent : 'N/A',
          condition: conditionElement ? conditionElement.textContent : 'N/A'
      };
  });

  console.log('Temperature:', weatherData.temperature);
  console.log('Weather Condition:', weatherData.condition);
	//get full page html 
	const html = await page.content(); 
 
	//store html content in the reactstorefront file 
	await fs.writeFile('weather.html', html); 
 
	//close headless chrome 
	await browser.close(); 
})();