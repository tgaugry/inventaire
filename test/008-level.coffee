__ = require('config').root
_ = __.require 'builders', 'utils'

should = require 'should'
expect = require('chai').expect
trycatch = require 'trycatch'
Promise = require 'bluebird'

levelBase = __.require 'level', 'base'
rawDb = levelBase.raw('hello')
promDb = levelBase.promisified(rawDb)
unjsonizedDb = levelBase.unjsonized(promDb)
db = unjsonizedDb

describe 'DB', ->
  describe 'LEVEL BASE', ->

    describe 'RAW', ->
      it "should put and get a string", (done)->
        trycatch( ->
          rawDb.put 'what', 'zup', (err, body)->
            if err? then _.error err
            rawDb.get 'what', (err, body)->
              _.log body, 'body'
              body.should.equal 'zup'
              done()
        , done)

      it "should put and get an object", (done)->
        trycatch( ->
          obj = {bob: 'by'}
          json = JSON.stringify(obj)
          rawDb.put 'salut', json, (err, body)->
            if err? then _.error err
            rawDb.get 'salut', (err, body)->
              _.log body, 'body'
              body.should.be.a.String
              obj2 = JSON.parse body
              obj2.should.be.an.Object
              obj2.bob.should.equal 'by'
              done()
        , done)

    describe 'PROMISIFIED', ->
      it "should put and get a string", (done)->
        trycatch( ->
          promDb.putAsync('what', 'zup')
          .then (res)->
            promDb.getAsync('what')
            .then (res)->
              _.log res, 'res'
              res.should.equal 'zup'
              done()
        , done)

      it "should put and get an object", (done)->
        trycatch( ->
          obj = {da: 'zup'}
          json = JSON.stringify(obj)
          promDb.putAsync('yo', json)
          .then (res)->
            promDb.getAsync('yo')
            .then (res)->
              obj2 = JSON.parse res
              obj2.should.be.an.Object
              obj2.da.should.equal 'zup'
              done()
        , done)

    describe 'UNJSONIZED', ->
      it "should put and get a string", (done)->
        trycatch( ->
          unjsonizedDb.put('what', 'zup')
          .then (res)->
            unjsonizedDb.get('what')
            .then (res)->
              _.log res, 'res'
              res.should.equal 'zup'
              done()
        , done)

      it "should put and get an object", (done)->
        trycatch( ->
          obj = {ahoy: 'georges'}
          unjsonizedDb.put('ohoh', obj)
          .then (res)->
            unjsonizedDb.get('ohoh')
            .then (res)->
              res.should.be.an.Object
              res.ahoy.should.equal 'georges'
              done()
        , done)

    describe 'GET STREAM', ->
      it "should return a promise", (done)->
        trycatch( ->
          db.getStream()
          .then (res)->
            _.log res, 'res'
            done()
        , done)

      it "should return just what is asked", (done)->
        trycatch( ->
          db.put('123:a', 'zou')
          db.put('123:b', 'bi')
          db.put('123:c', 'dou')
          params =
            gt: '123'
            lt: '123' + 'Z'
          db.getStream(params)
          .then (res)->
            res.should.be.an.Array
            res.length.should.equal 3
            done()
        , done)