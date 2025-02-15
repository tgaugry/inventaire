const _ = require('builders/utils')
const { Wait } = require('lib/promises')
const helpers_ = require('./helpers')
const transporter_ = require('./transporter')
const email_ = require('./email')
const user_ = require('controllers/user/lib/user')
const groups_ = require('controllers/groups/lib/groups')

module.exports = {
  validationEmail: (userData, token) => {
    userData = user_.serializeData(userData)
    const email = email_.validationEmail(userData, token)
    return transporter_.sendMail(email)
    .catch(_.Error('validationEmail'))
  },

  resetPassword: (userData, token) => {
    userData = user_.serializeData(userData)
    const email = email_.resetPassword(userData, token)
    return transporter_.sendMail(email)
    .catch(_.Error('resetPassword'))
  },

  friendAcceptedRequest: (userToNotify, newFriend) => {
    return helpers_.getUsersByIds(userToNotify, newFriend)
    .then(email_.friendAcceptedRequest)
    .then(transporter_.sendMail)
    .catch(helpers_.catchDisabledEmails)
    .catch(Err('friendAcceptedRequest', userToNotify, newFriend))
  },

  friendshipRequest: (userToNotify, requestingUser) => {
    return helpers_.getUsersByIds(userToNotify, requestingUser)
    .then(email_.friendshipRequest)
    .then(transporter_.sendMail)
    .catch(helpers_.catchDisabledEmails)
    .catch(Err('friendshipRequest', userToNotify, requestingUser))
  },

  group: (action, groupId, actingUserId, userToNotifyId) => {
    return helpers_.getGroupAndUsersData(groupId, actingUserId, userToNotifyId)
    .then(email_.group.bind(null, action))
    .then(transporter_.sendMail)
    .catch(helpers_.catchDisabledEmails)
    .catch(Err(`group ${action}`, actingUserId, userToNotifyId))
  },

  groupJoinRequest: async (groupId, requestingUserId) => {
    const group = await groups_.byId(groupId)
    if (group.open) return
    const adminsIds = _.map(group.admins, 'user')
    const admins = await user_.byIds(adminsIds)
    const userData = await user_.byId(requestingUserId)
    let emails = admins.map(email_.GroupJoinRequest(userData, group))
    // Remove emails aborted due to user settings
    emails = _.compact(emails)
    return sendSequentially(emails, 'groupJoinRequest')
  },

  feedback: (subject, message, user, unknownUser, uris, context) => {
    const email = email_.feedback(subject, message, user, unknownUser, uris, context)
    return transporter_.sendMail(email)
    .catch(_.Error('feedback'))
  },

  friendInvitations: (userData, emailAddresses, message) => {
    userData = user_.serializeData(userData)
    const emails = emailAddresses.map(email_.FriendInvitation(userData, message))
    return sendSequentially(emails, 'friendInvitations')
  },

  groupInvitations: (userData, group, emailAddresses, message) => {
    userData = user_.serializeData(userData)
    const emails = emailAddresses.map(email_.GroupInvitation(userData, group, message))
    return sendSequentially(emails, 'groupInvitations')
  }
}

const sendSequentially = (emails, label) => {
  const totalEmails = emails.length
  const sendNext = () => {
    const nextEmail = emails.pop()
    if (!nextEmail) return

    _.info(`[${label} email] sending ${totalEmails - emails.length}/${totalEmails}`)

    // const email = emailFactory(nextEmail)
    return transporter_.sendMail(nextEmail)
    .catch(_.Error(`${label} (address: ${nextEmail.to} err)`))
    // Wait to lower risk to trigger any API quota issue from the email service
    .then(Wait(500))
    // In any case, send the next
    .then(sendNext)
  }

  return sendNext()
}

const Err = (label, user1, user2) => _.Error(`${label} email fail for ${user1} / ${user2}`)
