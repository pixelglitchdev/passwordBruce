// DOM Elements
const passwordInput = document.getElementById('password');
const methodRadios = document.querySelectorAll('input[name="method"]');
const bruteForceOptions = document.getElementById('bruteForceOptions');
const charsetCheckboxes = document.querySelectorAll('input[name="charset"]');
const maxLengthInput = document.getElementById('maxLength');
const resultsSection = document.getElementById('resultsSection');
const resultsContent = document.getElementById('resultsContent');
const loading = document.getElementById('loading');
const liveProgress = document.getElementById('liveProgress');
const stopButton = document.getElementById('stopButton');

// Live progress elements
const attemptCount = document.getElementById('attemptCount');
const attackRate = document.getElementById('attackRate');
const elapsedTime = document.getElementById('elapsedTime');
const currentPhase = document.getElementById('currentPhase');
const currentPassword = document.getElementById('currentPassword');
const progressMessage = document.getElementById('progressMessage');

// Global variables for attack management
let currentEventSource = null;
let currentSessionId = null;
let attackStartTime = null;

// Event Listeners
methodRadios.forEach(radio => {
    radio.addEventListener('change', toggleBruteForceOptions);
});

passwordInput.addEventListener('input', () => {
    // Hide results when password changes
    resultsSection.style.display = 'none';
    liveProgress.style.display = 'none';
    
    // Auto-adjust max length to password length
    const passwordLength = passwordInput.value.length;
    if (passwordLength > 0) {
        maxLengthInput.value = Math.max(passwordLength, 12);
    }
});

// Initialize
toggleBruteForceOptions();

function generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

function togglePasswordVisibility() {
    const passwordField = document.getElementById('password');
    const toggleButton = document.querySelector('.toggle-password i');
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleButton.className = 'fas fa-eye-slash';
    } else {
        passwordField.type = 'password';
        toggleButton.className = 'fas fa-eye';
    }
}

function toggleBruteForceOptions() {
    const selectedMethod = document.querySelector('input[name="method"]:checked').value;
    bruteForceOptions.style.display = selectedMethod === 'brute-force' ? 'block' : 'none';
}

function getSelectedCharsets() {
    const selected = [];
    charsetCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selected.push(checkbox.value);
        }
    });
    return selected;
}

function showLoading() {
    loading.style.display = 'block';
    resultsSection.style.display = 'none';
    liveProgress.style.display = 'none';
}

function hideLoading() {
    loading.style.display = 'none';
}

function showLiveProgress() {
    liveProgress.style.display = 'block';
    resultsSection.style.display = 'none';
    loading.style.display = 'none';
    stopButton.style.display = 'inline-flex';
}

function hideLiveProgress() {
    liveProgress.style.display = 'none';
    stopButton.style.display = 'none';
}

function showResults(content) {
    resultsContent.innerHTML = content;
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function updateLiveProgress(data) {
    if (data.attempts !== undefined) {
        attemptCount.textContent = formatLargeNumber(data.attempts);
    }
    
    if (data.rate !== undefined) {
        attackRate.textContent = `${formatLargeNumber(data.rate)}/sec`;
    }
    
    if (data.elapsed !== undefined) {
        elapsedTime.textContent = formatDuration(data.elapsed);
    } else if (attackStartTime) {
        const elapsed = Date.now() - attackStartTime;
        elapsedTime.textContent = formatDuration(elapsed);
    }
    
    if (data.phase !== undefined) {
        currentPhase.textContent = data.phase.charAt(0).toUpperCase() + data.phase.slice(1);
    }
    
    if (data.currentPassword !== undefined) {
        currentPassword.textContent = data.currentPassword || '-';
    }
    
    if (data.message !== undefined) {
        progressMessage.textContent = data.message;
    }
}

function stopAttack() {
    if (currentEventSource) {
        currentEventSource.close();
        currentEventSource = null;
    }
    
    hideLiveProgress();
    hideLoading();
    
    showResults(`
        <div class="attack-result attack-failed">
            <h3><i class="fas fa-stop-circle"></i> Attack Stopped</h3>
            <p>The brute force attack was stopped by the user.</p>
        </div>
    `);
}

function connectToProgressStream(sessionId) {
    currentEventSource = new EventSource(`/api/progress/${sessionId}`);
    
    currentEventSource.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            
            switch(data.type) {
                case 'connected':
                    console.log('Connected to progress stream');
                    break;
                    
                case 'progress':
                    updateLiveProgress(data);
                    break;
                    
                case 'found':
                    updateLiveProgress(data);
                    progressMessage.textContent = '🎉 Password found!';
                    currentPassword.style.background = 'rgba(34, 197, 94, 0.2)';
                    currentPassword.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                    break;
                    
                case 'complete':
                    hideLiveProgress();
                    displayBruteForceResults(data);
                    break;
                    
                case 'error':
                    hideLiveProgress();
                    showResults(`
                        <div class="attack-result attack-success">
                            <h3><i class="fas fa-exclamation-triangle"></i> Error</h3>
                            <p>An error occurred: ${data.message}</p>
                        </div>
                    `);
                    break;
            }
        } catch (error) {
            console.error('Error parsing progress data:', error);
        }
    };
    
    currentEventSource.onerror = function(event) {
        console.error('EventSource failed:', event);
        if (currentEventSource.readyState === EventSource.CLOSED) {
            console.log('Progress stream closed');
        }
    };
}

function getStrengthClass(strength) {
    return `strength-${strength.toLowerCase().replace(/\s+/g, '-')}`;
}

function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
    return `${(ms / 3600000).toFixed(2)}h`;
}

function formatLargeNumber(num) {
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
    return `${(num / 1000000000).toFixed(1)}B`;
}

async function startBruteForce() {
    const password = passwordInput.value.trim();
    
    if (!password) {
        alert('Please enter a password to test');
        return;
    }

    const method = document.querySelector('input[name="method"]:checked').value;
    const maxLength = parseInt(maxLengthInput.value) || 12;
    const charset = getSelectedCharsets();

    if (method === 'brute-force' && charset.length === 0) {
        alert('Please select at least one character set for brute force attack');
        return;
    }

    // Warn user about long passwords
    if (method === 'brute-force' && password.length > 8) {
        const confirmed = confirm(
            `Warning: Your password is ${password.length} characters long. ` +
            `Brute force attacks on passwords this long can take an extremely long time. ` +
            `The attack will continue until the password is found or you stop it manually. ` +
            `Do you want to continue?`
        );
        if (!confirmed) return;
    }

    // Generate session ID and start progress stream
    currentSessionId = generateSessionId();
    attackStartTime = Date.now();
    
    // Reset progress display
    attemptCount.textContent = '0';
    attackRate.textContent = '0/sec';
    elapsedTime.textContent = '0s';
    currentPhase.textContent = 'Starting...';
    currentPassword.textContent = '-';
    progressMessage.textContent = 'Initializing attack...';
    currentPassword.style.background = 'rgba(255, 255, 255, 0.1)';
    currentPassword.style.borderColor = 'rgba(255, 255, 255, 0.2)';

    if (method === 'brute-force') {
        showLiveProgress();
        connectToProgressStream(currentSessionId);
    } else {
        showLoading();
    }

    try {
        const response = await fetch('/api/brute-force', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                targetPassword: password,
                method: method,
                maxLength: maxLength,
                charset: charset,
                sessionId: currentSessionId
            })
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Attack failed');
        }

        if (method === 'dictionary') {
            hideLoading();
            displayBruteForceResults(result);
        }
        // For brute force, results are handled by the progress stream

    } catch (error) {
        console.error('Error:', error);
        hideLiveProgress();
        hideLoading();
        showResults(`
            <div class="attack-result attack-success">
                <h3><i class="fas fa-exclamation-triangle"></i> Error</h3>
                <p>An error occurred: ${error.message}</p>
            </div>
        `);
    }
}

function displayBruteForceResults(result) {
    const { found, foundPassword, attempts, duration, method, strength } = result;
    
    const attackClass = found ? 'attack-success' : 'attack-failed';
    const icon = found ? 'fas fa-times-circle' : 'fas fa-shield-alt';
    const title = found ? 'Password Cracked!' : 'Password Secure!';
    
    let message;
    if (found) {
        message = `Your password was found using ${method} attack!`;
    } else {
        message = `Your password withstood the ${method} attack!`;
    }

    const resultsHTML = `
        <div class="attack-result ${attackClass}">
            <h3><i class="${icon}"></i> ${title}</h3>
            <p>${message}</p>
            ${found ? `<p><strong>Found password:</strong> "${foundPassword}"</p>` : ''}
        </div>
        
        <div style="padding: 25px;">
            <div class="result-item">
                <span class="result-label">Attack Method</span>
                <span class="result-value">${method === 'dictionary' ? 'Dictionary Attack' : 'Brute Force Attack'}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Attempts Made</span>
                <span class="result-value">${formatLargeNumber(attempts)} (${attempts.toLocaleString()})</span>
            </div>
            <div class="result-item">
                <span class="result-label">Time Taken</span>
                <span class="result-value">${formatDuration(duration)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Attack Rate</span>
                <span class="result-value">${formatLargeNumber(Math.round(attempts / (duration / 1000)))} attempts/sec</span>
            </div>
            <div class="result-item">
                <span class="result-label">Password Strength</span>
                <span class="strength-indicator ${getStrengthClass(strength)}">${strength}</span>
            </div>
            ${found ? '' : '<div class="result-item"><span class="result-label">Status</span><span class="result-value" style="color: #059669;">✓ Attack Unsuccessful</span></div>'}
        </div>
    `;

    showResults(resultsHTML);
}

async function analyzePassword() {
    const password = passwordInput.value.trim();
    
    if (!password) {
        alert('Please enter a password to analyze');
        return;
    }

    showLoading();

    try {
        const response = await fetch('/api/analyze-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password })
        });

        const analysis = await response.json();
        
        if (!response.ok) {
            throw new Error(analysis.error || 'Analysis failed');
        }

        displayPasswordAnalysis(analysis);
    } catch (error) {
        console.error('Error:', error);
        showResults(`
            <div class="attack-result attack-success">
                <h3><i class="fas fa-exclamation-triangle"></i> Error</h3>
                <p>An error occurred: ${error.message}</p>
            </div>
        `);
    } finally {
        hideLoading();
    }
}

function displayPasswordAnalysis(analysis) {
    const {
        length,
        hasLowercase,
        hasUppercase,
        hasNumbers,
        hasSymbols,
        hasUTF8,
        entropy,
        estimatedCrackTime,
        strength
    } = analysis;

    const strengthClass = getStrengthClass(strength);
    
    const resultsHTML = `
        <div style="padding: 25px;">
            <div class="result-item">
                <span class="result-label">Password Length</span>
                <span class="result-value">${length} characters</span>
            </div>
            <div class="result-item">
                <span class="result-label">Character Types</span>
                <span class="result-value">
                    ${hasLowercase ? '✓ Lowercase ' : '✗ Lowercase '}
                    ${hasUppercase ? '✓ Uppercase ' : '✗ Uppercase '}
                    ${hasNumbers ? '✓ Numbers ' : '✗ Numbers '}
                    ${hasSymbols ? '✓ Symbols ' : '✗ Symbols '}
                    ${hasUTF8 ? '✓ UTF-8' : '✗ UTF-8'}
                </span>
            </div>
            <div class="result-item">
                <span class="result-label">Entropy</span>
                <span class="result-value">${entropy.toFixed(1)} bits</span>
            </div>
            <div class="result-item">
                <span class="result-label">Estimated Crack Time</span>
                <span class="result-value">${estimatedCrackTime}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Overall Strength</span>
                <span class="strength-indicator ${strengthClass}">${strength}</span>
            </div>
        </div>
        
        <div style="padding: 0 25px 25px;">
            <h4 style="margin-bottom: 15px; color: #374151;">Recommendations:</h4>
            <ul style="list-style: none; padding: 0;">
                ${length < 12 ? '<li style="color: #dc2626; margin-bottom: 8px;">• Increase length to at least 12 characters</li>' : ''}
                ${!hasLowercase ? '<li style="color: #dc2626; margin-bottom: 8px;">• Add lowercase letters</li>' : ''}
                ${!hasUppercase ? '<li style="color: #dc2626; margin-bottom: 8px;">• Add uppercase letters</li>' : ''}
                ${!hasNumbers ? '<li style="color: #dc2626; margin-bottom: 8px;">• Add numbers</li>' : ''}
                ${!hasSymbols ? '<li style="color: #dc2626; margin-bottom: 8px;">• Add special symbols</li>' : ''}
                ${!hasUTF8 ? '<li style="color: #059669; margin-bottom: 8px;">• Consider UTF-8 characters for extra security</li>' : ''}
                ${strength === 'VERY STRONG' ? '<li style="color: #059669; margin-bottom: 8px;">• Excellent! This is a strong password</li>' : ''}
            </ul>
        </div>
    `;

    showResults(resultsHTML);
}

// Add some demo passwords for testing
function addDemoPassword(password) {
    passwordInput.value = password;
    passwordInput.focus();
    
    // Trigger the input event to update max length
    passwordInput.dispatchEvent(new Event('input'));
}

// Add demo buttons (you can remove this in production)
document.addEventListener('DOMContentLoaded', () => {
    const demoSection = document.createElement('div');
    demoSection.style.cssText = 'text-align: center; margin: 20px 0; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 12px;';
    demoSection.innerHTML = `
        <h4 style="color: white; margin-bottom: 15px;">Quick Test Passwords:</h4>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
            <button onclick="addDemoPassword('password')" class="btn" style="background: rgba(255,255,255,0.2); color: white; padding: 8px 16px; font-size: 0.9rem;">password</button>
            <button onclick="addDemoPassword('abc123')" class="btn" style="background: rgba(255,255,255,0.2); color: white; padding: 8px 16px; font-size: 0.9rem;">abc123</button>
            <button onclick="addDemoPassword('test')" class="btn" style="background: rgba(255,255,255,0.2); color: white; padding: 8px 16px; font-size: 0.9rem;">test</button>
            <button onclick="addDemoPassword('café123')" class="btn" style="background: rgba(255,255,255,0.2); color: white; padding: 8px 16px; font-size: 0.9rem;">café123</button>
            <button onclick="addDemoPassword('🔐pass')" class="btn" style="background: rgba(255,255,255,0.2); color: white; padding: 8px 16px; font-size: 0.9rem;">🔐pass</button>
        </div>
    `;
    
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(demoSection, mainContent.firstChild);
}); 