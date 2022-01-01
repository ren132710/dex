const { ethers } = require('hardhat');
const { expect } = require('chai');

const Side = {
    BUY: 0,
    SELL: 1,
};

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

describe('Limit order tests', function () {

    beforeEach(async function () {
        Dex = await ethers.getContractFactory('Dex');
        dex = await Dex.deploy();
        Link = await ethers.getContractFactory('Link');
        link = await Link.deploy();
        //USAGE NOTE: connect with signer object, pass param with signer.address property
        [owner, trader1, trader2] = await ethers.getSigners();
    });

    describe('Balance sufficient tests', () => {
        //Given trader with no balances
        //When trader creates a BUY order, the transaction should revert
        it('Should revert BUY limit order when Eth balance is insufficient', async () => {
            await expect(
                dex.connect(owner).createLimitOrder(Side.BUY, Tokens.LINK, 10, 1)
            ).to.be.revertedWith('DEX: Insufficient eth balance');
        });

        it('Should revert Sell limit order when token balance is insufficient', async () => {
            //Given trader with no balances
            //When trader creates a SELL order, the transaction should revert
            await expect(
                dex.connect(owner).createLimitOrder(Side.SELL, Tokens.LINK, 10, 1)
            ).to.be.revertedWith('DEX: Insufficient token balance');
        });

        it('Should allow BUY limit order when Eth balance is sufficient', async () => {
            //Given trader with ETH and token balances
            await dex.connect(owner).depositETH({
                value: 2000
            });
            await dex.connect(owner).addToken(Tokens.LINK, link.address);
            await link.connect(owner).approve(dex.address, 1000);
            await dex.connect(owner).depositToken(100, Tokens.LINK);

            //When the trader creates a BUY limit order
            await dex.connect(owner).createLimitOrder(Side.BUY, Tokens.LINK, 10, 1);
            let orderbook = await dex.getOrderBook(Tokens.LINK, Side.BUY);

            //Then the BUY orderbook should have an order
            expect(orderbook.length).to.be.gt(0);
        });

        it('Should allow Sell limit order when token balance is sufficient', async () => {
            //Given trader with ETH and token balances
            await dex.connect(owner).depositETH({
                value: 2000
            });
            await dex.connect(owner).addToken(Tokens.LINK, link.address);
            await link.connect(owner).approve(dex.address, 1000);
            await dex.connect(owner).depositToken(100, Tokens.LINK);

            //When the trader creates a SELL limit order
            await dex.connect(owner).createLimitOrder(Side.SELL, Tokens.LINK, 5, 1);
            let orderbook = await dex.getOrderBook(Tokens.LINK, Side.SELL);

            //Then the SELL order book should have an order
            expect(orderbook.length).to.be.gt(0);
        });
    });

    describe('Bubble sort tests', function () {

        it('Should sort Buy order book from highest to lowest price', async () => {
            //Given a BUY order book filled with orders
            await dex.connect(owner).depositETH({
                value: 10000
            });
            await dex.connect(owner).addToken(Tokens.LINK, link.address);
            await link.connect(owner).approve(dex.address, 1000);
            await dex.connect(owner).depositToken(200, Tokens.LINK);

            await dex.connect(owner).createLimitOrder(Side.BUY, Tokens.LINK, 10, 40);
            await dex.connect(owner).createLimitOrder(Side.BUY, Tokens.LINK, 40, 10);
            await dex.connect(owner).createLimitOrder(Side.BUY, Tokens.LINK, 30, 20);
            await dex.connect(owner).createLimitOrder(Side.BUY, Tokens.LINK, 20, 30);

            let orderbook = await dex.getOrderBook(Tokens.LINK, Side.BUY);
            expect(orderbook.length).to.be.gt(0);

            //Then the BUY order book should be sorted highest price to lowest price
            for (let i = 0; i < orderbook.length - 1; i++) {
                expect(orderbook[i].price).to.be.gte(orderbook[i + 1].price);
            };
        });

        it('Should sort Sell order book from lowest to highest price', async () => {
            //Given a SELL order book filled with orders
            await dex.connect(owner).depositETH({
                value: 10000
            });
            await dex.connect(owner).addToken(Tokens.LINK, link.address);
            await link.connect(owner).approve(dex.address, 1000);
            await dex.connect(owner).depositToken(200, Tokens.LINK);

            await dex.connect(owner).createLimitOrder(Side.SELL, Tokens.LINK, 10, 40);
            await dex.connect(owner).createLimitOrder(Side.SELL, Tokens.LINK, 20, 30);
            await dex.connect(owner).createLimitOrder(Side.SELL, Tokens.LINK, 30, 20);
            await dex.connect(owner).createLimitOrder(Side.SELL, Tokens.LINK, 40, 10);

            let orderbook = await dex.getOrderBook(Tokens.LINK, Side.SELL);
            expect(orderbook.length).to.be.gt(0);

            //Then the SELL order book should be sorted lowest price to highest price
            for (let i = 0; i < orderbook.length - 1; i++) {
                expect(orderbook[i].price).to.be.lte(orderbook[i + 1].price);
            };
        });
    });

    describe('Update and delete limit order tests', function () {

        it('Should allow trader to delete a BUY order and the BUY order book should resort correctly', async () => {

            //Given owner with balances
            await dex.connect(owner).depositETH({ value: 10000 });
            await dex.connect(owner).addToken(Tokens.LINK, link.address);
            await link.connect(owner).approve(dex.address, 1000);
            await dex.connect(owner).depositToken(300, Tokens.LINK);

            //And trader1 with balances
            await link.connect(owner).transfer(trader1.address, 300);
            await link.connect(trader1).approve(dex.address, 300);
            await dex.connect(trader1).depositToken(300, Tokens.LINK);
            await dex.connect(trader1).depositETH({ value: 10000 });

            //And trader2 with balances
            await link.connect(owner).transfer(trader2.address, 300);
            await link.connect(trader2).approve(dex.address, 300);
            await dex.connect(trader2).depositToken(300, Tokens.LINK);
            await dex.connect(trader2).depositETH({ value: 10000 });

            //And a BUY order book filled with orders from more than one trader
            await dex.connect(owner).createLimitOrder(Side.BUY, Tokens.LINK, 5, 1);
            await dex.connect(owner).createLimitOrder(Side.BUY, Tokens.LINK, 10, 7);
            await dex.connect(owner).createLimitOrder(Side.BUY, Tokens.LINK, 15, 4);
            await dex.connect(trader1).createLimitOrder(Side.BUY, Tokens.LINK, 5, 2);
            await dex.connect(trader1).createLimitOrder(Side.BUY, Tokens.LINK, 10, 8);
            await dex.connect(trader1).createLimitOrder(Side.BUY, Tokens.LINK, 15, 5);
            await dex.connect(trader2).createLimitOrder(Side.BUY, Tokens.LINK, 5, 3);
            await dex.connect(trader2).createLimitOrder(Side.BUY, Tokens.LINK, 10, 9);
            await dex.connect(trader2).createLimitOrder(Side.BUY, Tokens.LINK, 15, 6);
            let orderbook = await dex.getOrderBook(Tokens.LINK, Side.BUY);
            expect(orderbook.length).to.be.equal(9);

            //When trader1 deletes one of his buy orders
            let beforeTrader1BuyLimitOrders = await dex.getTraderOrderBook(trader1.address, Tokens.LINK, Side.BUY);
            expect(beforeTrader1BuyLimitOrders.length).to.be.equal(3); //<<--TODO: Test is currently breaking here, returns(0)
            let orderId = beforeTrader1BuyLimitOrders[1].OrderID; //pick one of the 3 trader1 orders to delete
            await dex.connect(trader1).deleteLimitOrder(orderId); //and delete the order

            //then the order is removed from the order book
            let afterTrader1BuyLimitOrders = await dex.getTraderOrderBook(trader1.address, Tokens.LINK, Side.BUY);
            expect(afterTrader1BuyLimitOrders.length).to.be.equal(2);
            expect(orderbook.length).to.be.equal(8);

            //and the BUY order book is resorted from highest price to lowest price
            for (let i = 0; i < orderbook.length - 1; i++) {
                expect(orderbook[i].price).to.be.lte(orderbook[i+1].price);
            }
        });

        it.skip('Should allow trader to delete a SELL order and the SELL order book should resort correctly', async () => {
            // Given an orderbook filled with orders from more than one trader
            // And a trader with several orders
            // When the trader deletes an order
            // Then all the following are true:
            // a trader may only delete orders that belong to the trader
            // the order is removed from the orderBook
            // the order book is resorted correctly
        });

        it.skip('Should allow trader to update and order and the order book should resort correctly', async () => {
            // Given an orderbook filled with orders from more than one trader
            // And a trader with several orders
            // When the trader updates an order
            // Then all the following are true:
            // a trader may only update orders that belong to the trader
            // the order is updated
            // the order book is resorted correctly
            // BUY order in middle of order book, order price is reduced >> bubble sort compares to right
            // BUY order in middle of order book, order price is raised >> bubble sort compares to left
            // BUY order is top of order book, order price is raised >> no need to sorted
            // BUY order is bottom of order book, order price is raised >> bubble sort compares to left
            // and so on
            // opposite for SELL orders
        });
    });
});
