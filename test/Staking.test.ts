import { assert } from "chai"

import { ethers } from "hardhat"
import { Signer } from "ethers"
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { PANIC_CODES } from "@nomicfoundation/hardhat-chai-matchers/panic"

import {getCurrentBlock, mineBlocks, setNextBlockTimestamp} from "./helper";
import {parseEther} from "ethers/lib/utils";

const { AddressZero } = ethers.constants

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

        midasToken = await MidasToken.deploy(OWNER)
        await midasToken.deployed()

        const midasPerBlock = parseEther('1.0') // 1 MIDAS
        const startBlock = await getCurrentBlock()
        staking = await Staking.deploy(
            midasToken.address,
            OWNER,
            midasPerBlock,
            startBlock
        )
        await staking.deployed()

        const MINTER_ROLE = await midasToken.MINTER_ROLE()
        await midasToken.grantRole(MINTER_ROLE, OWNER)
        await midasToken.grantRole(MINTER_ROLE, staking.address)
    })

    describe.only('success cases', () => {
        it('#setRewardMultiplier', async () => {
            await staking.setRewardMultiplier(10)
            assert.equal(Number(await staking.rewardMultiplier()), 10, "Reward multiplier 10")
            await staking.setRewardMultiplier(1)
            assert.equal(Number(await staking.rewardMultiplier()), 1, "Reward multiplier 1")
        })

        it('#deposit', async () => {
            await midasToken.mint(ALICE, parseEther('1000'))
            await midasToken.connect(ALICE_SIGNER).approve(staking.address, parseEther('1000'))

            assert.equal(String(await staking.pendingReward(ALICE)), "0", "Not zero?")

            await staking.connect(ALICE_SIGNER).deposit(parseEther('1000'))

            // console.log(await staking.pendingReward(ALICE))
            assert.equal(String(await staking.pendingReward(ALICE)), "0", "Not zero?")

            await mineBlocks(1)
            // console.log(await staking.pendingReward(ALICE))
            assert.equal(String(await staking.pendingReward(ALICE)), String(parseEther('1')), "Not 1?")

            await mineBlocks(1)
            // console.log(await staking.pendingReward(ALICE))
            assert.equal(String(await staking.pendingReward(ALICE)), String(parseEther('2')), "Not 2?")
        })

        it('#withdraw', async () => {
            await staking.connect(ALICE_SIGNER).withdraw(parseEther('1000'))

            console.log(await staking.pendingReward(ALICE))
            console.log(await midasToken.balanceOf(ALICE))
        })
    })
})
