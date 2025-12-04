# OverTheCounter Indexer & Miniapp

A Ponder-based indexer that also serves a Farcaster miniapp for the OverTheCounter smart contract - a permissionless, non-custodial OTC token marketplace on Base.

## Features

- 📊 **Blockchain Indexing**: Indexes all OverTheCounter contract events (listings, executions, cancellations)
- 🖥️ **Miniapp Interface**: Early internet-styled Farcaster miniapp for creating and buying token listings
- 🔗 **Direct Smart Contract Integration**: Users can interact with the contract directly from the miniapp
- 📱 **Social Sharing**: Integrated sharing via Farcaster casts with embeds
- 🛡️ **Non-custodial**: Tokens never leave user wallets until the moment of sale
- 💰 **USDC Balance Checking**: Smart UI checks user USDC balance before purchase attempts
- ℹ️ **Built-in Help**: ELI5 explanations accessible via info button
- 🎨 **Retro Design**: Authentic 1990s web aesthetic with Times New Roman and simple styling

## Routes

### Miniapp Routes
- `/` - Create new token listing form
- `/listing/:id` - View and buy from specific listing
- `/.well-known/farcaster.json` - Farcaster manifest

### API Routes  
- `/graphql` - GraphQL endpoint for indexed data
- `/sql/*` - SQL client for database queries

## Quick Setup

1. **Install dependencies**:
```bash
bun install
```

2. **Environment setup**:
```bash
cp .env.example .env
# Edit .env with your values
```

3. **Required Environment Variables**:
```bash
# Contract details
CONTRACT_ADDRESS="0x..." # Your deployed OverTheCounter contract
START_BLOCK="0"          # Block to start indexing from
PONDER_RPC_URL_8453="https://mainnet.base.org"

# Domains
BASE_URL="https://miniapp.anky.app"        # For development
# BASE_URL="https://overthecounter.lat"    # For production

# Farcaster manifest (generate at https://farcaster.xyz/~/developers/mini-apps/manifest)
MANIFEST_HEADER=""
MANIFEST_PAYLOAD=""
MANIFEST_SIGNATURE=""
```

4. **Start development**:
```bash
bun run dev
```

## Deployment Setup

### Development (via Cloudflare Tunnel)
- **Domain**: `https://miniapp.anky.app`
- **Port**: `42069` (Ponder default)
- Set `BASE_URL="https://miniapp.anky.app"` in your `.env`

### Production  
- **Domain**: `https://overthecounter.lat`
- **Manifest**: Generated for `overthecounter.lat` domain
- Set `BASE_URL="https://overthecounter.lat"` in your `.env`

## Farcaster Miniapp Features

### Create Listing Flow
1. **Step 1**: User pastes token contract address 
2. **Step 2**: System loads balance, user selects amount via slider (% of holdings)
3. **Step 3**: User sees selling summary and sets USDC price
4. **CREATE LISTING** button calls `createListing()` on smart contract
5. **Success Screen**: Large **SHARE LISTING** button + small "create another one" button
6. Share button calls `sdk.actions.composeCast()` with listing embed

### Buy Tokens Flow  
1. User discovers listing via shared cast
2. Clicks miniapp embed → opens listing page with real contract data
3. System checks user's USDC balance vs required amount
4. **If insufficient USDC**: Shows **BUY USDC FIRST** button (triggers swap)
5. **If sufficient USDC**: Shows **BUY TOKENS** button 
6. **BUY TOKENS** calls `executeListing()` on smart contract
7. Atomic swap: tokens → buyer, USDC → seller (minus 0.88% fee)

### Smart Contract Integration
- Direct wallet interaction via Farcaster's Ethereum provider
- **Correct function selectors**: `createListing` → `0xee1fe2ad`, `executeListing` → `0x625eb5a7`
- Manual function encoding for gas optimization
- Real-time transaction tracking and confirmation
- Transaction simulation before sending to catch revert reasons
- Error handling with user-friendly messages

### User Experience Features
- **Info Button (ℹ️)**: Always available in top-right corner with ELI5 explanations
- **Balance Validation**: Checks both token and USDC balances before transactions
- **Human-Readable Formatting**: Displays token amounts with proper decimals and commas
- **Clear Placeholders**: "paste the ca of the token you want to sell here" instead of "0x..."
- **Responsive Design**: Mobile-optimized with proper viewport handling
- **Early Internet Aesthetic**: Times New Roman, basic styling, classic blue/purple links

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Farcaster     │    │    Ponder        │    │  OverTheCounter │
│   Miniapp       │────│    Indexer       │────│  Smart Contract │
│                 │    │                  │    │                 │
│ • Create Form   │    │ • Event Indexing │    │ • createListing │
│ • Listing Page  │    │ • GraphQL API    │    │ • executeListing│
│ • Social Share  │    │ • Database       │    │ • cancelListing │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Database Schema

The indexer tracks:
- **listings**: All created token listings
- **listingExecutions**: Completed purchases  
- **listingCancellations**: Cancelled listings
- **feeWithdrawals**: Protocol fee withdrawals
- **feeRecipientUpdates**: Fee recipient changes

## Scripts

```bash
bun run dev        # Start development server
bun run start      # Start production server  
bun run db         # Database management
bun run codegen    # Generate types
bun run lint       # Lint code
bun run typecheck  # Type checking
```

## Smart Contract

**Contract Address**: `0xa16e313bb5b6f03af9894b9991132f729b9069bf` (Base mainnet)  
**Etherscan**: [View on BaseScan](https://basescan.org/address/0xa16e313bb5b6f03af9894b9991132f729b9069bf#code)

The OverTheCounter contract provides:
- **Permissionless**: Anyone can create listings, anyone can buy
- **Non-custodial**: Tokens stay in seller's wallet until sale
- **Immutable**: No admin keys, no pause functions
- **Transparent**: All listings and trades on-chain
- **24-hour expiry**: Automatic listing expiration
- **0.88% protocol fee**: Deducted from seller proceeds
- **USDC-only payments**: All purchases must be in USDC on Base

### Key Functions
- `createListing(address token, uint256 amount, uint256 usdcPrice)`: Create new listing
- `executeListing(uint256 listingId)`: Buy tokens from listing
- `cancelListing(uint256 listingId)`: Cancel own listing
- `getListing(uint256 listingId)`: View listing details
- `isListingExecutable(uint256 listingId)`: Check if listing can be bought

## Contributing

This indexer serves as both blockchain data infrastructure and user interface, enabling a complete OTC marketplace experience within the Farcaster ecosystem.