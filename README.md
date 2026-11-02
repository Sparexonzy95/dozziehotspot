# Dozzie Hotspot

A mobile-first suya ordering app for Woji Road, Port Harcourt. Pick your suya, pay in USDC on Arc Testnet, and get a verified digital receipt to show at the stand.

Built with [Arc Studio](https://studio.arc.io)

## What it does

- Browse beef, chicken and ram suya, filter the menu and set pack quantities.
- Add free extras (yaji pepper, onions, cabbage wrap). They appear on the receipt and never change the price.
- Connect an EVM wallet, switch to Arc Testnet and see your live USDC balance.
- Pay with a real USDC transfer. The app waits for the on-chain receipt and checks the transfer before showing a Paid receipt.
- Download a confirmed receipt as an image, or share it from your phone's share sheet where supported.
- Receipts (`#WOJI-001`, `#WOJI-002`, ...) are saved in your browser and reopen after a refresh. A payment that was sent before a refresh is picked up and confirmed again automatically.

## Important notes

- This is an **Arc Testnet demo**. It uses test USDC with no real value.
- Receipts are stored in the browser only. This is **not** a merchant order-management system: the stand cannot see orders, and order codes are local to each device. The transaction hash is the real proof of payment.
- A confirmed payment proves the USDC arrived. It does **not** prove the food was handed over.
- If you close the page while your wallet is still waiting for a signature, the app cannot know whether a transaction was sent. Check the explorer or your wallet activity before paying again.

## Tech stack

React, TypeScript, Vite, Tailwind CSS, wagmi, viem, ConnectKit, Lucide icons.

## Development

Prerequisites: [Bun](https://bun.sh) and a browser wallet that supports EVM chains.

```bash
bun install
cp .env.example .env   # then check the values below
bun run dev
```

### Environment variables

| Name | Purpose |
| --- | --- |
| `VITE_DOZZIE_WALLET` | Required. Public wallet address that receives every payment. Checkout stays disabled if it is missing or invalid. |
| `VITE_WALLETCONNECT_PROJECT_ID` | Optional. Adds WalletConnect to the wallet picker. |
| `RPC_PROXY_BASE_URL`, `RPC_PROXY_TOKEN`, `RPC_PROXY_CHAINS` | Optional. Provided by Arc Studio; not needed elsewhere. |

Never put a private key in this project.

### Scripts

- `bun run dev` starts the dev server.
- `bun run check` runs lint and type checks.

### Getting test USDC

Open the menu (top left), choose **Get test USDC**, and request Arc Testnet USDC from the Circle faucet at https://faucet.circle.com. On Arc, USDC is also the gas token, so one balance covers the order and the network fee.

## Testing status

Checked: price and quantity maths, receipt numbering and de-duplication (automated), Arc Testnet RPC reads and Transfer-event decoding against real chain data, lint and type checks.

Not yet run end to end: a live wallet payment from a phone. Run one with test USDC and confirm the receipt and the Arc Explorer link before relying on it.

## Photo credits

Photos are from Wikimedia Commons: Yusufdavid (CC BY-SA 4.0), Bukky658 (CC BY-SA 4.0), WhisperToMe (CC0) and Kambai Akau (CC BY-SA 4.0). Links are in the app footer.
