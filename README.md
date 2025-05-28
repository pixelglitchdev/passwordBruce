# Password Bruce 🛡️

A modern web application for testing password strength through simulated brute force attacks. Perfect for demonstrating the importance of strong passwords and testing password generators like NordPass.

## Features

- **Dictionary Attack**: Tests passwords against common password lists and variations
- **Genuine Brute Force Attack**: Systematically tries all possible combinations until the password is found
- **Smart Algorithm**: Prioritizes the exact length of your password for faster results
- **Password Analysis**: Provides detailed entropy analysis and crack time estimates
- **Modern UI**: Clean, responsive design with real-time feedback
- **Educational**: Includes security tips and recommendations

## Demo

Try these sample passwords to see the difference in strength:
- `password` - Very weak (dictionary attack will crack instantly)
- `abc123` - Weak (easily cracked)
- `MyP@ssw0rd!` - Moderate strength
- `Tr0ub4dor&3` - Strong password
- `NordPass2024!` - Test your NordPass-style passwords

## How It Works

### Dictionary Attack
Tests your password against a list of common passwords and their variations (uppercase, with numbers, etc.).

### Brute Force Attack
- **Smart Algorithm**: Starts with the exact length of your password
- **Genuine Attempt**: Continues until password is found or 10 million attempts reached
- **No Artificial Limits**: Can handle passwords up to 16 characters
- **Performance Optimized**: Uses efficient generators and allows other requests to process

## Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd passwordBruce
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Production Deployment

### Deploy to Koyeb

1. **Using Git Integration:**
   - Push your code to GitHub
   - Connect your GitHub repository to Koyeb
   - Koyeb will automatically detect the Node.js app and deploy it

2. **Using Docker:**
   - Build the Docker image: `docker build -t password-bruce .`
   - Deploy to Koyeb using their container service

3. **Environment Variables:**
   - `PORT`: The port number (automatically set by Koyeb)
   - `NODE_ENV`: Set to `production`

### Manual Deployment

```bash
# Install dependencies
npm install --production

# Start the server
npm start
```

## API Endpoints

### POST `/api/brute-force`
Performs a brute force attack simulation on the provided password.

**Request Body:**
```json
{
  "targetPassword": "string",
  "method": "dictionary" | "brute-force",
  "maxLength": 12,
  "charset": ["lowercase", "uppercase", "numbers", "symbols"]
}
```

**Response:**
```json
{
  "found": boolean,
  "foundPassword": "string",
  "attempts": number,
  "duration": number,
  "method": "string",
  "strength": "WEAK" | "STRONG",
  "maxAttemptsReached": boolean
}
```

### POST `/api/analyze-password`
Analyzes password strength and provides detailed metrics.

**Request Body:**
```json
{
  "password": "string"
}
```

**Response:**
```json
{
  "length": number,
  "hasLowercase": boolean,
  "hasUppercase": boolean,
  "hasNumbers": boolean,
  "hasSymbols": boolean,
  "entropy": number,
  "estimatedCrackTime": "string",
  "strength": "VERY WEAK" | "WEAK" | "MODERATE" | "STRONG" | "VERY STRONG"
}
```

## Security Considerations

⚠️ **Important**: This tool is for educational purposes only. 

- Never test passwords you don't own
- The brute force has a 10 million attempt safety limit
- All password testing happens server-side
- No passwords are stored or logged
- Server includes progress logging for monitoring

## Password Security Best Practices

1. **Length**: Use at least 12 characters
2. **Complexity**: Include uppercase, lowercase, numbers, and symbols
3. **Uniqueness**: Use different passwords for each account
4. **Avoid**: Dictionary words, personal information, common patterns
5. **Tools**: Consider using a password manager like NordPass

## Technology Stack

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Modern CSS with gradients and animations
- **Icons**: Font Awesome
- **Fonts**: Inter (Google Fonts)

## Performance Characteristics

### Brute Force Algorithm
- **Smart Length Targeting**: Tries the exact password length first
- **Efficient Generation**: Uses JavaScript generators for memory efficiency
- **Progress Monitoring**: Logs progress every 100k attempts
- **Non-blocking**: Yields control every 10k attempts to handle other requests
- **Safety Limits**: Maximum 10 million attempts to prevent infinite loops

### Expected Performance
- **Short passwords (1-4 chars)**: Usually found within seconds
- **Medium passwords (5-8 chars)**: May take minutes to hours depending on complexity
- **Long passwords (9+ chars)**: Will likely hit the 10 million attempt limit (demonstrating strength)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this for educational purposes.

## Disclaimer

This tool is designed for educational and demonstration purposes only. It should not be used for any malicious activities. Always respect others' privacy and security, and only test passwords you own or have explicit permission to test.

The brute force attack is limited to 10 million attempts for practical reasons, but this still demonstrates the relative strength of different password strategies.

---

**Built with ❤️ for password security education** 