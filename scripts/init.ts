import hre from "hardhat";
import {parseEther} from "ethers/lib/utils";
const ethers = hre.ethers;

async function main() {
    const [owner] = await ethers.getSigners();
    console.log(owner.address)

    // We get the contract to deploy
    const MidasTokenOld = await hre.ethers.getContractFactory("MidasToken");
    const MidasToken = await hre.ethers.getContractFactory("MidasToken");
    const Locker = await hre.ethers.getContractFactory("Locker");
    const Minter = await hre.ethers.getContractFactory("Minter");
    const Staking = await hre.ethers.getContractFactory("Staking");

    if (hre.network.name === 'fantomTestnet') {
        const token = await MidasTokenOld.attach('0xCCF87b63be0F89278C7217a672a03Ebd25e5ff3d')
        const locker = await Locker.attach('0x78DB5D79f1D26944c3290Ce4a553939125059C77')
        const staking = await Staking.attach('0xf76c04dF2751dFfC1EBce18223F59DfdAD3a8d54')

        let tx: any;
        // tx = await token.approve(locker.address, parseEther('1000.0'))
        // await tx.wait(3)
        //
        // tx = await token.mint(owner.address, parseEther('500.0'))
        // await tx.wait(3)
        //
        // tx = await locker.lock()
        // await tx.wait(3)

        // const MINTER_ROLE = await token.MINTER_ROLE()
        // tx = await token.grantRole(MINTER_ROLE, staking.address)
        // await tx.wait(3)
        // tx = await token.mint("0x7A0e73ceB4371681A93Cd1cE87e10C9bCC260c8A", parseEther('100000.0'))
        // await tx.wait(3)
        // tx = await token.mint("0xE8E72Ecf60B3A1Ba2d37040c8d510CeDbda70B23", parseEther('100000.0'))
        // await tx.wait(3)

        // let externalAddress = '0x2797257802D279d3ceF46c81e0bD834cDf982Fed'
        // tx = await locker.lockFor(externalAddress)
        // await tx.wait(3)
    }

    if (hre.network.name === 'rinkeby') {
        const token = await MidasToken.attach('0x83c611bFb6E98c7F428cc6af724DF60Ea95570cD')
        const minter = await Minter.attach('0x8CB7FcF4827B93e2E2CfDF344521c98D80afF1Ab')

        const operatorAddress = '0x42AdB1f5aE19dea42bFd71250A57Cb46ECF5E0Bc'

        const MINTER_ROLE = await minter.MINTER_ROLE()
        await minter.grantRole(MINTER_ROLE, operatorAddress)
        await token.grantRole(MINTER_ROLE, minter.address)
    }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
