const _ = require('builders/utils')
const users = Object.values(require('./hard_coded_documents').users)
const usersDb = require('db/couchdb/base')('users')

module.exports = () => {
  // Updating sequentially so that blue-cot initialize only a cookie session only once.
  // This seems to be required to avoid getting a 401 from CouchDB,
  // especially when CouchDB just started
  // Known case: when starting CouchDB and the server together with docker-compose
  const sequentialUpdate = () => {
    const nextUser = users.shift()
    if (nextUser == null) return

    return updateDoc(usersDb, nextUser)
    .then(sequentialUpdate)
  }

  return sequentialUpdate()
}

const updateDoc = async (db, doc) => {
  const { _id: id } = doc
  try {
    const currentDoc = await db.get(id)
    // Copy the _rev so that the doc have a chance to match
    // and, if not, so that we can use db.put
    const docPath = `${db.name}/${id}`
    doc._rev = currentDoc._rev
    if (!_.isEqual(currentDoc, doc)) {
      const res = await db.put(doc)
      _.success(res, `${docPath} updated`)
    }
  } catch (err) {
    // If the doc is missing, create it
    if (err.statusCode === 404) return db.put(doc)
    else throw err
  }
}
