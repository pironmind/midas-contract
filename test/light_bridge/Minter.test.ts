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
import keccak256 from "keccak256";
import {string} from "hardhat/internal/core/params/argumentTypes";

chai.use(solidity);


describe("Minter", function () {
    let accounts: Signer[];

    let OWNER_SIGNER: any;
    let BUYER_SIGNER: any;

    let OWNER: any;
    let BUYER: any;

    let token: any;
    let minter: any;

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

        token = await MidasToken.deploy(OWNER);
        await token.deployed()

        minter = await Minter.deploy(token.address);
        await minter.deployed()

        const MINTER_ROLE = await token.MINTER_ROLE()
        await token.grantRole(MINTER_ROLE, minter.address)
        await minter.grantRole(MINTER_ROLE, OWNER)
    })

    afterEach(async () => {
        await restoreSnapshot(snapshotId)
    })

    it.only("#mint", async () => {
        let abiCoder = new ethers.utils.AbiCoder()

        let types: any = [
            "string",
            "tuple(uint256 amount, address recipient)",
            "uint256"
        ]

        let testTx = '0xc67e003ab3082631aabbf94c41562fcdadf56e02858bd66727fb9f85355d4085'
        let data = [parseEther('10000'), BUYER]
        let nonce = await minter.nonce()

        let values: any = [
            testTx,
            data,
            nonce
        ]

        let encodedData = abiCoder.encode(types, values)
        console.log(encodedData)
        let signature = keccak256(encodedData)
        console.log(`0x${signature.toString('hex')}`)

        await minter.mint(testTx, data, `0x${signature.toString('hex')}`)
        assert.equal(String(await token.balanceOf(DEAD_ADDRESS)), String(parseEther('10000')))
    })

});
