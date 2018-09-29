var express = require('express');
var router = express.Router();
const slackService = require('./slackService');
const jiraService = require('./jiraService');

/* GET users listing. */
router.get('/', function (req, res) {
  res.send('respond with a resource');
});

const webhookMsgCont = function (data, webhookId, cb) {
  // TODO: make can looping
  if (jiraService.jiraConfig.jiraTracker[0].webhookId == webhookId) {
    webhookMsgCreator(data, (msg) => {
      let message = Object.assign({
        channel: jiraService.jiraConfig.jiraTracker[0].sender.channel}, msg);
      cb(message);
    });
  }
};
const webhookMsgCreator = function(data, cb) {
  // webhookEvent -> 'jira:issue_created', 'jira:issue_updated'
  let eventType = data.webhookEvent;
  // issue -> {key, fields:{}}
  let issue = data.issue;
  // changelog -> {items: [{field, fieldtype, from, fromString, to, toString}]}
  let changelog = data.changelog;
  let statusString;

  if (eventType === 'jira:issue_created') {
    statusString = `:new: ${issue.fields.status.name}`;
  }
  if (eventType === 'jira:issue_updated') {
    // TODO: Refactoring from, to cases already resolved issues
    let logFrom = changelog.items[0].fromString ? changelog.items[0].fromString : changelog.items[1].fromString;
    let logTo = changelog.items[0].toString ? changelog.items[0].toString : changelog.items[1].toString;
    statusString = `\`${logFrom}\` :arrow_right: \`${logTo}\``;
  }

  let msg = {
    attachments: [
      {
        'author_name': issue.fields.issuetype.name,
        'title': `[${issue.key}] ${issue.fields.summary}`,
        'title_link': `${jiraService.jiraConfig.httpHost}/browse/${issue.key}`,
        'fields': [
          {
            'title': 'Status',
            'value': statusString,
            'short': false
          }, {
            'title': 'Assignee',
            'value': issue.fields.assignee.displayName,
            'short': true
          }, {
            'title': 'Reporter',
            'value': issue.fields.reporter.displayName,
            'short': true
          }
        ],
        'footer': 'JIRA tracker'
      }
    ]
  };
  cb(msg);
};

router.post('/webhook', (req, res) => {
  const reqBody = req.body;
  const webhookId = req.query['wh-id'];
  
  webhookMsgCont(reqBody, webhookId, (result) => {
    slackService.sendMessage(result);
  });
});

module.exports = router;
