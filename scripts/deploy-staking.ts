import hre from "hardhat";
import {parseEther} from "ethers/lib/utils";
import {getCurrentBlock} from "../test/helper";
const ethers = hre.ethers;

async function main() {
    const [owner] = await ethers.getSigners();
    console.log(owner.address)

    // We get the contract to deploy
    const Staking = await hre.ethers.getContractFactory("Staking");
    const MidasToken = await hre.ethers.getContractFactory("MidasToken");

    const midasToken = await MidasToken.deploy(owner.address)
    await midasToken.deployed();
    console.log(`Midas token deployed: ${midasToken.address}`)

    const midasPerBlock = parseEther('1.0') // 1 MIDAS
    const startBlock = await getCurrentBlock()

    const staking = await Staking.deploy(
        midasToken.address,
        owner.address,
        midasPerBlock,
        startBlock
    )
    await staking.deployed()
    console.log(`Staking deployed: ${staking.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
