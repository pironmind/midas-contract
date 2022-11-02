import { assert } from "chai"

import { ethers } from "hardhat"
import { Signer } from "ethers"

import {getCurrentBlock, mineBlocks} from "./helper";
import {parseEther} from "ethers/lib/utils";
import TransparentUpgradeableProxy from "@openzeppelin/contracts/build/contracts/TransparentUpgradeableProxy.json";
import ProxyAdmin from "@openzeppelin/contracts/build/contracts/ProxyAdmin.json";

describe("Staking", function () {
    let accounts: Signer[];

    let OWNER_SIGNER: any;
    let DEV_SIGNER: any;
    let ALICE_SIGNER: any;

    let OWNER: any;
    let DEV: any;
    let ALICE: any;

    let staking: any
    let midasToken: any
    let stakingProxy: any
    let proxyAdmin: any

    before("config", async () => {
        accounts = await ethers.getSigners();

        OWNER_SIGNER = accounts[0];
        DEV_SIGNER = accounts[1];
        ALICE_SIGNER = accounts[2];
        OWNER = await OWNER_SIGNER.getAddress();
        DEV = await DEV_SIGNER.getAddress();
        ALICE = await ALICE_SIGNER.getAddress();

        const MidasToken = await ethers.getContractFactory("MidasToken");
        const Staking = await ethers.getContractFactory("Staking");
        const StakingProxy = await ethers.getContractFactory(TransparentUpgradeableProxy.abi, TransparentUpgradeableProxy.bytecode);
        const AdminProxy = await ethers.getContractFactory(ProxyAdmin.abi, ProxyAdmin.bytecode);

        midasToken = await MidasToken.deploy(OWNER)
        await midasToken.deployed()

        const midasPerBlock = parseEther('1.0') // 1 MIDAS
        const startBlock = await getCurrentBlock()
        staking = await Staking.deploy()
        await staking.deployed()

        proxyAdmin = await AdminProxy.deploy()
        await proxyAdmin.deployed()

        const data = staking.interface.encodeFunctionData("initialize", [
            midasToken.address,
            OWNER,
            DEV,
            midasPerBlock,
            startBlock
        ])

        stakingProxy = await StakingProxy.deploy(staking.address, proxyAdmin.address, data)
        await stakingProxy.deployed()

        stakingProxy = await Staking.attach(stakingProxy.address)

        const MINTER_ROLE = await midasToken.MINTER_ROLE()
        await midasToken.grantRole(MINTER_ROLE, OWNER)
        await midasToken.grantRole(MINTER_ROLE, stakingProxy.address)
    })

    describe('success cases', () => {
        it('#setRewardMultiplier', async () => {
            await stakingProxy.setRewardMultiplier(10)
            assert.equal(Number(await stakingProxy.rewardMultiplier()), 10, "Reward multiplier 10")

            await stakingProxy.setRewardMultiplier(1)
            assert.equal(Number(await stakingProxy.rewardMultiplier()), 1, "Reward multiplier 1")
        })

        it('#deposit proxy', async () => {
            await midasToken.mint(ALICE, parseEther('1000'))
            await midasToken.connect(ALICE_SIGNER).approve(stakingProxy.address, parseEther('1000'))

            await stakingProxy.connect(ALICE_SIGNER).deposit(parseEther('1000'))

            assert.equal(String(await stakingProxy.connect(ALICE_SIGNER).pendingReward(ALICE)), "0", "Not zero?")

            console.log(await stakingProxy.connect(ALICE_SIGNER).poolInfo())
            console.log(await stakingProxy.connect(ALICE_SIGNER).userInfo(ALICE))

            await mineBlocks(1)
            console.log(await stakingProxy.connect(ALICE_SIGNER).poolInfo())
            console.log(await stakingProxy.connect(ALICE_SIGNER).userInfo(ALICE))
            console.log(await stakingProxy.startBlock())
            console.log(await stakingProxy.rewardToken())
            console.log(await stakingProxy.devfee())
            console.log(await stakingProxy.rewardMultiplier())
            assert.equal(String(await stakingProxy.pendingReward(ALICE)), String(parseEther('1')), "Not 1?")

            await mineBlocks(1)
            assert.equal(String(await stakingProxy.pendingReward(ALICE)), String(parseEther('2')), "Not 2?")

            // claim
            await stakingProxy.connect(ALICE_SIGNER).deposit('0')

            assert.equal(String(await stakingProxy.pendingReward(ALICE)), '0', "Not 0?")
        })

        it('#deposit (claim) with disabled reward', async () => {
            await midasToken.mint(ALICE, parseEther('1000'))
            await midasToken.connect(ALICE_SIGNER).approve(stakingProxy.address, parseEther('1000'))

            await staking.setRewardMultiplier(0)

            await stakingProxy.connect(ALICE_SIGNER).deposit(parseEther('1000'))

            await mineBlocks(1)

            await midasToken.mint(stakingProxy.address, parseEther('0.1'))

            await stakingProxy.connect(ALICE_SIGNER).deposit(0)

            console.log(await midasToken.balanceOf(ALICE))
            console.log(await midasToken.balanceOf(stakingProxy.address))

            await staking.setRewardMultiplier(1)
            const MINTER_ROLE = await midasToken.MINTER_ROLE()
            await midasToken.revokeRole(MINTER_ROLE, stakingProxy.address)
            await stakingProxy.connect(ALICE_SIGNER).deposit(0)

            console.log(await midasToken.balanceOf(ALICE))
            console.log(await midasToken.balanceOf(stakingProxy.address))

            await stakingProxy.connect(ALICE_SIGNER).deposit(0)

            console.log(await midasToken.balanceOf(ALICE))
            console.log(await midasToken.balanceOf(stakingProxy.address))

            await midasToken.grantRole(MINTER_ROLE, stakingProxy.address)

            await stakingProxy.connect(ALICE_SIGNER).deposit(0)

            console.log(await midasToken.balanceOf(ALICE))
            console.log(await midasToken.balanceOf(stakingProxy.address))

        })

        it('#withdraw', async () => {
            await stakingProxy.connect(ALICE_SIGNER).withdraw(parseEther('1000'))

            assert.equal(String(await stakingProxy.pendingReward(ALICE)), '0', "Not 0?")
            console.log(await midasToken.balanceOf(ALICE))
        })
    })
})
