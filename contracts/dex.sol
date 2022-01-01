// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "./wallet.sol";
import "hardhat/console.sol";

contract Dex is Wallet {

    using SafeMath for uint256;

    enum Side {
        BUY,
        SELL
    }

    struct Order{
        uint256 orderId;
        address trader;
        Side side;
        bytes32 ticker;
        uint256 amount;
        uint256 price;
        //uint256 filled; //track total amount that has been filled
    }

    uint256 public nextOrderId = 0;

    //map ticker,side => Order
    mapping(bytes32 => mapping(uint256 => Order[])) public orderBook;

    //map trader,ticker,side => Order
    mapping(address => mapping(bytes32 => mapping(uint256 =>Order[]))) public traderOrderBook;

    function getOrderBook(bytes32 ticker, Side side) public view returns (Order[] memory){
        return orderBook[ticker][uint256(side)];
    }

    function getTraderOrderBook(address trader, bytes32 ticker, Side side) public view returns (Order[] memory){
        //TODO: how to get the orderbook based on 3 keys: trader.address, ticker, side
        //Order[] memory traderOrders = traderOrderBook[trader][ticker][uint256(side)];
        //console.log(traderOrders);
        //return traderOrders;
        return traderOrderBook[trader][ticker][uint256(side)];
    }

    function createLimitOrder(Side side, bytes32 ticker, uint256 amount, uint256 price) public {
        hasSufficientBalanceForLimitOrder(side, ticker, amount, price);

        //get the orderbook for the side of the trade we are on
        //orderBook[ticker][uint256(side)].push(Order(nextOrderId, msg.sender, side, ticker, amount, price));
        Order[] storage orders = orderBook[ticker][uint256(side)];
        orders.push(Order(nextOrderId, msg.sender, side, ticker, amount, price));

        //bubble sort the orderbook
        uint256 position = orders.length > 0 ? orders.length -1 : 0;

        if(side == Side.BUY){
            for (uint256 i = 0; i < orders.length - 1; i++){
                if (position == 0) {
                    break; //orderbook is empty so no need to sort
                }
                //ensure BUY orderbook is sorted highest price to lowest price
                else if (orders[position - 1].price > orders[position].price) {
                    break; //orderbook is already sorted correctly
                }
                Order memory orderToMove = orders[position - 1];
                orders[position - 1] = orders[position];
                orders[position] = orderToMove;
                position = position - 1;
            }
        }
        else if(side == Side.SELL){
            for (uint256 i = 0; i < orders.length - 1; i++){
                if (position == 0) {
                    break; //orderbook is empty so no need to sort
                }
                //ensure SELL orderbook is sorted lowest price to highest price
                else if (orders[position - 1].price < orders[position].price) {
                    break; //orderbook is already sorted correctly
                }
                Order memory orderToMove = orders[position - 1];
                orders[position - 1] = orders[position];
                orders[position] = orderToMove;
                position = position - 1;
            }
        }
        nextOrderId++;
    }

    function hasSufficientBalanceForLimitOrder(Side side, bytes32 ticker, uint256 amount, uint256 price) internal view {
        if (side == Side.BUY) {
            require(balances[msg.sender][bytes32("ETH")] >= amount.mul(price), "DEX: Insufficient eth balance");
        }
        else if (side == Side.SELL) {
            require(balances[msg.sender][ticker] >= amount, "DEX: Insufficient token balance");
        }
    }
}
