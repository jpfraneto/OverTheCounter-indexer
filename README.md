# OverTheCounter Indexer & Miniapp

A Ponder-based indexer that also serves a Farcaster miniapp for the OverTheCounter smart contract - a permissionless, non-custodial OTC token marketplace.

## Features

- 📊 **Blockchain Indexing**: Indexes all OverTheCounter contract events (listings, executions, cancellations)
- 🖥️ **Miniapp Interface**: Farcaster miniapp for creating and buying token listings
- 🔗 **Direct Smart Contract Integration**: Users can interact with the contract directly from the miniapp
- 📱 **Social Sharing**: Integrated sharing via Farcaster casts with embeds
- 🛡️ **Non-custodial**: Tokens never leave user wallets until the moment of sale

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
1. User fills form (token address, amount, USDC price)
2. **CREATE LISTING** button calls `createListing()` on smart contract
3. Success → **SHARE LISTING** button appears
4. Share button calls `sdk.actions.composeCast()` with listing embed

### Buy Tokens Flow  
1. User discovers listing via shared cast
2. Clicks miniapp embed → opens listing page
3. **BUY TOKENS** button calls `executeListing()` on smart contract
4. Atomic swap: tokens → buyer, USDC → seller (minus 0.88% fee)

### Smart Contract Integration
- Direct wallet interaction via Farcaster's Ethereum provider
- Manual function encoding for gas optimization
- Real-time transaction tracking and confirmation
- Error handling with user-friendly messages

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

The OverTheCounter contract provides:
- **Permissionless**: Anyone can create listings, anyone can buy
- **Non-custodial**: Tokens stay in seller's wallet until sale
- **Immutable**: No admin keys, no pause functions
- **Transparent**: All listings and trades on-chain
- **24-hour expiry**: Automatic listing expiration
- **0.88% protocol fee**: Deducted from seller proceeds

## Contributing

This indexer serves as both blockchain data infrastructure and user interface, enabling a complete OTC marketplace experience within the Farcaster ecosystem.