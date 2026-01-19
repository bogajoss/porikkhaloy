const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BASE_URL = 'https://app.porikkhaloy.com/api/v1/student/que/all';
const TOTAL_PAGES = 2610; 
const PER_PAGE = 20;
const DATA_DIR = 'scraped_data';

async function fetchPage(page) {
    try {
        const response = await axios.get(`${BASE_URL}?page=${page}&perPage=${PER_PAGE}`, {
            headers: {
                'Origin': 'https://porikkhaloy.com',
                'Referer': 'https://porikkhaloy.com/'
            }
        });
        return response.data.data.data;
    } catch (error) {
        console.error(`Error fetching page ${page}: ${error.message}`);
        return null;
    }
}

async function saveBatch(questions) {
    // Group questions by their target file path
    const groups = {};

    questions.forEach(q => {
        const subject = q.attachable?.subject_id || 'unknown_subject';
        const lesson = q.attachable?.lesson_id || 'unknown_lesson';
        const topic = q.attachable?.topic_id || 'unknown_topic';

        const dirPath = path.join(DATA_DIR, String(subject), String(lesson), String(topic));
        const filePath = path.join(dirPath, 'questions.json');

        if (!groups[filePath]) {
            groups[filePath] = { dir: dirPath, items: [] };
        }
        groups[filePath].items.push(q);
    });

    // Write each group to file
    for (const [filePath, data] of Object.entries(groups)) {
        try {
            await fs.promises.mkdir(data.dir, { recursive: true });
            
            let existingData = [];
            if (fs.existsSync(filePath)) {
                const fileContent = await fs.promises.readFile(filePath, 'utf8');
                try {
                    existingData = JSON.parse(fileContent);
                } catch (e) {
                    console.error(`Error parsing existing JSON at ${filePath}:`, e.message);
                    existingData = [];
                }
            }

            const mergedData = existingData.concat(data.items);
            await fs.promises.writeFile(filePath, JSON.stringify(mergedData, null, 2));
        } catch (error) {
            console.error(`Error writing to ${filePath}:`, error.message);
        }
    }
}

async function scrapeAll() {
    // We'll scrape in chunks of pages
    const CHUNK_SIZE = 10;
    let totalQuestionsScraped = 0;
    
    for (let i = 1; i <= TOTAL_PAGES; i += CHUNK_SIZE) {
        const end = Math.min(i + CHUNK_SIZE - 1, TOTAL_PAGES);
        console.log(`Processing pages ${i} to ${end}...`);
        
        const promises = [];
        for (let j = i; j <= end; j++) {
            promises.push(fetchPage(j));
        }
        
        const results = await Promise.all(promises);
        const batchQuestions = results.flat().filter(q => q !== null && q !== undefined);
        
        if (batchQuestions.length > 0) {
            await saveBatch(batchQuestions);
            totalQuestionsScraped += batchQuestions.length;
            console.log(`Saved ${batchQuestions.length} questions. Total: ${totalQuestionsScraped}`);
        }

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Finished! Total questions scraped: ${totalQuestionsScraped}`);
}

scrapeAll();
