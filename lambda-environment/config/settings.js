const env = require('env-var')
const settings = {
  NODE_ENV: env.get('NODE_ENV').required().asString(),
  commitMessageUrl: env.get('APICommitMessageURL').required().asString(),
  DBTableName: env.get('DBTableName').required().asString()
}

module.exports = settings