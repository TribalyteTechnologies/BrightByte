module.exports = {
    networks: {
      development: {
        host: "http://localhost",     // Localhost (default: none)
        port: 22000,            // Standard Ethereum port (default: none)
        network_id: "*",       // Any network (default: none)
      }
    },
    compilers:
    {
      solc:
      {
        version: "0.4.21"
      }
    }
  }