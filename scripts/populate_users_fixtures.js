#!/usr/bin/env node
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { createUserWithItems } = require('../tests/api/fixtures/populate')
const [ username ] = process.argv.slice(2)

createUserWithItems({ username })
.then(userCreated => {
  _.success('#### New User available ####')
  console.log(`Your can now login with :
  - Username : ${userCreated.username}
  - Password : 12345678`)
  return process.exit(0)
})
.catch(_.Error('users fixture err'))
