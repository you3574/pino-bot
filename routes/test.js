var express = require('express');
var router = express.Router();
const slackConfig = require('../conf/slack.json');
const slackService = require('./slackService');
const jiraConfig = require('../conf/jira.json');
const jiraService = require('./jiraService');

// This argument can be a channel ID, a DM ID, a MPDM ID, or a group ID
const conversationId = slackConfig.testChannelID;

router.get('/hello', (req, res) => {
  slackService.sendMessage({ channel: conversationId, text: 'Hello there' }, (result) => {
    res.send(result);
  });
});

router.get('/attachment', (req, res) => {
  const msgObj = {
    channel: conversationId,
    text: 'Hello there',
    attachments: [
      {
        'text': 'And here’s an attachment!',
        'color': '#2eb886'
      }, {
        'fallback': 'Required plain-text summary of the attachment.',
        'color': 'danger',
        'pretext': 'Optional text that appears above the attachment block',
        'author_link': 'http://flickr.com/bobby/',
        'title': 'Slack API Documentation',
        'title_link': 'https://api.slack.com/',
        'text': 'Optional text that appears within the attachment',
        'fields': [
          {
            'title': 'Priority',
            'value': 'Major',
            'short': true
          }, {
            'title': 'Name',
            'value': 'High',
            'short': true
          }, {
            'title': 'reproduce',
            'value': '1~10%',
            'short': false
          }
        ],
        'image_url': 'http://my-website.com/path/to/image.jpg',
        'thumb_url': 'https://platform.slack-edge.com/img/default_application_icon.png',
        'footer': 'Slack API',
        'footer_icon': 'https://platform.slack-edge.com/img/default_application_icon.png',
        'ts': Date.now()
      }
    ]
  };

  slackService.sendMessage(msgObj, (result) => {
    res.send(result);
  });
});

router.get('/jira-get-issue/:issueKey', (req, res) => {
  const issueKey = req.params.issueKey;

  jiraService.getIssueByKey(issueKey, (data) => {
    var issueData = {
      key: data.key,
      project: data.fields.project,
      issueLink: `${jiraConfig.httpHost}/browse/${issueKey}`,
      issueType: data.fields.issuetype.name,
      summary: data.fields.summary,
      description: data.fields.description,
      priority: data.fields.priority.name,
      Severity: data.fields.customfield_10503,
      status: data.fields.status.name,
      fixVersion: data.fields.fixVersions,
      created: data.fields.created,
      creator: data.fields.creator.displayName,
      reporter: data.fields.reporter.displayName,
      assignee: data.fields.assignee,
    };
    res.json(issueData);
  });
});

router.get('/jira-issue-slack/:issueKey', (req, res) => {
  const issueKey = req.params.issueKey;
  jiraService.getIssueByKey(issueKey, (data) => {
    // data parsing
    let issueData = {
      key: data.key,
      project: data.fields.project,
      issueLink: `${jiraConfig.httpHost}/browse/${issueKey}`,
      issueTypeName: data.fields.issuetype.name,
      issueTypeObj: data.fields.issuetype,
      summary: data.fields.summary,
      description: data.fields.description,
      priority: data.fields.priority.name,
      Severity: data.fields.customfield_10503,
      status: data.fields.status.name,
      fixVersion: data.fields.fixVersions,
      created: data.fields.created,
      creator: data.fields.creator.displayName,
      reporter: data.fields.reporter.displayName,
      assignee: data.fields.assignee
    };
    const msgObj = {
      channel: conversationId,
      attachments: [
        {
          'author_name': issueData.issueTypeName,
          'fallback': `[${issueData.key}] ${issueData.summary}`,
          'color': jiraConfig.ticketColors[issueData.issueTypeName],
          'title': `[${issueData.key}] ${issueData.summary}`,
          'title_link': issueData.issueLink,
          'fields': [
            {
              'title': 'Priority',
              'value': issueData.priority,
              'short': true
            }, {
              'title': 'Status',
              'value': issueData.status,
              'short': true
            }, {
              'title': 'Assignee',
              'value': issueData.assignee.displayName,
              'short': true
            }, {
              'title': 'Reporter',
              'value': issueData.reporter,
              'short': true
            }, {
              'title': 'Created',
              'value': issueData.created,
              'short': false
            }
          ],
          'footer': 'JIRA & SLACK'
        }
      ]
    };
    slackService.sendMessage(msgObj, (result) => {
      res.send(result);
    });
  });
});

module.exports = router;