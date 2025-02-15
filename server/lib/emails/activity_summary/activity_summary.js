const CONFIG = require('config')
const _ = require('builders/utils')
const { findOneWaitingForSummary } = require('controllers/user/lib/summary')
const sendActivitySummary = require('./send_activity_summary')

const { oneHour } = require('lib/time')
const { maxEmailsPerHour } = CONFIG.activitySummary
const emailsInterval = oneHour / maxEmailsPerHour

module.exports = () => {
  _.info(CONFIG.activitySummary, 'activity summary')
  setInterval(sendOneUserSummary, emailsInterval)
}

const sendOneUserSummary = async () => {
  try {
    const user = await findOneWaitingForSummary()
    await sendActivitySummary(user)
  } catch (err) {
    _.error(err, 'waitingForSummary err')
  }
}
