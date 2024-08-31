const QUERY = "newer_than:2d AND in:all AND from:axisbank.com AND subject:Transaction alert AND -label:axis_processed"
const REGEX = /ard no.\s(XX\d+)\sfor\s([A-Z]{3})\s([0-9,]*\.*[0-9]*)\sat\s+(.+?)\son\s(\d+-\d+-\d+\s\d+:\d+:\d+)/;
const SPREADSHEET_URL = 'URL';
const SHEET_NAME = 'Transactions'; //Update if your sheetname is different
const LABEL_NAME = 'axis_processed';
const DATE_FORMAT = 'es-CL';

function getRelevantMessages() {
  const threads = GmailApp.search(QUERY, 0, 300);
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

    if (!matches || matches?.length < 5) {
      return;
    }

    const { 1: card, 3: amount, 4: merchant, 5: date, 2: currency } = matches;

    var formattedDate = Moment.moment(date, "DD-MM-YY hh:mm:ss").format('DD-MM-YYYY hh:mm:ss');

    records.push({
      card,
      amount,
      date: formattedDate,
      merchant,
      currency
    });
  });

  return records;
};

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
  for (let r = 0; r < records.length; r++) {
    sheet.appendRow([
      records[r].date,
      records[r].card,
      records[r].merchant,
      records[r].amount,
      records[r].currency,
    ]);
  }
}

function processTransactionEmails() {
  const messages = getRelevantMessages();
  const records = parseMessageData(messages);
  console.log('records', records.length, records);
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
