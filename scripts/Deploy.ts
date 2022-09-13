import hre from "hardhat";
const ethers = hre.ethers;

async function main() {
    const [owner] = await ethers.getSigners();
    console.log(owner.address)

    // We get the contract to deploy
    const MidasTokenOld = await hre.ethers.getContractFactory("ERC20Mock");
    const MidasToken = await hre.ethers.getContractFactory("MidasToken");
    const Locker = await hre.ethers.getContractFactory("Locker");
    const Minter = await hre.ethers.getContractFactory("Minter");
    const SignatureEncoder = await hre.ethers.getContractFactory("SignatureEncoder");

    if (hre.network.name === 'fantomTestnet') {
        const token = await MidasTokenOld.deploy('Midas Old', 'MIDAS')
        await token.deployed()
        console.log("Old MIDAS mock deployed to:", token.address);

        const locker = await Locker.deploy(
            token.address,
            owner.address
        );
        await locker.deployed();
        console.log("Locker deployed to:", locker.address);
    }

    if (hre.network.name === 'rinkeby') {
        const token = await MidasToken.deploy(owner.address)
        await token.deployed()
        console.log("New MIDAS mock deployed to:", token.address);

        const minter = await Minter.deploy(
            token.address,
        );
        await minter.deployed();
        console.log("Minter deployed to:", minter.address);

        const signatureEncoder = await SignatureEncoder.deploy();
        await signatureEncoder.deployed();
        console.log("Signature Encoder deployed to:", signatureEncoder.address);
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
