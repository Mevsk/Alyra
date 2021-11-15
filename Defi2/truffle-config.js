const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();

module.exports = {

  networks: {
    development: {
      host: "127.0.0.1", // localhost de notre réseau ganache 
      port: 8545, // le port rpc de notre réseau ganache 
      network_id: "*",// le network id de notre réseau ganache 
    },

    ropsten:{
      provider : function() {return new HDWalletProvider(`${process.env.MNEMONIC}`,`https://ropsten.infura.io/v3/${process.env.INFURA_ID}`)},
      network_id:3
    }
  },
 

 compilers: {
 solc: {
  version: "0.8.7",
  settings: {  
    optimizer: {
    enabled: false,
    runs: 200
    }
  }
}
}
};
