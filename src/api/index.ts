import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { client, graphql } from "ponder";
import { readFile } from "fs/promises";
import { join } from "path";

const app = new Hono();

// Serve static files - simple SVG responses
app.get("/static/icon.svg", (c) => {
  return c.html(`<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="200" height="200" rx="40" fill="#0066cc"/>
<text x="100" y="110" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white">OTC</text>
<path d="M50 130 L70 150 L150 150 L170 130" stroke="white" stroke-width="4" fill="none"/>
</svg>`, { headers: { "Content-Type": "image/svg+xml" } });
});

app.get("/static/og-image.svg", (c) => {
  return c.html(`<svg width="600" height="400" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="600" height="400" fill="url(#gradient)"/>
<text x="300" y="150" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white">OverTheCounter</text>
<text x="300" y="200" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="#b0bec5">Trade tokens directly on-chain</text>
<circle cx="200" cy="300" r="40" fill="white" fill-opacity="0.2"/>
<circle cx="400" cy="300" r="40" fill="white" fill-opacity="0.2"/>
<path d="M240 300 L360 300" stroke="white" stroke-width="4" marker-end="url(#arrowhead)"/>
<defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="white" />
    </marker>
</defs>
</svg>`, { headers: { "Content-Type": "image/svg+xml" } });
});

// Serve PNG image
app.get("/static/image.png", async (c) => {
  try {
    const imagePath = join(process.cwd(), "static", "image.png");
    const imageBuffer = await readFile(imagePath);
    return c.body(imageBuffer, 200, { "Content-Type": "image/png" });
  } catch (error) {
    return c.text("Image not found", 404);
  }
});

// Farcaster miniapp manifest
app.get("/.well-known/farcaster.json", (c) => {
  const manifest = {
    accountAssociation: {
      header: process.env.MANIFEST_HEADER || "",
      payload: process.env.MANIFEST_PAYLOAD || "",
      signature: process.env.MANIFEST_SIGNATURE || ""
    },
    miniapp: {
      version: "1",
      name: "OverTheCounter",
      iconUrl: `${process.env.BASE_URL || 'https://miniapp.anky.app'}/static/icon.svg`,
      homeUrl: process.env.BASE_URL || 'https://miniapp.anky.app',
      imageUrl: `${process.env.BASE_URL || 'https://miniapp.anky.app'}/static/image.png`,
      buttonTitle: "Trade Tokens",
      splashImageUrl: `${process.env.BASE_URL || 'https://miniapp.anky.app'}/static/icon.svg`,
      splashBackgroundColor: "#1a1a1a"
    }
  };
  return c.json(manifest);
});

// Main page - Create listing form
app.get("/", (c) => {
  const baseUrl = process.env.BASE_URL || 'https://miniapp.anky.app';
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OverTheCounter - Create Listing</title>
    <meta name="fc:miniapp" content='{"version":"1","imageUrl":"${baseUrl}/static/image.png","button":{"title":"Trade Tokens","action":{"type":"launch_miniapp","name":"OverTheCounter","url":"${baseUrl}","splashImageUrl":"${baseUrl}/static/icon.svg","splashBackgroundColor":"#1a1a1a"}}}' />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap">
    <script type="module" src="https://esm.sh/@farcaster/miniapp-sdk"></script>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: 'Comic Neue', 'Comic Sans MS', cursive, sans-serif;
            max-width: 400px;
            margin: 0 auto;
            padding: 20px;
            background: #008080;
            background-image: 
                repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px),
                repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
            min-height: 100vh;
        }
        .container {
            background: #c0c0c0;
            border: 2px outset #c0c0c0;
            padding: 8px;
            box-shadow: 
                inset -1px -1px 0px #000,
                inset 1px 1px 0px #fff,
                2px 2px 4px rgba(0,0,0,0.3);
        }
        .window-title {
            background: linear-gradient(to right, #000080, #1084d0);
            color: white;
            padding: 4px 8px;
            font-weight: bold;
            font-size: 11px;
            margin: -8px -8px 8px -8px;
            border-bottom: 1px solid #000;
            display: flex;
            align-items: center;
            height: 20px;
        }
        .window-content {
            background: #c0c0c0;
            padding: 16px;
        }
        h1 {
            color: #000;
            margin: 0 0 8px 0;
            font-size: 20px;
            font-weight: bold;
            text-shadow: 1px 1px 0px rgba(255,255,255,0.5);
        }
        .subtitle {
            color: #000;
            margin-bottom: 16px;
            font-size: 12px;
        }
        .form-group {
            margin-bottom: 16px;
        }
        label {
            display: block;
            margin-bottom: 4px;
            font-weight: bold;
            color: #000;
            font-size: 12px;
        }
        input {
            width: 100%;
            padding: 4px;
            border: 2px inset #c0c0c0;
            background: #fff;
            font-family: 'Comic Neue', 'Comic Sans MS', cursive, sans-serif;
            font-size: 12px;
            box-sizing: border-box;
        }
        input:focus {
            outline: 1px dotted #000;
            outline-offset: -2px;
        }
        .button {
            width: 100%;
            padding: 8px 16px;
            background: #c0c0c0;
            color: #000;
            border: 2px outset #c0c0c0;
            font-family: 'Comic Neue', 'Comic Sans MS', cursive, sans-serif;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            text-align: center;
            box-shadow: 
                inset -1px -1px 0px #000,
                inset 1px 1px 0px #fff;
        }
        .button:active {
            border: 2px inset #c0c0c0;
            box-shadow: 
                inset 1px 1px 0px #000,
                inset -1px -1px 0px #fff;
        }
        .button:hover:not(:disabled) {
            background: #d4d0c8;
        }
        .button:disabled {
            background: #c0c0c0;
            color: #808080;
            cursor: not-allowed;
            border: 2px inset #c0c0c0;
            box-shadow: 
                inset 1px 1px 0px #808080,
                inset -1px -1px 0px #fff;
        }
        .share-button {
            margin-top: 12px;
        }
        .success-message {
            background: #c0c0c0;
            color: #000;
            padding: 12px;
            border: 2px inset #c0c0c0;
            margin-bottom: 16px;
            display: none;
            font-size: 12px;
        }
        .error-message {
            background: #c0c0c0;
            color: #000;
            padding: 12px;
            border: 2px inset #c0c0c0;
            margin-bottom: 16px;
            display: none;
            font-size: 12px;
        }
        .step {
            display: none;
        }
        .step.active {
            display: block;
        }
        .balance-display {
            background: #fff;
            border: 2px inset #c0c0c0;
            padding: 12px;
            margin-bottom: 16px;
            font-size: 12px;
        }
        .balance-label {
            font-weight: bold;
            margin-bottom: 8px;
        }
        .balance-value {
            font-size: 14px;
            word-break: break-all;
        }
        .slider-container {
            margin-bottom: 16px;
        }
        .slider-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 12px;
        }
        input[type="range"] {
            width: 100%;
            height: 20px;
            -webkit-appearance: none;
            appearance: none;
            background: #c0c0c0;
            border: 2px inset #c0c0c0;
            outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            background: #c0c0c0;
            border: 2px outset #c0c0c0;
            cursor: pointer;
            box-shadow: 
                inset -1px -1px 0px #000,
                inset 1px 1px 0px #fff;
        }
        input[type="range"]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: #c0c0c0;
            border: 2px outset #c0c0c0;
            cursor: pointer;
            box-shadow: 
                inset -1px -1px 0px #000,
                inset 1px 1px 0px #fff;
        }
        .loading {
            text-align: center;
            padding: 12px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="window-title">OverTheCounter</div>
        <div class="window-content">
            <h1>OverTheCounter</h1>
            <p class="subtitle">Create a new token listing</p>
            
            <div id="success-message" class="success-message"></div>
            <div id="error-message" class="error-message"></div>
            
            <form id="create-listing-form">
                <!-- Step 1: Contract Address -->
                <div class="step active" id="step1">
                    <div class="form-group">
                        <label for="token">Token Contract Address</label>
                        <input type="text" id="token" name="token" placeholder="0x..." required>
                    </div>
                    <button type="button" class="button" id="next-step1">
                        NEXT →
                    </button>
                </div>
                
                <!-- Step 2: Loading Balance -->
                <div class="step" id="step2">
                    <div class="loading">Loading your balance...</div>
                </div>
                
                <!-- Step 2.5: No Balance - Buy Token -->
                <div class="step" id="step2-no-balance">
                    <div class="balance-display">
                        <div class="balance-label">You don't have any of this token</div>
                        <div style="margin-top: 16px; font-size: 12px;">Buy some tokens to create a listing!</div>
                    </div>
                    <button type="button" class="button" id="buy-token-button">
                        BUY TOKEN
                    </button>
                    <button type="button" class="button" id="back-to-step1" style="margin-top: 12px;">
                        ← Back
                    </button>
                </div>
                
                <!-- Step 3: Balance & Slider -->
                <div class="step" id="step3">
                    <div class="balance-display">
                        <div class="balance-label">Your Balance:</div>
                        <div class="balance-value" id="balance-display">0</div>
                    </div>
                    <div class="slider-container">
                        <div class="slider-label">
                            <span>Amount to Sell:</span>
                            <span id="amount-display">0</span>
                        </div>
                        <input type="range" id="amount-slider" min="0" max="100" value="0" step="1">
                        <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 10px;">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>
                    <button type="button" class="button" id="next-step3">
                        NEXT →
                    </button>
                </div>
                
                <!-- Step 4: Price Input -->
                <div class="step" id="step4">
                    <div class="form-group">
                        <label for="usdcPrice">USDC Price (total)</label>
                        <input type="text" id="usdcPrice" name="usdcPrice" placeholder="1000000" required>
                        <small style="font-size: 10px; color: #666; display: block; margin-top: 4px;">Price in USDC (6 decimals)</small>
                    </div>
                    <button type="submit" class="button" id="create-button">
                        CREATE LISTING
                    </button>
                </div>
            </form>
        
        <div id="share-section" style="display: none;">
            <button type="button" class="button share-button" id="share-button">
                SHARE LISTING
            </button>
        </div>
        </div>
    </div>

    <script type="module">
        import { sdk } from 'https://esm.sh/@farcaster/miniapp-sdk';
        
        let createdListingId = null;
        let userBalance = null;
        let tokenAddress = null;
        let tokenDecimals = 18; // Default, will try to fetch
        let userAccount = null;
        
        // OverTheCounter contract details
        const CONTRACT_ADDRESS = '${process.env.CONTRACT_ADDRESS || '0x...'}';
        
        // ERC20 balanceOf function selector: balanceOf(address)
        const ERC20_BALANCEOF = '0x70a08231';
        // ERC20 decimals() function selector
        const ERC20_DECIMALS = '0x313ce567';
        
        // Initialize SDK when page loads
        async function initializeApp() {
            try {
                await sdk.actions.ready();
                console.log('Farcaster SDK ready');
            } catch (error) {
                console.log('Not in Farcaster miniapp context:', error);
            }
        }
        
        // Get ethereum provider
        async function getEthereumProvider() {
            try {
                return await sdk.wallet.getEthereumProvider();
            } catch (error) {
                console.log('Using window.ethereum fallback');
                return window.ethereum;
            }
        }
        
        // Get user account
        async function getUserAccount() {
            if (userAccount) return userAccount;
            const provider = await getEthereumProvider();
            if (!provider) {
                throw new Error('No Ethereum provider found');
            }
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            return userAccount;
        }
        
        // Call ERC20 balanceOf
        async function getTokenBalance(tokenAddress, userAddress) {
            const provider = await getEthereumProvider();
            if (!provider) {
                throw new Error('No Ethereum provider found');
            }
            
            // Encode balanceOf(address) call
            const addressPadded = userAddress.slice(2).padStart(64, '0');
            const data = ERC20_BALANCEOF + addressPadded;
            
            const result = await provider.request({
                method: 'eth_call',
                params: [{
                    to: tokenAddress,
                    data: data
                }, 'latest']
            });
            
            return BigInt(result);
        }
        
        // Get token decimals
        async function getTokenDecimals(tokenAddress) {
            try {
                const provider = await getEthereumProvider();
                if (!provider) return 18;
                
                const result = await provider.request({
                    method: 'eth_call',
                    params: [{
                        to: tokenAddress,
                        data: ERC20_DECIMALS
                    }, 'latest']
                });
                
                return parseInt(result, 16);
            } catch (error) {
                console.log('Could not fetch decimals, using 18');
                return 18;
            }
        }
        
        // Format token amount for display
        function formatTokenAmount(amount, decimals = 18) {
            const divisor = BigInt(10 ** decimals);
            const wholePart = amount / divisor;
            const fractionalPart = amount % divisor;
            
            if (fractionalPart === 0n) {
                return wholePart.toString();
            }
            
            const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
            const trimmedFractional = fractionalStr.replace(/0+$/, '');
            
            return trimmedFractional ? \`\${wholePart}.\${trimmedFractional}\` : wholePart.toString();
        }
        
        // Show step
        function showStep(stepNumber) {
            document.querySelectorAll('.step').forEach(step => {
                step.classList.remove('active');
            });
            const stepId = typeof stepNumber === 'string' ? stepNumber : \`step\${stepNumber}\`;
            document.getElementById(stepId).classList.add('active');
        }
        
        // Update amount display from slider
        function updateAmountDisplay() {
            const slider = document.getElementById('amount-slider');
            const percentage = parseInt(slider.value);
            
            if (!userBalance || userBalance === 0n) {
                document.getElementById('amount-display').textContent = '0';
                return;
            }
            
            const amount = (userBalance * BigInt(percentage)) / 100n;
            document.getElementById('amount-display').textContent = formatTokenAmount(amount, tokenDecimals);
        }
        
        // Create listing on smart contract
        async function createListing(token, tokenAmount, usdcPrice) {
            const provider = await getEthereumProvider();
            
            if (!provider) {
                throw new Error('No Ethereum provider found');
            }
            
            // Request account access
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            
            // Encode createListing function call
            const functionSelector = '0x' + '4f7b6db1'; // createListing(address,uint256,uint256)
            const tokenPadded = token.slice(2).padStart(64, '0');
            const tokenAmountPadded = BigInt(tokenAmount).toString(16).padStart(64, '0');
            const usdcPricePadded = BigInt(usdcPrice).toString(16).padStart(64, '0');
            
            const data = functionSelector + tokenPadded + tokenAmountPadded + usdcPricePadded;
            
            // Prepare transaction
            const tx = {
                to: CONTRACT_ADDRESS,
                from: account,
                data: data
            };
            
            // Send transaction
            const txHash = await provider.request({
                method: 'eth_sendTransaction',
                params: [tx]
            });
            
            // Wait for transaction receipt
            let receipt = null;
            while (!receipt) {
                try {
                    receipt = await provider.request({
                        method: 'eth_getTransactionReceipt',
                        params: [txHash]
                    });
                    if (!receipt) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } catch (error) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            // Extract listing ID from logs (simplified - would need proper log decoding)
            return receipt.logs.length > 0 ? Date.now() : Date.now();
        }
        
        // Step 1: Handle contract address input
        document.getElementById('next-step1').addEventListener('click', async () => {
            const tokenInput = document.getElementById('token');
            const errorMessage = document.getElementById('error-message');
            const successMessage = document.getElementById('success-message');
            
            tokenAddress = tokenInput.value.trim();
            
            if (!tokenAddress || !tokenAddress.startsWith('0x') || tokenAddress.length !== 42) {
                errorMessage.textContent = 'Please enter a valid contract address';
                errorMessage.style.display = 'block';
                return;
            }
            
            try {
                errorMessage.style.display = 'none';
                successMessage.style.display = 'none';
                
                // Move to loading step
                showStep(2);
                
                // Get user account
                const account = await getUserAccount();
                
                // Fetch balance and decimals
                const [balance, decimals] = await Promise.all([
                    getTokenBalance(tokenAddress, account),
                    getTokenDecimals(tokenAddress)
                ]);
                
                userBalance = balance;
                tokenDecimals = decimals;
                
                if (userBalance === 0n) {
                    // Show no balance step with buy button
                    showStep('step2-no-balance');
                    return;
                }
                
                // Show balance and slider step
                document.getElementById('balance-display').textContent = formatTokenAmount(userBalance, tokenDecimals);
                updateAmountDisplay(); // Initialize slider display
                showStep(3);
                
            } catch (error) {
                console.error('Error fetching balance:', error);
                errorMessage.textContent = \`Error: \${error.message}\`;
                errorMessage.style.display = 'block';
                showStep(1);
            }
        });
        
        // Handle buy token button (no balance step)
        document.getElementById('buy-token-button').addEventListener('click', async () => {
            try {
                // USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
                // Format: eip155:8453/erc20:{address}
                await sdk.actions.swapToken({
                    sellToken: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
                    buyToken: \`eip155:8453/erc20:\${tokenAddress}\`,
                    sellAmount: "1000000", // 1 USDC (6 decimals)
                });
                
                // After swap, refresh balance
                const account = await getUserAccount();
                const balance = await getTokenBalance(tokenAddress, account);
                userBalance = balance;
                
                if (userBalance > 0n) {
                    document.getElementById('balance-display').textContent = formatTokenAmount(userBalance, tokenDecimals);
                    updateAmountDisplay();
                    showStep(3);
                }
            } catch (error) {
                console.error('Error swapping token:', error);
                const errorMessage = document.getElementById('error-message');
                errorMessage.textContent = \`Error: \${error.message}\`;
                errorMessage.style.display = 'block';
            }
        });
        
        // Handle back button from no balance step
        document.getElementById('back-to-step1').addEventListener('click', () => {
            showStep(1);
        });
        
        // Step 3: Handle slider and move to price step
        document.getElementById('amount-slider').addEventListener('input', updateAmountDisplay);
        document.getElementById('next-step3').addEventListener('click', () => {
            const slider = document.getElementById('amount-slider');
            const percentage = parseInt(slider.value);
            
            if (percentage === 0) {
                const errorMessage = document.getElementById('error-message');
                errorMessage.textContent = 'Please select an amount to sell';
                errorMessage.style.display = 'block';
                return;
            }
            
            showStep(4);
        });
        
        // Handle form submission
        document.getElementById('create-listing-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitButton = document.getElementById('create-button');
            const successMessage = document.getElementById('success-message');
            const errorMessage = document.getElementById('error-message');
            
            try {
                submitButton.disabled = true;
                submitButton.textContent = 'CREATING...';
                
                // Hide previous messages
                successMessage.style.display = 'none';
                errorMessage.style.display = 'none';
                
                const usdcPrice = document.getElementById('usdcPrice').value;
                const slider = document.getElementById('amount-slider');
                const percentage = parseInt(slider.value);
                const tokenAmount = (userBalance * BigInt(percentage)) / 100n;
                
                // Create listing
                const listingId = await createListing(tokenAddress, tokenAmount.toString(), usdcPrice);
                createdListingId = listingId;
                
                // Show success message
                successMessage.textContent = \`Listing created successfully! ID: \${listingId}\`;
                successMessage.style.display = 'block';
                
                // Show share section
                document.getElementById('share-section').style.display = 'block';
                
                // Reset form
                e.target.reset();
                showStep(1);
                
            } catch (error) {
                console.error('Error creating listing:', error);
                errorMessage.textContent = \`Error: \${error.message}\`;
                errorMessage.style.display = 'block';
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'CREATE LISTING';
            }
        });
        
        // Handle share button
        document.getElementById('share-button').addEventListener('click', async () => {
            if (!createdListingId) return;
            
            try {
                const baseUrl = '${baseUrl}';
                await sdk.actions.composeCast({
                    text: \`I'm selling tokens for USDC on OverTheCounter! 🚀\`,
                    embeds: [\`\${baseUrl}/listing/\${createdListingId}\`]
                });
            } catch (error) {
                console.error('Error sharing listing:', error);
                alert('Error sharing listing: ' + error.message);
            }
        });
        
        // Initialize app
        initializeApp();
    </script>
</body>
</html>
  `);
});

// Listing detail page
app.get("/listing/:id", async (c) => {
  const listingId = c.req.param('id');
  const baseUrl = process.env.BASE_URL || 'https://miniapp.anky.app';
  
  // TODO: Fetch real listing data from database
  // For now, we'll use placeholder data
  const listing = {
    id: listingId,
    seller: '0x1234...5678',
    token: '0xABCD...EFGH',
    tokenAmount: '1000000000000000000',
    usdcPrice: '1000000',
    expiresAt: Date.now() + 86400000,
    isActive: true
  };
  
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OverTheCounter - Listing #${listingId}</title>
    <meta name="fc:miniapp" content='{"version":"1","imageUrl":"${baseUrl}/static/image.png","button":{"title":"Buy Tokens","action":{"type":"launch_miniapp","name":"OverTheCounter","url":"${baseUrl}/listing/${listingId}","splashImageUrl":"${baseUrl}/static/icon.svg","splashBackgroundColor":"#1a1a1a"}}}' />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap">
    <script type="module" src="https://esm.sh/@farcaster/miniapp-sdk"></script>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: 'Comic Neue', 'Comic Sans MS', cursive, sans-serif;
            max-width: 400px;
            margin: 0 auto;
            padding: 20px;
            background: #008080;
            background-image: 
                repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px),
                repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
            min-height: 100vh;
        }
        .container {
            background: #c0c0c0;
            border: 2px outset #c0c0c0;
            padding: 8px;
            box-shadow: 
                inset -1px -1px 0px #000,
                inset 1px 1px 0px #fff,
                2px 2px 4px rgba(0,0,0,0.3);
        }
        .window-title {
            background: linear-gradient(to right, #000080, #1084d0);
            color: white;
            padding: 4px 8px;
            font-weight: bold;
            font-size: 11px;
            margin: -8px -8px 8px -8px;
            border-bottom: 1px solid #000;
            display: flex;
            align-items: center;
            height: 20px;
        }
        .window-content {
            background: #c0c0c0;
            padding: 16px;
        }
        h1 {
            color: #000;
            margin: 0 0 8px 0;
            font-size: 20px;
            font-weight: bold;
            text-shadow: 1px 1px 0px rgba(255,255,255,0.5);
        }
        .listing-id {
            color: #000;
            font-size: 12px;
            margin-bottom: 16px;
        }
        .listing-info {
            background: #fff;
            border: 2px inset #c0c0c0;
            padding: 12px;
            margin-bottom: 16px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 12px;
        }
        .info-row:last-child {
            margin-bottom: 0;
        }
        .label {
            font-weight: bold;
            color: #000;
        }
        .value {
            color: #000;
            word-break: break-all;
        }
        .button {
            width: 100%;
            padding: 8px 16px;
            background: #c0c0c0;
            color: #000;
            border: 2px outset #c0c0c0;
            font-family: 'Comic Neue', 'Comic Sans MS', cursive, sans-serif;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            text-align: center;
            box-shadow: 
                inset -1px -1px 0px #000,
                inset 1px 1px 0px #fff;
        }
        .button:active {
            border: 2px inset #c0c0c0;
            box-shadow: 
                inset 1px 1px 0px #000,
                inset -1px -1px 0px #fff;
        }
        .button:hover:not(:disabled) {
            background: #d4d0c8;
        }
        .button:disabled {
            background: #c0c0c0;
            color: #808080;
            cursor: not-allowed;
            border: 2px inset #c0c0c0;
            box-shadow: 
                inset 1px 1px 0px #808080,
                inset -1px -1px 0px #fff;
        }
        .back-button {
            margin-bottom: 12px;
        }
        .success-message {
            background: #c0c0c0;
            color: #000;
            padding: 12px;
            border: 2px inset #c0c0c0;
            margin-bottom: 16px;
            display: none;
            font-size: 12px;
        }
        .error-message {
            background: #c0c0c0;
            color: #000;
            padding: 12px;
            border: 2px inset #c0c0c0;
            margin-bottom: 16px;
            display: none;
            font-size: 12px;
        }
        .status-active {
            color: #000;
            font-weight: bold;
        }
        .status-inactive {
            color: #000;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="window-title">Token Listing</div>
        <div class="window-content">
            <button onclick="window.location.href='/'" class="button back-button">
                ← Back to Create
            </button>
            
            <h1>Token Listing</h1>
            <div class="listing-id">Listing #${listingId}</div>
            
            <div id="success-message" class="success-message"></div>
            <div id="error-message" class="error-message"></div>
            
            <div class="listing-info">
            <div class="info-row">
                <span class="label">Seller:</span>
                <span class="value">${listing.seller}</span>
            </div>
            <div class="info-row">
                <span class="label">Token:</span>
                <span class="value">${listing.token}</span>
            </div>
            <div class="info-row">
                <span class="label">Amount:</span>
                <span class="value">${listing.tokenAmount}</span>
            </div>
            <div class="info-row">
                <span class="label">Price:</span>
                <span class="value">${listing.usdcPrice} USDC</span>
            </div>
            <div class="info-row">
                <span class="label">Status:</span>
                <span class="value ${listing.isActive ? 'status-active' : 'status-inactive'}">
                    ${listing.isActive ? 'Active' : 'Inactive'}
                </span>
            </div>
        </div>
        
        ${listing.isActive ? `
        <button class="button" id="buy-button">
            BUY TOKENS
        </button>
        ` : `
        <button class="button" disabled>
            LISTING NOT AVAILABLE
        </button>
        `}
        </div>
    </div>

    <script type="module">
        import { sdk } from 'https://esm.sh/@farcaster/miniapp-sdk';
        
        // OverTheCounter contract details
        const CONTRACT_ADDRESS = '${process.env.CONTRACT_ADDRESS || '0x...'}';
        const LISTING_ID = '${listingId}';
        
        // Initialize SDK when page loads
        async function initializeApp() {
            try {
                await sdk.actions.ready();
                console.log('Farcaster SDK ready');
            } catch (error) {
                console.log('Not in Farcaster miniapp context:', error);
            }
        }
        
        // Get ethereum provider
        async function getEthereumProvider() {
            try {
                return await sdk.wallet.getEthereumProvider();
            } catch (error) {
                console.log('Using window.ethereum fallback');
                return window.ethereum;
            }
        }
        
        // Execute listing (buy tokens)
        async function executeListing(listingId) {
            const provider = await getEthereumProvider();
            
            if (!provider) {
                throw new Error('No Ethereum provider found');
            }
            
            // Request account access
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            
            // Prepare transaction for executeListing
            const functionSelector = '0x' + '06d05b54'; // executeListing function selector
            const listingIdPadded = BigInt(listingId).toString(16).padStart(64, '0');
            const data = functionSelector + listingIdPadded;
            
            const tx = {
                to: CONTRACT_ADDRESS,
                from: account,
                data: data
            };
            
            // Send transaction
            const txHash = await provider.request({
                method: 'eth_sendTransaction',
                params: [tx]
            });
            
            return txHash;
        }
        
        // Handle buy button
        const buyButton = document.getElementById('buy-button');
        if (buyButton) {
            buyButton.addEventListener('click', async () => {
                const successMessage = document.getElementById('success-message');
                const errorMessage = document.getElementById('error-message');
                
                try {
                    buyButton.disabled = true;
                    buyButton.textContent = 'BUYING...';
                    
                    // Hide previous messages
                    successMessage.style.display = 'none';
                    errorMessage.style.display = 'none';
                    
                    const txHash = await executeListing(LISTING_ID);
                    
                    // Show success message
                    successMessage.textContent = \`Purchase successful! Transaction: \${txHash}\`;
                    successMessage.style.display = 'block';
                    
                    buyButton.textContent = 'PURCHASED!';
                    
                } catch (error) {
                    console.error('Error buying tokens:', error);
                    errorMessage.textContent = \`Error: \${error.message}\`;
                    errorMessage.style.display = 'block';
                    
                    buyButton.disabled = false;
                    buyButton.textContent = 'BUY TOKENS';
                }
            });
        }
        
        // Initialize app
        initializeApp();
    </script>
</body>
</html>
  `);
});

// Ponder API routes
app.use("/sql/*", client({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

export default app;
