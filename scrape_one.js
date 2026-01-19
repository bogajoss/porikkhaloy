const axios = require('axios');

async function scrapeOne() {
    const URL = 'https://app.porikkhaloy.com/api/v1/student/que/all?page=1&perPage=1';
    try {
        const response = await axios.get(URL, {
            headers: {
                'Origin': 'https://porikkhaloy.com',
                'Referer': 'https://porikkhaloy.com/'
            }
        });
        
        const question = response.data.data.data[0];
        console.log(JSON.stringify(question, null, 2));
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

scrapeOne();
