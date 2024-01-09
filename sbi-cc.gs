const SPREADSHEET_URL =
  "Your sheet link here";
const SHEET_NAME = 'Sheet name here';
const QUERY =
  'newer_than:2d AND in:inbox AND from:sbicard.com AND subject:Transaction alert AND -label:sbi_processed';
const REGEX =
  /Rs.([,\d]+(.\d+))?\D+(\d+)\sat\s+(.+?)\son\s(\d+\/\d+\/\d+)/;
const DATE_FORMAT = 'es-CL';
const LABEL_NAME = 'sbi_processed';

function getRelevantMessages() {
  const threads = GmailApp.search(QUERY, 0, 500);
  console.log('Emails', threads.length);
  const messages = threads.reduceRight(
    (acc, thread) => [...acc, ...thread.getMessages()],
    []
  );
  console.log('messages', messages.length);
  return messages;
}

const parseMessageData = (messages = []) => {
  const records = [];

  messages.forEach((message) => {
    const text = message.getPlainBody();
    const textWithoutBreaks = text.replace(/(\r|\n|\r|\*)/gm, '');
    const matches = textWithoutBreaks.match(REGEX);

    if (!matches || matches?.length < 6) {
      return;
    }

    const { 3: card, 5: date, 4: merchant, 1: amount } = matches;
    var formattedDate = Moment.moment(date, "DD/MM/YY").format('DD-MM-YYYY');

    const reportedTimeObj = new Date(message.getDate());
    const timeFormatted = new Intl.DateTimeFormat(DATE_FORMAT, {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }).format(reportedTimeObj);

    records.push({
      card,
      amount,
      date: `${formattedDate} ${timeFormatted}`,
      merchant,
      reportedTime: reportedTimeObj.toISOString(),
    });
  });
  
  return records; // returns the array of objects

}

function getMessagesDisplay() {
  const templ = HtmlService.createTemplateFromFile('messages');
  templ.messages = getRelevantMessages();
  return templ.evaluate();
}

function getParsedDataDisplay() {
  const templ = HtmlService.createTemplateFromFile('parsed');
  templ.records = parseMessageData(getRelevantMessages());
  return templ.evaluate();
}

function saveDataToSheet(records) {
  const spreadsheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  for (let r = 0; r < records?.length; r++) {
    sheet.appendRow([
      records[r].date,
      records[r].card,
      records[r].merchant,
      records[r].amount,
    ]);
  }
}

function processTransactionEmails() {
  const messages = getRelevantMessages();
  const records = parseMessageData(messages);
  console.log('records', records?.length, records);
  saveDataToSheet(records);
  labelMessagesAsDone(messages);
  return true;
}

function labelMessagesAsDone(messages) {
  const labelName = LABEL_NAME;
  const label =
    GmailApp.getUserLabelByName(labelName) || GmailApp.createLabel(labelName);

  messages.forEach((message) => {
    label.addToThread(message.getThread());
  });
}

function doGet() {
  return getParsedDataDisplay();
}