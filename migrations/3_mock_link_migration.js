const Link = artifacts.require('Link');
const Wallet = artifacts.require('Wallet');

//const name = "Chainlink";
//const symbol = "LINK";

//module.export function has 3 parameters
//deployer = deployer object is main interface for staging deployment tasks
//network = local, testnet, mainnet, etc, to conditionally stage deployment steps
//accounts = the available accounts provided by the Ethereum client to be used during deployment
//function must be marked as async in order to use 'await'

module.exports = async function (deployer, network, accounts) {
    await deployer.deploy(Link);

    //await deployer.deploy(Link, name, symbol); //await requires a the function to be 'async'
};
