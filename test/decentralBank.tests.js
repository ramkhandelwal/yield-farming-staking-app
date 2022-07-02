const RWD = artifacts.require('RWD')
const Tether = artifacts.require('Tether')
const DecentralBank = artifacts.require('DecentralBank')

require('chai')
.use(require('chai-as-promised'))
.should()

contract('DecentralBank', ([owner, customer]) => {
    let tether, rwd, decentralBank

    function  tokens(number) {
        return web3.utils.toWei(number, 'ether')
    }

    before(async ()=>{
        //Load contracts
        tether= await Tether.new()
        rwd= await RWD.new()
        decentralBank= await DecentralBank.new(rwd.address, tether.address)

        //transfer all reward tokens to decentral bank
        await rwd.transfer(decentralBank.address, tokens('1000000'))

        //transfer 100 tokens to the investor
        await tether.transfer(customer, tokens('100'), {from:owner})
    })


    describe('Mock tether deployment', async () => {
        it('matches name successfully', async()=>{
            const name =await tether.name()
            assert.equal(name, 'Tether')
        })
    })

    describe('Reward token deployment', async () => {
        it('matches name successfully', async()=>{
            const name =await rwd.name()
            assert.equal(name, 'Reward token')
            
        })
    })

    describe('Decentral Bank deployment', async () => {
        it('matches name successfully', async()=>{
            const name =await decentralBank.name()
            assert.equal(name, 'Decentral Bank')
        })

        it('contract has tokens', async ()=>{
            let balance = await rwd.balanceOf(decentralBank.address)
            assert.equal(balance, tokens('1000000'))

        })
    })

    describe('Yield farming', async()=>{
        it('reward tokens for staking', async()=>{
            let result
            result=await  tether.balanceOf(customer)
            assert.equal(result.toString(),tokens('100'),'customer balance before staking' )

            // check staking of customer
            await tether.approve(decentralBank.address ,tokens('100'), {from:customer})
            await decentralBank.depositTokens(tokens('100'), {from:customer})
            
            //check updated balance of customer
            result=await  tether.balanceOf(customer)
            assert.equal(result.toString(),tokens('0'),'customer balance after staking 100 tokens' )

            result=await tether.balanceOf(decentralBank.address)
            assert.equal(result.toString(),tokens('100'),'bank balance after staking from customer' )

            //is staking update
            result=await  decentralBank.isStaking(customer)
            assert.equal(result.toString(),'true','customer staking status after staking' )

            // Issue Tokens
            await decentralBank.issueTokens({from: owner})

            // Ensure Only The Owner Can Issue Tokens
            await decentralBank.issueTokens({from: customer}).should.be.rejected;

            // Unstake Tokens
            await decentralBank.unstakeTokens({from: customer})

            // Check Unstaking Balances

            result = await tether.balanceOf(customer)
            assert.equal(result.toString(), tokens('100'), 'customer mock wallet balance after unstaking')     
            
            // Check Updated Balance of Decentral Bank
            result = await tether.balanceOf(decentralBank.address)
            assert.equal(result.toString(), tokens('0'), 'decentral bank mock wallet balance after staking from customer')     
            
            // Is Staking Update
            result = await decentralBank.isStaking(customer)
            assert.equal(result.toString(), 'false', 'customer is no longer staking after unstaking')
        })
        
        
    })

    
});