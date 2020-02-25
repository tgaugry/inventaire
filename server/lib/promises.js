const CONFIG = require('config')

// Here should be the only direct require of bluebird
// so that every other dependency to it passed through this file
// and get the associated configuration
// Exception: cases when this policy would produce dependecy loops
const Promise = require('bluebird')
Promise.config(CONFIG.bluebird)

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports = {
  Promise,

  props: obj => {
    const keys = []
    const values = []
    for (const key in obj) {
      const value = obj[key]
      keys.push(key)
      values.push(value)
    }

    return Promise.all(values)
    .then(res => {
      const resultObj = {}
      res.forEach((valRes, index) => {
        const key = keys[index]
        resultObj[key] = valRes
      })
      return resultObj
    })
  },

  tap: fn => async res => {
    const tapRes = fn(res)
    if (tapRes instanceof Promise) await tapRes
    return res
  },

  // Source: http://bluebirdjs.com/docs/api/deferred-migration.html
  defer: () => {
    // Initialized in the defer function scope
    let resolveFn, rejectFn

    const promise = new Promise((resolve, reject) => {
      // Set the previously initialized variables
      // to the promise internal resolve/reject functions
      resolveFn = resolve
      rejectFn = reject
    })

    return {
      // A function to resolve the promise at will:
      // the promise will stay pending until 'resolve' or 'reject' is called
      resolve: resolveFn,
      reject: rejectFn,
      // The promise object, still pending at the moment this is returned
      promise
    }
  },

  wait,

  Wait: ms => async res => {
    await wait(ms)
    return res
  }
}
