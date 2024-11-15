const QUERY = "newer_than:1d AND in:all AND from:idfcfirstbank.com AND subject:Debit Alert: Your IDFC FIRST Bank Credit Card AND -label:idfc_processed"
const REGEX = /([A-Z]{3}) ([0-9]*\.[0-9]+)\s+([a-zA-Z]+\s+)+(XX[0-9]+)\.?\s+at ([A-Za-z0-9 .@&$-_]+)\s+on ([0-9A-Z-]+)\s*(at\s*[0-9A-Z-:\s]*)?/;
const SPREADSHEET_URL = 'SHEET-LINK';
const SHEET_NAME = 'Transactions'; //Update if your sheetname is different
const LABEL_NAME = 'idfc_processed';

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

    const { 2: amount, 6: date, 7: time, 4: card, 5: merchant, 1: currency } = matches;
    // Get the email delivery time as a fallback
    const deliveryTime = message.getDate();
    const deliveryTimeFormatted = Moment.moment(deliveryTime).format('DD-MM-YYYY hh:mm:ss');

    // Format the date and time
    const formattedDate = time
      ? Moment.moment(`${date} ${time.trim()}`, 'DD-MMM-YYYY hh:mm A').format('DD-MM-YYYY hh:mm:ss')
      : deliveryTimeFormatted;
    
    records.push({
      card,
      amount,
      date: formattedDate,
      merchant,
      currency,
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
