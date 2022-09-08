import chai from "chai";

import { ethers } from "hardhat";
import { BigNumber, Signer } from "ethers";
import { assert } from "chai";
import { parseEther } from "ethers/lib/utils";
import {
    createSnapshot,
    restoreSnapshot,
    setNextBlockTimestamp,
    expectRevert,
    getDateNow
} from "../helper";


describe("Locker", function () {
    let accounts: Signer[];

    let OWNER_SIGNER: any;
    let BUYER_SIGNER: any;

    let OWNER: any;
    let BUYER: any;

    let token: any;
    let locker: any;

    const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD'

    before("config", async () => {
        accounts = await ethers.getSigners();

        OWNER_SIGNER = accounts[0];
        BUYER_SIGNER = accounts[1];

        OWNER = await OWNER_SIGNER.getAddress();
        BUYER = await BUYER_SIGNER.getAddress();
    })

    let snapshotId: any;
    beforeEach(async () => {
        snapshotId = await createSnapshot()
        console.log(`Snapshot: ${snapshotId}`)

        const Locker = await ethers.getContractFactory("Locker")
        const ERC20Mock = await ethers.getContractFactory("ERC20Mock")

        token = await ERC20Mock.deploy('test', 'test');
        await token.deployed()

        locker = await Locker.deploy(token.address, OWNER);
        await locker.deployed()

        await token.mint(OWNER, parseEther('10000'))
    })

    afterEach(async () => {
        await restoreSnapshot(snapshotId)
    })

    it("#lock", async () => {
        await token.approve(locker.address, parseEther('10000'))
        let tx: any = await locker.lock()
        const receipt = await tx.wait()
        for (const event of receipt.events) {
            console.log(`Event ${event.event} with args ${event.args}`);
            // assert.equal(event.args[1], BUYER, 'Not buyer')
        }
        assert.equal(String(await token.balanceOf(DEAD_ADDRESS)), String(parseEther('10000')))
    })

    it("#lockFor", async () => {
        await token.approve(locker.address, parseEther('10000'))
        let tx: any = await locker.lockFor(BUYER)
        const receipt = await tx.wait()
        for (const event of receipt.events) {
            console.log(`Event ${event.event} with args ${event.args}`);
            // assert.equal(event.args[1], BUYER, 'Not buyer')
        }
        assert.equal(String(await token.balanceOf(DEAD_ADDRESS)), String(parseEther('10000')))
    })

});
