# CHANGELOG

## vNext
...

## v0.28.0
- Update config to use Polygon Amoy and Ethereum Sepolia

## v0.27.0
- Added the ability to select a HomeChain for EVM-based networks.

## v0.26.0
- Applied to Cere ss58 prefix for Polkadot-JS Extension accounts.

## v0.25.0
- Added ability to select destination address from Polkadot-JS Web Extension or paste it manually.

## v0.24.0
- Migrated to WalletConnect v2

## v0.23.0
- Disabled WalletConnect v1

## v0.22.1 
- Changed Support Service from Telegram to Discord

## v0.22.0
- Updated Community and Support links

## v0.21.0
- Fixed preflight check misaligned issue
- Fixed WalletConnect login issue after auth popup was closed
- Fixed app transfer page reset after mobile restart
- Fixed transfer page reset after provider disconnection
- Fixed Cere stuck connection after transfer from Polygon to Cere

## v0.20.0

- Added support of the Cere node v2.32.0

## v0.19.0

- WalletConnect integration
- Fixed fallback mechanism launch after transaction was finished

## v0.18.0

- Ejected create-react-app
- Got rid of craco npm package
- Updated all vulnerable packages except bnc-onboard
- Fixed packages vulnerabilities for bnc-onboard

## v0.17.0

- Implemented transfer tx links to source, destination chains during tokens transfer
- Replaced account address with its name on the select account dropdown
- Updated Cere Blockchain public URLs

## v0.16.0

- Renamed ERC20 to ERC-20
- Migrated to GitHub actions

## v0.15.0

- Updated Devnet url
- Fixed duplicate requests to Cere/Polygon/Ethereum

## v0.14.0

- Added liquidity enough check before transfer starts

## v0.13.0

- Implemented fallback mechanism for Polygon, Ethereum to Cere, Cere to Polygon transfer flows to be able to update transaction status window in the case blockchain response didn't reach client with GA integration

## v0.12.0

- Updated Testnet/Mainnet urls

## v0.11.2

- Available balance should be used as base for calculating transferable balance

## v0.11.1

- Show transfer amount with fixed digits in fraction

## v0.11.0

- Added transferable balance

## v0.10.5

- Added fallback urls

## v0.10.4

- Updated "STAKE ON CERE MAINNET" link

## v0.10.3

- Added gas price suggestion for Polygon

## v0.10.2

- Enabled Cere -> Polygon

## v0.10.1

- Use Cere archive instead of full node rpc

## v0.10.0

- Fixed responsiveness for mobile devices

## v0.9.0

- Added Polygon to titles

## v0.8.0

- Added option to disable "Connect with Substrate Wallet" from env
- Added config to disable home network from config

## v0.7.0

- Enable CERE native to CERE ERC20 transfers
- Redesigned connect to wallet page
- Added Polygon to STAGE
- Restricted home and destination blockchains
- Added maintenance page

## v0.6.0

- Cherry picked 6159de29, ae130023 from the upstream
- Turned off double approval
- Redesign transfer active modal
- Redesigned transfer and pre-flight transfer page

## v0.5.0

- Added cross link on header
- Updated favicon and icon
- Updated with ChainSafe/chainbridge-ui v0.0.3

## v0.4.1

- Renamed Cere Networks

## v0.4.0

- Refactored environment variables.
- Updated rpc url for Cere Network.
- Configured sentry DSN and auth token

## v0.3.0

- Added home path to logo and title
- Added polygon configuration to chainbridgeConfig
- Updated title
- Set Cere Network as Destination Network
