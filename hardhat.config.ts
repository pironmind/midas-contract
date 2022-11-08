import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-docgen"
import "dotenv/config"

console.log(process.env.FANTOM_TESTNET_URL)

const config: HardhatUserConfig = {
  solidity: "0.8.15",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true
    },
    goerli: {
      gasPrice: "auto",
      url: process.env.GOERLI_URL || "",
      accounts:
          process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    ethereum: {
      gasPrice: "auto",
      url: process.env.ETHEREUM_URL || "",
      accounts:
          process.env.PRIVATE_KEY_PROD !== undefined ? [process.env.PRIVATE_KEY_PROD] : [],
    },
  },
  docgen: {
    path: './docs',
    clear: true,
    runOnCompile: false,
  }
};

export default config;
