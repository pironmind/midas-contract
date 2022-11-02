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
    fantomTestnet: {
      gasPrice: "auto",
      url: process.env.FANTOM_TESTNET_URL || "",
      accounts:
          process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    goerli: {
      gasPrice: "auto",
      url: process.env.GOERLI_URL || "",
      accounts:
          process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  docgen: {
    path: './docs',
    clear: true,
    runOnCompile: true,
  }
};

export default config;
