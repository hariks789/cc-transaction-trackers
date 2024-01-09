const QUERY = "newer_than:1d AND in:all AND from:mail.hsbc.co.in AND subject:You have used your HSBC Credit Card ending with AND -label:hsbc_processed"
const REGEX = /ending\swith\s([0-9]{4}),.*for\s([A-Za-z]{3})\s([0-9,]*\.[0-9]+).*payment to\s([A-Za-z 0-9]+)\son\s([a-zA-Z0-9 ]+)\sat\s(\d\d:\d\d)/;
const SPREADSHEET_URL = 'YOUR SHEET-LINK';
const SHEET_NAME = 'Transactions'; //Update if your sheetname is different
const LABEL_NAME = 'hsbc_processed';

function getRelevantMessages() {
  const threads = GmailApp.search(QUERY, 0, 100);
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

    const { 3: amount, 5: date, 6: time, 1: card, 4: merchant, 2: currency } = matches;

    records.push({
      card,
      amount,
      date: `${date} ${time}`,
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
