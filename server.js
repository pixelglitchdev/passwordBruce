const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Store active attack sessions
const activeSessions = new Map();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts for demo purposes
}));
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Character sets for brute force
const charSets = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  extended: 'àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ',
  utf8_basic: '€£¥§©®™°±×÷',
  utf8_extended: '😀😃😄😁😆😅🤣😂🙂🙃😉😊😇🥰😍🤩😘😗☺️😚😙🥲😋😛😜🤪😝🤑🤗🤭🤫🤔🤐🤨😐😑😶😏😒🙄😬🤥😌😔😪🤤😴😷🤒🤕🤢🤮🤧🥵🥶🥴😵🤯🤠🥳🥸😎🤓🧐😕😟🙁☹️😮😯😲😳🥺😦😧😨😰😥😢😭😱😖😣😞😓😩😫🥱😤😡😠🤬😈👿💀☠️💩🤡👹👺👻👽👾🤖😺😸😹😻😼😽🙀😿😾🙈🙉🙊'
};

// Generate full UTF-8 character set
function generateUTF8CharSet() {
  let charset = '';
  
  // Basic ASCII printable characters (32-126)
  for (let i = 32; i <= 126; i++) {
    charset += String.fromCharCode(i);
  }
  
  // Extended Latin characters (128-255)
  for (let i = 128; i <= 255; i++) {
    charset += String.fromCharCode(i);
  }
  
  // Common Unicode characters
  charset += charSets.extended;
  charset += charSets.utf8_basic;
  
  // Remove duplicates
  return [...new Set(charset)].join('');
}

// More efficient brute force generator that yields combinations in order
function* generateCombinations(charset, targetLength, startLength = 1) {
  // Generate combinations of specific length
  function* generateLength(length) {
    if (length === 0) {
      yield '';
      return;
    }
    
    for (let char of charset) {
      for (let rest of generateLength(length - 1)) {
        yield char + rest;
      }
    }
  }
  
  // Try lengths from startLength up to targetLength
  for (let len = startLength; len <= targetLength; len++) {
    yield* generateLength(len);
  }
}

// Optimized brute force that focuses on the target password length first
function* smartBruteForce(charset, targetPassword, sessionId) {
  const targetLength = targetPassword.length;
  
  // First, try the exact length of the target password
  console.log(`Starting brute force for length ${targetLength}`);
  yield* generateCombinations(charset, targetLength, targetLength);
  
  // If not found, try shorter lengths (in case user made a mistake)
  if (targetLength > 1) {
    console.log(`Trying shorter lengths...`);
    yield* generateCombinations(charset, targetLength - 1, 1);
  }
  
  // Finally, try longer lengths up to a reasonable limit
  const maxLength = Math.min(targetLength + 2, 16); // Cap at 16 characters for sanity
  if (targetLength < maxLength) {
    console.log(`Trying longer lengths up to ${maxLength}...`);
    yield* generateCombinations(charset, maxLength, targetLength + 1);
  }
}

// Dictionary attack words (common passwords)
const commonPasswords = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'dragon',
  'master', 'hello', 'login', 'pass', 'admin123', 'root', 'user',
  'test', 'guest', 'info', 'service', 'office', 'internet', 'computer'
];

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Server-Sent Events endpoint for live progress
app.get('/api/progress/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Store the response object for this session
  if (!activeSessions.has(sessionId)) {
    activeSessions.set(sessionId, { res, startTime: Date.now() });
  }

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    activeSessions.delete(sessionId);
    console.log(`Session ${sessionId} disconnected`);
  });
});

// Function to send progress updates
function sendProgress(sessionId, data) {
  const session = activeSessions.get(sessionId);
  if (session && session.res) {
    try {
      session.res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error(`Error sending progress to session ${sessionId}:`, error);
      activeSessions.delete(sessionId);
    }
  }
}

app.post('/api/brute-force', async (req, res) => {
  const { targetPassword, method, maxLength = 12, charset = ['lowercase'], sessionId } = req.body;
  
  if (!targetPassword) {
    return res.status(400).json({ error: 'Target password is required' });
  }

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required for live updates' });
  }

  const startTime = Date.now();
  let attempts = 0;
  let found = false;
  let foundPassword = '';

  try {
    if (method === 'dictionary') {
      // Dictionary attack
      sendProgress(sessionId, { 
        type: 'progress', 
        message: 'Starting dictionary attack...', 
        attempts: 0,
        currentPassword: '',
        phase: 'dictionary'
      });

      for (let password of commonPasswords) {
        attempts++;
        
        sendProgress(sessionId, { 
          type: 'progress', 
          message: `Trying common passwords...`, 
          attempts,
          currentPassword: password,
          phase: 'dictionary'
        });

        if (password === targetPassword) {
          found = true;
          foundPassword = password;
          break;
        }
        
        // Also try common variations
        const variations = [
          password.toUpperCase(),
          password.charAt(0).toUpperCase() + password.slice(1),
          password + '123',
          password + '!',
          '123' + password,
          password + '1',
          password + '12',
          password + '2023',
          password + '2024'
        ];
        
        for (let variation of variations) {
          attempts++;
          
          sendProgress(sessionId, { 
            type: 'progress', 
            message: `Trying variations...`, 
            attempts,
            currentPassword: variation,
            phase: 'dictionary'
          });

          if (variation === targetPassword) {
            found = true;
            foundPassword = variation;
            break;
          }
        }
        
        if (found) break;
      }
    } else {
      // Brute force attack
      let selectedCharset = '';
      
      if (Array.isArray(charset)) {
        if (charset.includes('lowercase')) selectedCharset += charSets.lowercase;
        if (charset.includes('uppercase')) selectedCharset += charSets.uppercase;
        if (charset.includes('numbers')) selectedCharset += charSets.numbers;
        if (charset.includes('symbols')) selectedCharset += charSets.symbols;
        if (charset.includes('utf8')) selectedCharset += generateUTF8CharSet();
      } else {
        // Handle legacy string format
        if (charset.includes('lowercase')) selectedCharset += charSets.lowercase;
        if (charset.includes('uppercase')) selectedCharset += charSets.uppercase;
        if (charset.includes('numbers')) selectedCharset += charSets.numbers;
        if (charset.includes('symbols')) selectedCharset += charSets.symbols;
        if (charset.includes('utf8')) selectedCharset += generateUTF8CharSet();
      }
      
      if (!selectedCharset) selectedCharset = charSets.lowercase;
      
      console.log(`Starting brute force attack on password: "${targetPassword}"`);
      console.log(`Character set size: ${selectedCharset.length}`);
      console.log(`Target length: ${targetPassword.length}`);
      
      sendProgress(sessionId, { 
        type: 'progress', 
        message: `Starting brute force attack...`, 
        attempts: 0,
        currentPassword: '',
        phase: 'brute-force',
        charsetSize: selectedCharset.length,
        targetLength: targetPassword.length
      });
      
      // Use smart brute force that prioritizes the target password length
      const generator = smartBruteForce(selectedCharset, targetPassword, sessionId);
      
      for (let combination of generator) {
        attempts++;
        
        if (combination === targetPassword) {
          found = true;
          foundPassword = combination;
          console.log(`Password found: "${foundPassword}" after ${attempts} attempts`);
          
          sendProgress(sessionId, { 
            type: 'found', 
            message: `Password found!`, 
            attempts,
            currentPassword: foundPassword,
            phase: 'complete'
          });
          
          break;
        }
        
        // Progress updates every 1000 attempts for responsiveness
        if (attempts % 1000 === 0) {
          const elapsed = Date.now() - startTime;
          const rate = attempts / (elapsed / 1000);
          
          sendProgress(sessionId, { 
            type: 'progress', 
            message: `Trying combinations...`, 
            attempts,
            currentPassword: combination,
            phase: 'brute-force',
            rate: Math.round(rate),
            elapsed
          });
        }
        
        // Console logging every 100k attempts
        if (attempts % 100000 === 0) {
          console.log(`Attempted ${attempts} combinations, current: "${combination}"`);
        }
        
        // Allow other requests to be processed every 10k attempts
        if (attempts % 10000 === 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`Attack completed: Found=${found}, Attempts=${attempts}, Duration=${duration}ms`);

    // Send final result
    sendProgress(sessionId, { 
      type: 'complete', 
      found,
      foundPassword,
      attempts,
      duration,
      method
    });

    // Clean up session
    setTimeout(() => {
      const session = activeSessions.get(sessionId);
      if (session && session.res) {
        session.res.end();
      }
      activeSessions.delete(sessionId);
    }, 1000);

    res.json({
      found,
      foundPassword,
      attempts,
      duration,
      method,
      strength: found ? 'WEAK' : 'STRONG',
      sessionId
    });

  } catch (error) {
    console.error('Brute force error:', error);
    
    sendProgress(sessionId, { 
      type: 'error', 
      message: error.message 
    });
    
    res.status(500).json({ error: 'An error occurred during brute force attempt' });
  }
});

app.post('/api/analyze-password', (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const analysis = {
    length: password.length,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSymbols: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    hasUTF8: /[^\x00-\x7F]/.test(password),
    entropy: 0,
    estimatedCrackTime: ''
  };

  // Calculate character space
  let charSpace = 0;
  if (analysis.hasLowercase) charSpace += 26;
  if (analysis.hasUppercase) charSpace += 26;
  if (analysis.hasNumbers) charSpace += 10;
  if (analysis.hasSymbols) charSpace += 32;
  if (analysis.hasUTF8) charSpace += 1000; // Rough estimate for UTF-8 characters

  // Calculate entropy
  analysis.entropy = Math.log2(Math.pow(charSpace, password.length));

  // Estimate crack time (assuming 1 billion attempts per second)
  const totalCombinations = Math.pow(charSpace, password.length);
  const averageAttempts = totalCombinations / 2;
  const secondsToCrack = averageAttempts / 1000000000;

  if (secondsToCrack < 60) {
    analysis.estimatedCrackTime = `${Math.round(secondsToCrack)} seconds`;
  } else if (secondsToCrack < 3600) {
    analysis.estimatedCrackTime = `${Math.round(secondsToCrack / 60)} minutes`;
  } else if (secondsToCrack < 86400) {
    analysis.estimatedCrackTime = `${Math.round(secondsToCrack / 3600)} hours`;
  } else if (secondsToCrack < 31536000) {
    analysis.estimatedCrackTime = `${Math.round(secondsToCrack / 86400)} days`;
  } else if (secondsToCrack < 31536000000) {
    analysis.estimatedCrackTime = `${Math.round(secondsToCrack / 31536000)} years`;
  } else {
    analysis.estimatedCrackTime = `${(secondsToCrack / 31536000).toExponential(2)} years`;
  }

  // Determine strength
  let strength = 'VERY WEAK';
  if (analysis.entropy > 60) strength = 'VERY STRONG';
  else if (analysis.entropy > 40) strength = 'STRONG';
  else if (analysis.entropy > 25) strength = 'MODERATE';
  else if (analysis.entropy > 15) strength = 'WEAK';

  analysis.strength = strength;

  res.json(analysis);
});

app.listen(PORT, () => {
  console.log(`Password Bruce server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to test password strength`);
}); 