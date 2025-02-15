#!/usr/bin/env node
require('module-alias/register')
const _ = require('builders/utils')
const split = require('split')
const through = require('through')
const { readFileSync } = require('node:fs')
const serializeEntityInTurtle = require('./lib/serialize_entity_in_turtle')
const path = require('node:path')

const headers = readFileSync(path.join(__dirname, 'headers.ttl')).toString()
// Prefix the dump by the headers
process.stdout.write(headers + '\n')

const parse = line => {
  // Omit the last empty line
  if (!_.isNonEmptyString(line)) return
  try {
    const json = JSON.parse(line.replace(/,$/, ''))
    // Output on process.stdin
    process.stdout.write(serializeEntityInTurtle(json) + '\n')
  } catch (err) {
    console.error('error on line', line)
    throw err
  }
}

process.stdin
.pipe(split())
.pipe(through(parse))
.on('error', _.Error('conversion error'))
