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
    <script type="module" src="https://esm.sh/@farcaster/miniapp-sdk"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 400px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
            min-height: 100vh;
        }
        .container {
            background: white;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 8px;
            font-size: 24px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 24px;
            font-size: 14px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 16px;
            box-sizing: border-box;
        }
        input:focus {
            outline: none;
            border-color: #0066cc;
        }
        .button {
            width: 100%;
            padding: 16px;
            background: #0066cc;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }
        .button:hover {
            background: #0052a3;
        }
        .button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .share-button {
            background: #1da1f2;
            margin-top: 12px;
        }
        .share-button:hover {
            background: #1a8cd8;
        }
        .success-message {
            background: #d4edda;
            color: #155724;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }
        .error-message {
            background: #f8d7da;
            color: #721c24;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>OverTheCounter</h1>
        <p class="subtitle">Create a new token listing</p>
        
        <div id="success-message" class="success-message"></div>
        <div id="error-message" class="error-message"></div>
        
        <form id="create-listing-form">
            <div class="form-group">
                <label for="token">Token Address</label>
                <input type="text" id="token" name="token" placeholder="0x..." required>
            </div>
            
            <div class="form-group">
                <label for="tokenAmount">Token Amount</label>
                <input type="text" id="tokenAmount" name="tokenAmount" placeholder="1000000000000000000" required>
            </div>
            
            <div class="form-group">
                <label for="usdcPrice">USDC Price (total)</label>
                <input type="text" id="usdcPrice" name="usdcPrice" placeholder="1000000" required>
            </div>
            
            <button type="submit" class="button" id="create-button">
                CREATE LISTING
            </button>
        </form>
        
        <div id="share-section" style="display: none;">
            <button type="button" class="button share-button" id="share-button">
                SHARE LISTING
            </button>
        </div>
    </div>

    <script type="module">
        import { sdk } from 'https://esm.sh/@farcaster/miniapp-sdk';
        
        let createdListingId = null;
        
        // OverTheCounter contract details
        const CONTRACT_ADDRESS = '${process.env.CONTRACT_ADDRESS || '0x...'}';
        
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
                
                const formData = new FormData(e.target);
                const token = formData.get('token');
                const tokenAmount = formData.get('tokenAmount');
                const usdcPrice = formData.get('usdcPrice');
                
                // Create listing
                const listingId = await createListing(token, tokenAmount, usdcPrice);
                createdListingId = listingId;
                
                // Show success message
                successMessage.textContent = \`Listing created successfully! ID: \${listingId}\`;
                successMessage.style.display = 'block';
                
                // Show share section
                document.getElementById('share-section').style.display = 'block';
                
                // Reset form
                e.target.reset();
                
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
    <script type="module" src="https://esm.sh/@farcaster/miniapp-sdk"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 400px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
            min-height: 100vh;
        }
        .container {
            background: white;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 8px;
            font-size: 24px;
        }
        .listing-id {
            color: #666;
            font-size: 14px;
            margin-bottom: 24px;
        }
        .listing-info {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
        }
        .info-row:last-child {
            margin-bottom: 0;
        }
        .label {
            font-weight: 600;
            color: #333;
        }
        .value {
            color: #666;
            word-break: break-all;
        }
        .button {
            width: 100%;
            padding: 16px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }
        .button:hover {
            background: #218838;
        }
        .button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .back-button {
            background: #6c757d;
            margin-bottom: 16px;
        }
        .back-button:hover {
            background: #545b62;
        }
        .success-message {
            background: #d4edda;
            color: #155724;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }
        .error-message {
            background: #f8d7da;
            color: #721c24;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }
        .status-active {
            color: #28a745;
            font-weight: 600;
        }
        .status-inactive {
            color: #dc3545;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
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
