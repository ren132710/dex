const { ethers } = require('hardhat');
const { expect } = require('chai');

const Tokens = {
    LINK: ethers.utils.formatBytes32String('LINK'),
  };

let Dex;
let dex;
let Link;
let link;
let owner;
let trader1;
let trader2;

describe('Wallet tests', function () {

    beforeEach(async function () {
        Dex = await ethers.getContractFactory('Dex');
        dex = await Dex.deploy();
        Link = await ethers.getContractFactory('Link');
        link = await Link.deploy();

        //USAGE NOTE: you connect with signer object, you param with signer.address property
        [owner, trader1, trader2] = await ethers.getSigners();
    });

    describe('Deployment tests', function () {

        it('Should set the correct owner', async () => {
            const ownerAddress = await dex.owner();
            expect(await dex.owner()).to.equal(owner.address);
        })
    });

    describe('Wallet interaction tests', function () {

        it('Should only allow owner to add token', async () => {
            await dex.connect(owner).addToken(Tokens.LINK, link.address);
            let tokenList = await dex.getTokenList();
            expect(tokenList.length).to.be.equal(1);
        });

        it('Should revert if non-owner tries to add token', async () => {
            await expect(
                dex.connect(trader1).addToken(Tokens.LINK, link.address)
            ).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('Should handle deposits correctly', async () => {
            let balanceOwnerWallet;
            let balanceTrader1Wallet, balanceTrader1Link;
            await dex.connect(owner).addToken(Tokens.LINK, link.address);
            await link.connect(owner).approve(dex.address, 1000);

            //Given owner (owner is minter so initally only owner has tokens to deposit)
            //When owner deposits tokens into the wallet
            await dex.connect(owner).depositToken(100, Tokens.LINK);

            //Then owner's wallet token balance should update correctly
            balanceOwnerWallet = await dex.connect(owner).getMyTokenBalance(Tokens.LINK);
            expect(balanceOwnerWallet).to.be.equal(100);

            //Given trader (not owner)
            await link.connect(owner).transfer(trader1.address, 50);
            balanceTrader1Link = await link.connect(trader1).balanceOf(trader1.address);
            expect(balanceTrader1Link).to.be.equal(50);
            await link.connect(trader1).approve(dex.address, 100);

            //When trader deposits tokens into the wallet
            await dex.connect(trader1).depositToken(50, Tokens.LINK);

            //Then trader's wallet token balance should update correctly
            balanceTrader1Wallet = await dex.connect(trader1).getMyTokenBalance(Tokens.LINK);
            expect(balanceTrader1Wallet).to.be.equal(50);
        });

        it('Should prevent withdraw when balance is insufficient', async () => {
            await dex.connect(owner).addToken(Tokens.LINK, link.address);

            //Given trader with no token balance
            //Then withdraw should be reverted
            await expect(
                dex.connect(trader1).withdrawToken(50, Tokens.LINK)
            ).to.be.revertedWith('Wallet: Balance not sufficient');
        });

        it('Should handle owner withdraws correctly', async () => {
            let balanceOwnerWallet, balanceOwnerLink;

            //Given owner with token balance
            await link.connect(owner).approve(dex.address, 1000);
            await dex.connect(owner).addToken(Tokens.LINK, link.address);
            await dex.connect(owner).depositToken(100, Tokens.LINK);

            //When owner withdraws tokens
            await dex.connect(owner).withdrawToken(30, Tokens.LINK);

            //Then token balance of owner should update correctly
            balanceOwnerWallet = await dex.connect(owner).getMyTokenBalance(Tokens.LINK);
            expect(balanceOwnerWallet).to.be.equal(70);
            balanceOwnerLink = await link.connect(owner).balanceOf(owner.address);
            expect(balanceOwnerLink).to.be.equal(930); //1000-100+30 = 930
        });

        it('Should handle trader withdraws correctly', async () => {
            let balanceTrader1Wallet, balanceTrader1Link;

            //Given trader with token balance
            await link.connect(owner).approve(dex.address, 1000);
            await dex.connect(owner).addToken(Tokens.LINK, link.address);
            await dex.connect(owner).depositToken(100, Tokens.LINK);
            await link.connect(owner).transfer(trader1.address, 50);
            await link.connect(trader1).approve(dex.address, 100);
            await dex.connect(trader1).depositToken(50, Tokens.LINK);

            //When trader withdraws tokens
            await dex.connect(trader1).withdrawToken(30, Tokens.LINK);

            //Then token balance of trader should update correctly
            balanceTrader1Wallet = await dex.connect(trader1).getMyTokenBalance(Tokens.LINK);
            expect(balanceTrader1Wallet).to.be.equal(20);
            balanceTrader1Link = await link.connect(trader1).balanceOf(trader1.address);
            expect(balanceTrader1Link).to.be.equal(30);
        });
    });
});
