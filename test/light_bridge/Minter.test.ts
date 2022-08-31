import chai from "chai";

import { ethers } from "hardhat";
import { BigNumber, Signer } from "ethers";
import { assert } from "chai";
import { solidity } from "ethereum-waffle";
import { parseEther } from "ethers/lib/utils";
import {
    createSnapshot,
    restoreSnapshot,
    setNextBlockTimestamp,
    expectRevert,
    getDateNow
} from "../helper";

chai.use(solidity);


describe("Minter", function () {
    let accounts: Signer[];

    let OWNER_SIGNER: any;
    let BUYER_SIGNER: any;

    let OWNER: any;
    let BUYER: any;

    let token: any;
    let minter: any;
    let signatureEncoder: any;

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

        const Minter = await ethers.getContractFactory("Minter")
        const MidasToken = await ethers.getContractFactory("MidasToken")
        const SignatureEncoder = await ethers.getContractFactory("SignatureEncoder")

        token = await MidasToken.deploy(OWNER);
        await token.deployed()

        minter = await Minter.deploy(token.address);
        await minter.deployed()

        signatureEncoder = await SignatureEncoder.deploy();
        await signatureEncoder.deployed()

        const MINTER_ROLE = await token.MINTER_ROLE()
        await token.grantRole(MINTER_ROLE, minter.address)
        await minter.grantRole(MINTER_ROLE, OWNER)
    })

    afterEach(async () => {
        await restoreSnapshot(snapshotId)
    })

    it("#mint", async () => {
        let testTx = '0xc67e003ab3082631aabbf94c41562fcdadf56e02858bd66727fb9f85355d4085'
        let data = {
            amount: parseEther('10000'),
            recipient: BUYER
        }
        let nonce = await minter.nonce()
        let signature = await signatureEncoder.getSignature(testTx, data, nonce)

        let signatureWithWrongNonce = await signatureEncoder.getSignature(testTx, data, 1)
        await expectRevert(minter.mint(testTx, data, signatureWithWrongNonce), "Minter: bed signature")

        await minter.mint(testTx, data, signature)
        assert.equal(String(await token.balanceOf(BUYER)), String(parseEther('10000')))

        nonce = await minter.nonce()
        signature = await signatureEncoder.getSignature(testTx, data, nonce)

        await expectRevert(minter.mint(testTx, data, signature), "Minter: tnx handled")
    })
});
