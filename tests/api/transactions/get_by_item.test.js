require('should')
const { getTransactionsByItem } = require('tests/api/utils/transactions')
const { getUserC } = require('tests/api/utils/utils')
const { createTransaction } = require('../fixtures/transactions')

describe('transactions:get:by-item', () => {
  it('should get a transaction by item, as item owner', async () => {
    const { transaction, userB, userBItem } = await createTransaction()
    const { transactions } = await getTransactionsByItem(userB, userBItem._id)
    transactions.length.should.equal(1)
    transactions[0]._id.should.equal(transaction._id)
  })

  it('should get a transaction by item, as item requester', async () => {
    const { transaction, userA, userBItem } = await createTransaction()
    const { transactions } = await getTransactionsByItem(userA, userBItem._id)
    transactions.length.should.equal(1)
    transactions[0]._id.should.equal(transaction._id)
  })

  it('should not get a transaction not involving the requesting user', async () => {
    const { userBItem } = await createTransaction()
    const { transactions } = await getTransactionsByItem(getUserC(), userBItem._id)
    transactions.length.should.equal(0)
  })
})
