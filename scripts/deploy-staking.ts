import hre from "hardhat";
import TransparentUpgradeableProxy from "@openzeppelin/contracts/build/contracts/TransparentUpgradeableProxy.json";
import ProxyAdmin from "@openzeppelin/contracts/build/contracts/ProxyAdmin.json";
import {parseEther} from "ethers/lib/utils";
import {getCurrentBlock} from "../test/helper";
const ethers = hre.ethers;

async function main() {
    const [owner] = await ethers.getSigners();
    console.log(owner.address)

    // We get the contract to deploy
    const MidasToken = await ethers.getContractFactory("MidasToken");
    const Staking = await ethers.getContractFactory("Staking");
    const StakingProxy = await ethers.getContractFactory(TransparentUpgradeableProxy.abi, TransparentUpgradeableProxy.bytecode);
    const AdminProxy = await ethers.getContractFactory(ProxyAdmin.abi, ProxyAdmin.bytecode);

    const midasToken = await MidasToken.deploy(owner.address)
    await midasToken.deployed();
    console.log(`Midas token deployed: ${midasToken.address}`)

    const staking = await Staking.deploy()
    await staking.deployed()
    console.log(`Staking logic implementation deployed: ${staking.address}`)

    const proxyAdmin = await AdminProxy.deploy()
    await proxyAdmin.deployed()
    console.log(`Proxy admin deployed: ${proxyAdmin.address}`)

    const ownerAddress = owner.address
    const devAddress = owner.address
    const midasPerBlock = parseEther('1.0') // 1 MIDAS
    const startBlock = await getCurrentBlock()

    const data = staking.interface.encodeFunctionData("initialize", [
        midasToken.address,
        ownerAddress,
        devAddress,
        midasPerBlock,
        startBlock
    ])

    let stakingProxy = await StakingProxy.deploy(staking.address, proxyAdmin.address, data)
    await stakingProxy.deployed()
    console.log(`Staking Proxy deployed: ${proxyAdmin.address}`)

    const MINTER_ROLE = await midasToken.MINTER_ROLE()

    let tx: any;
    tx = await midasToken.grantRole(MINTER_ROLE, ownerAddress)
    await tx.wait(3)
    console.log('Access granted!')
    tx = await midasToken.grantRole(MINTER_ROLE, stakingProxy.address)
    await tx.wait(3)
    console.log('Access granted!')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
