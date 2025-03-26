# Inflectiv Auto Bot

Inflectiv Auto Bot is a Node.js automation script for the Tap Node game on the Inflectiv platform. This bot helps players automate tasks such as:
- Fetching user profile
- Completing tasks
- Claiming daily rewards
- Performing continuous tapping to earn in-game rewards

## Features
- Multi-token support
- Proxy rotation
- Automatic task completion
- Daily reward claiming
- Energy-based continuous tapping

## Prerequisites
- Node.js (v14+ recommended)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/airdropinsiders/Inflectiv-Auto-Bot.git
cd Inflectiv-Auto-Bot
```

2. Install dependencies:
```bash
npm install
```

## Configuration

1. Create `tokens.txt` in the project root
   - Add your game tokens, one per line
   - Example:
     ```
     token1
     token2
     ```

2. Create `proxies.txt` in the project root (optional)
   - Add proxy URLs, one per line
   - Supported formats:
     ```
     ip:port
     username:password@ip:port
     socks4://ip:port
     socks5://ip:port
     http://ip:port
     ```

## Usage

Run the bot:
```bash
npm run start
```

## Disclaimer
- Use at your own risk
- Automated interactions may violate game terms of service
- Author is not responsible for any account actions

## License
MIT License
