const fs = require('fs');
const path = require('path');
const axios = require('axios');
const colors = require('colors');
const readline = require('readline');
const FormData = require('form-data');
const printLogo = require('./src/logo');

class KucoinAPIClient {
    constructor() {
        this.headers = {
            "Accept": "application/json",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
            "Origin": "https://www.kucoin.com",
            "Referer": "https://www.kucoin.com/miniapp/tap-game?inviterUserId=6269851518&rcode=QBSLTEH5",
            "Sec-Ch-Ua": '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
            "Sec-Ch-Ua-Mobile": "?1",
            "Sec-Ch-Ua-Platform": '"Android"',
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36"
        };
    }

    log(msg, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        switch(type) {
            case 'success':
                console.log(`[${timestamp}] [*] ${msg}`.green);
                break;
            case 'custom':
                console.log(`[${timestamp}] [*] ${msg}`.magenta);
                break;        
            case 'error':
                console.log(`[${timestamp}] [!] ${msg}`.red);
                break;
            case 'warning':
                console.log(`[${timestamp}] [*] ${msg}`.yellow);
                break;
            default:
                console.log(`[${timestamp}] [*] ${msg}`.blue);
        }
    }

    async countdown(seconds) {
        for (let i = seconds; i > 0; i--) {
            const timestamp = new Date().toLocaleTimeString();
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`[${timestamp}] [*] Waiting ${i} seconds to continue...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        readline.cursorTo(process.stdout, 0);
        readline.clearLine(process.stdout, 0);
    }

    generateRandomPoints(totalPoints, numRequests) {
        let points = new Array(numRequests).fill(0);
        let remainingPoints = totalPoints;

        for (let i = 0; i < numRequests - 1; i++) {
            const maxPoint = Math.min(60, remainingPoints - (numRequests - i - 1));
            const point = Math.floor(Math.random() * (maxPoint + 1));
            points[i] = point;
            remainingPoints -= point;
        }

        points[numRequests - 1] = remainingPoints;

        for (let i = points.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [points[i], points[j]] = [points[j], points[i]];
        }

        return points;
    }

    async increaseGold(cookie, increment, molecule) {
        const url = "https://www.kucoin.com/_api/xkucoin/platform-telebot/game/gold/increase?lang=en_US";
        
        const formData = new FormData();
        formData.append('increment', increment);
        formData.append('molecule', molecule);
        const headers = {
            ...this.headers,
            "Cookie": cookie,
            ...formData.getHeaders()
        };

        try {
            const response = await axios.post(url, formData, { headers });
            if (response.status === 200) {
                return { success: true, data: response.data };
            } else {
                return { success: false, error: `HTTP Error: ${response.status}` };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async main() {
        printLogo();
        const dataFile = path.join(__dirname, 'user.txt');
        const cookies = fs.readFileSync(dataFile, 'utf8')
            .replace(/\r/g, '')
            .split('\n')
            .filter(Boolean);

        while (true) {
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i];
                
                console.log(`========== Account ${i + 1} ==========`);
                
                const points = this.generateRandomPoints(3000, 55);
                let totalPoints = 0;
                let currentMolecule = 3000;

                for (let j = 0; j < points.length; j++) {
                    const increment = points[j];
                    currentMolecule -= increment; 

                    this.log(`Round ${j + 1}: Feeding ${increment} worms to the frog...`, 'info');
                    
                    const result = await this.increaseGold(cookie, increment, currentMolecule);
                    if (result.success) {
                        this.log(`Fed successfully, ${result.data.data} worms have been given`, 'success');
                        totalPoints += increment;
                        this.log(`Remaining worms: ${currentMolecule}`, 'custom');
                    } else {
                        this.log(`Unable to feed worms: ${result.error}`, 'error');
                    }

                    await this.countdown(3);
                }

                this.log(`Total gold increased: ${totalPoints}`, 'custom');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }

            await this.countdown(300);
        }
    }
}

const client = new KucoinAPIClient();
client.main().catch(err => {
    client.log(err.message, 'error');
    process.exit(1);
});