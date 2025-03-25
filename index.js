const axios = require('axios');
const fs = require('fs').promises;
const readline = require('readline');
const { HttpsProxyAgent } = require('https-proxy-agent'); 
const { SocksProxyAgent } = require('socks-proxy-agent'); 

class TapNodeContinuousTapper {
    constructor() {
        this.baseURL = 'https://api-tapnodegame.inflectiv.ai/api';
        this.proxies = [];
    }

    async loadProxies() {
        try {
            const data = await fs.readFile('proxies.txt', 'utf8');
            this.proxies = data.split('\n')
                .map(proxy => proxy.trim())
                .filter(proxy => proxy !== '');
            
            console.log(`= LOADED ${this.proxies.length} PROXIES =`);
            return this.proxies;
        } catch (error) {
            console.error('Error reading proxies file:', error.message);
            return [];
        }
    }

    async loadTokens() {
        try {
            const data = await fs.readFile('tokens.txt', 'utf8');
            const tokens = data.split('\n')
                .map(token => token.trim())
                .filter(token => token !== '');
            
            console.log(`= LOADED ${tokens.length} TOKENS =`);
            return tokens;
        } catch (error) {
            console.error('Error reading tokens file:', error.message);
            return [];
        }
    }

    getProxyConfig(proxy) {
        let proxyUrl = proxy;
        let agent;

        if (proxyUrl.startsWith('socks4://') || proxyUrl.startsWith('socks5://')) {
            agent = new SocksProxyAgent(proxyUrl);
        } else {
            if (!proxyUrl.startsWith('http://') && !proxyUrl.startsWith('https://')) {
                const parts = proxyUrl.split(':');
                if (parts.length === 4) {
                    proxyUrl = `http://${parts[2]}:${parts[3]}@${parts[0]}:${parts[1]}`;
                } else {
                    proxyUrl = `http://${proxyUrl}`;
                }
            }
            agent = new HttpsProxyAgent(proxyUrl);
        }

        return {
            httpsAgent: agent,
            httpAgent: agent 
        };
    }

    async fetchUserProfile(token, proxy) {
        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };
            
            if (proxy) {
                Object.assign(config, this.getProxyConfig(proxy));
            }

            const response = await axios.get(`${this.baseURL}/user/profile`, config);
            return response.data.playerData || null;
        } catch (error) {
            console.error('Error fetching profile:', error.response ? error.response.data : error.message);
            return null;
        }
    }

    displayProfileInfo(profile) {
        if (!profile) {
            console.log('No profile data available');
            return;
        }

        console.log('\n===== PROFILE INFORMATION =====');
        console.log(`Username: ${profile.username}`);
        console.log(`Energy: ${profile.energy}/${profile.energy_max}`);
        console.log(`Energy Level: ${profile.energy_level}`);
        console.log(`Tap Power: ${profile.tap_power}`);
        
        const formatDate = (timestamp) => new Date(timestamp).toLocaleString();
        console.log(`Full Energy Last Used: ${formatDate(profile.fullEnergy.lastUsed)}`);
        console.log(`Last Energy Time: ${formatDate(profile.lastEnergyTime)}`);
        console.log(`Last Data Claim Time: ${formatDate(profile.lastDataClaimTime)}`);
        console.log('===============================\n');
    }

    async completeTasks(token, proxy) {
        const taskIds = [
            'task_7', 
            '7BhNEc96WsnmuMNzmBxRkY', 
            '76jEJCJA39SbpVfP6ChZVr', 
            'cipc9RATyK7YuEiX8K9CSu', 
            '8bUM49oxix8BUsGFPHAqFo', 
            'eShDNGxXovy2mjXy3Gmc7Y', 
            'qrpuXu1XBkiqp3fX7WkJMZ'
        ];

        console.log('Attempting to complete tasks...');
        for (const taskId of taskIds) {
            try {
                const config = {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                };
                
                if (proxy) {
                    Object.assign(config, this.getProxyConfig(proxy));
                }

                await axios.post(
                    `${this.baseURL}/tasks/complete`,
                    { taskId },
                    config
                );
                console.log(`  ✓ Task ${taskId} completed successfully`);
            } catch (error) {
                console.log(`  ✗ Task ${taskId} failed: ${error.response ? error.response.data.message : error.message}`);
            }
        }
    }

    async claimDailyReward(token, proxy) {
        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };
            
            if (proxy) {
                Object.assign(config, this.getProxyConfig(proxy));
            }

            await axios.post(
                `${this.baseURL}/game/claim-daily-reward`,
                {},
                config
            );
            console.log('  ✓ Daily reward claimed successfully');
        } catch (error) {
            console.log(`  ✗ Daily reward claim failed: ${error.response ? error.response.data.message : error.message}`);
        }
    }

    async continuousTapping(token, profile, proxy) {
        if (!profile || !profile.energy) {
            console.log('\n===== CANNOT START TAPPING: NO PROFILE DATA =====\n');
            return;
        }

        console.log('\n===== STARTING TAPPING =====');
        
        let currentEnergy = profile.energy;
        const tapPower = profile.tap_power;
        const tapsPerBatch = 10;

        while (currentEnergy > 0) {
            try {
                const tapsToPerform = Math.min(tapsPerBatch, Math.floor(currentEnergy / tapPower));
                
                if (tapsToPerform === 0) break;

                const config = {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                };
                
                if (proxy) {
                    Object.assign(config, this.getProxyConfig(proxy));
                }

                const response = await axios.post(
                    `${this.baseURL}/game/tap`,
                    { taps: tapsToPerform },
                    config
                );

                console.log(`  ✓ Performed ${tapsToPerform} taps`);
                
                currentEnergy -= tapsToPerform * tapPower;
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                const updatedProfile = await this.fetchUserProfile(token, proxy);
                if (!updatedProfile) {
                    console.log('Failed to fetch updated profile, stopping tapping');
                    break;
                }
                currentEnergy = updatedProfile.energy;
            } catch (error) {
                console.log(`  ✗ Tapping failed: ${error.response ? error.response.data.message : error.message}`);
                break;
            }
        }

        console.log('===== TAPPING COMPLETED =====\n');
    }

    async processToken(token, proxy) {
        try {
            console.log(`\n===== PROCESSING TOKEN: ${token.slice(0, 10)}... ${proxy ? `USING PROXY: ${proxy}` : ''} =====`);

            const profile = await this.fetchUserProfile(token, proxy);
            this.displayProfileInfo(profile);

            if (profile) {
                await this.completeTasks(token, proxy);
                await this.claimDailyReward(token, proxy);
                await this.continuousTapping(token, profile, proxy);
            } else {
                console.log('Skipping tasks and tapping due to profile fetch failure');
            }

            console.log(`===== TOKEN ${token.slice(0, 10)}... PROCESSING COMPLETE =====\n`);
        } catch (error) {
            console.error(`Error processing token: ${error.message}`);
        }
    }

    async run() {
        console.log('=====================================');
        console.log('  Tap Node Inflectiv - Airdrop Insiders  ');
        console.log('=====================================\n');

        const tokens = await this.loadTokens();
        const proxies = await this.loadProxies();
        
        if (tokens.length === 0) {
            console.log('No tokens found. Please add tokens to tokens.txt');
            return;
        }

        for (let i = 0; i < tokens.length; i++) {
            const proxy = proxies.length > 0 ? proxies[i % proxies.length] : null;
            await this.processToken(tokens[i], proxy);
        }
    }
}

async function main() {
    const bot = new TapNodeContinuousTapper();
    await bot.run();
}

main().catch(console.error);