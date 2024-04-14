# IS4302 Group 13 Project : BlockLease - Decentralized Rental Ecosystem

BlockLease is a decentralized rental ecosystem built on blockchain technology, revolutionizing the traditional rental industry with transparency, security, and efficiency. Our platform facilitates seamless interactions between landlords and tenants, streamlining processes such as property listings, rental applications, agreements, payments, and dispute resolution. Real Estate Validators (a.k.a Experts or Gurus), can assess disputes and vote on resolutions, ensuring impartiality and fairness.

## Instructions to run client

### Generating build and deploying onto Ganache

1. Start up `Ganache` as described in the documentation. **Ensure that you set the network ID to be `1337`.**
1. `npm install` from the root directory for dependencies to build and deploy the smart contracts
1. Once done, `truffle compile` to check if the smart contracts are compilable.
1. Then, `truffle build` to generate the relevant build for the smart contracts.
1. Then, `truffle migrate` to deploy the relevant smart contracts onto Ganache.

### Running the client

1. `cd client` to enter the client directory
2. Set up the `.env.local` as described in the documentation.
3. `npm install` to install the relevant modules required to run the frontend.
4. `npm run dev` to start up the client.
