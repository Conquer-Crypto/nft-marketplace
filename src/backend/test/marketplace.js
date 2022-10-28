const { expect } = require('chai');
const { etherse, ethers } = require('hardhat');

const toWei = (num) => ethers.utils.parseEther(num.toString());
const fromWei = (num) => ethers.utils.formatEther(num);

describe("Conquer Blocks NFT Marketplace", function(){
    let deployer, address1, address2, nft, marketplace;
    let feePercent = 5;
    let URI = "Sample URI for tokens";

    beforeEach(async function() {
        const NFT = await ethers.getContractFactory("BlocksNFT");
        const Marketplace = await ethers.getContractFactory("Marketplace");
        
        [deployer, address1, address2] = await ethers.getSigners();

        nft = await NFT.deploy();
        marketplace = await Marketplace.deploy(feePercent);
    });

    describe("Deploy", function() {
        it("NFT should have the correct name and symbol", async function() {
            expect(await nft.name()).to.equal("Conquer Blocks NFTs");
            expect(await nft.symbol()).to.equal("CBN");
        });
        it("Marketplace should have the correct feeAddess and fee percent.", async function() {
            expect(await marketplace.feeAccount()).to.equal(deployer.address);
            expect(await marketplace.feePercent()).to.equal(feePercent);
        });
    });

    describe("NFT", function() {
        it("Should track every NFT", async function() {
            await nft.connect(address1).mint(URI);
            expect(await nft.tokenCount()).to.equal(1);
            expect(await nft.balanceOf(address1.address)).to.equal(1);
            expect(await nft.tokenURI(1)).to.equal(URI);

            await nft.connect(address2).mint(URI);
            expect(await nft.tokenCount()).to.equal(2);
            expect(await nft.balanceOf(address2.address)).to.equal(1);
            expect(await nft.tokenURI(2)).to.equal(URI);
        });
    });


    describe("Marketplace", function() {

        beforeEach(async function() {
            await nft.connect(address1).mint(URI);
            await nft.connect(address1).setApprovalForAll(marketplace.address, true);
        });

        it("Should create the market item", async function() {
            expect(await marketplace.connect(address1).createItem(nft.address, 1, toWei(1))).to.emit(
                marketplace, "Offered").withArgs(
                    1,
                    nft.address,
                    1,
                    toWei(1),
                    address1.address
                );
            expect(await nft.ownerOf(1)).to.equal(marketplace.address);

            expect(await marketplace.itemCount()).to.equal(1);

            const item = await marketplace.items(1);
            expect(item.itemId).to.equal(1);
            expect(item.nft).to.equal(nft.address);
            expect(item.tokenId).to.equal(1);
            expect(item.price).to.equal(toWei(1));
            expect(item.sold).to.equal(false);
        });

        it("Should fail when price is 0.", async function() {
            await expect(marketplace.connect(address1).createItem(nft.address, 1, 0)).to.be.revertedWith('Price must be bigger than 0');
        });
    });
    describe("Purcheasing marketplace items", function() {
        let totalPriceInWei;
        beforeEach(async function () {
            //Address 1 mints an nft
            await nft.connect(address1).mint(URI);
            // Address 1 approves marketplace to spend the nft
            await nft.connect(address1).setApprovalForAll(marketplace.address, true);
            // Address 1 publish his item to the marketplace
            await marketplace.connect(address1).createItem(nft.address, 1, toWei(1));
        });

        it("Should update item as sold, pay seller, transfer NFT to buyer, charge fees and emit a Bought event", async function (){
            const sellerInitialEthBalance = await address1.getBalance();
            const buyerInitialEthBalance = await address2.getBalance();
            const feeAccountInitialEthBalance = await deployer.getBalance();
            
            totalPriceInWei = await marketplace.getTotalPrice(1);
            await expect(marketplace.connect(address2).purchaseItem(1, {value: totalPriceInWei}))
            .to.emit(marketplace, "Bought")
            .withArgs(
                1,
                nft.address,
                1,
                toWei(1),
                address1.address,
                address2.address
            );
            const sellerFinalEthBalance = await address1.getBalance();
            const buyerFinalEthBalance = await address2.getBalance();
            const feeAccountFinalEthBalance = await deployer.getBalance();
            expect(fromWei(sellerFinalEthBalance) - fromWei(sellerInitialEthBalance)).to.equal(1);
            expect(fromWei(buyerInitialEthBalance) - fromWei(buyerFinalEthBalance)).to.be.above(1 + (feePercent / 100));
            expect(fromWei(feeAccountFinalEthBalance) - fromWei(feeAccountInitialEthBalance)).to.be.below(1 * (feePercent/100));

        });
        
    });

});