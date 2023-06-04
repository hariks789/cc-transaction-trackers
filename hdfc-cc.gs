// This function retrieves the relevant email threads using Gmail search and returns their messages as an array
function getRelevantMessages() {
  const threads = GmailApp.search("newer_than:2d AND in:all AND from:hdfcbank.net AND subject:Alert : Update on your HDFC Bank Credit Card AND -label:hdfc_processed", 0, 100);
  
  console.log('Emails', threads.length); // logs the number of email threads retrieved
  
  const messages = threads.reduceRight((acc, thread) => { // combines the messages from all threads into a single array
    acc.push(...thread.getMessages());
    return acc;
  }, []);
  
  console.log('messages', messages.length); // logs the total number of messages retrieved
  
  return messages; // returns the array of messages
}

// This function parses the required data from each message and returns it as an array of objects
function parseMessageData(messages) {
  const records = [];
  
  if (!messages || !Array.isArray(messages)) {
    // checks if messages is undefined, null or not an array, and returns an empty array in that case
    return records;
  }
  
  messages.forEach((message) => { // iterates through each message to extract the required data
    const text = message.getPlainBody().replace(/(\r\n|\n|\r)/gm, ""); // gets the plain text version of the message body and removes line breaks
    const matches = text.match(/([0-9]+) for Rs[.]* ([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*)) at ([a-zA-Z0-9 $!@#$&-_.]+) on (\d{1,2}-\d{1,2}-\d{4} \d{1,2}:\d{2}:\d{2})/); // uses a regular expression to match the required data in the text
    
    if (!matches || matches.length < 5) {
      console.log('Match failed', matches, text); // logs the failed matches for debugging purposes
      return; // continues with the next message if there is no match or incomplete match
    }

    const rec = {
      amount: matches[2], // extracts the amount from the second match group
      card: matches[1], // extracts the card number from the first match group
      date: matches[4], // extracts the date from the fourth match group
      merchant: matches[3].trim(), // extracts the merchant name from the third match group and removes leading/trailing spaces
    };
    
    records.push(rec); // adds the extracted data as an object to the records array
  });

  return records; // returns the array of objects
}

// This function creates an HTML template and passes the relevant messages to it for displaying to the user
function getMessagesDisplay() {
  let templ = HtmlService.createTemplateFromFile('messages');
  templ.messages = getRelevantMessages(); // gets the relevant messages using the above function
  return templ.evaluate();  
}

// This function creates an HTML template and passes the parsed data to it for displaying to the user
function getParsedDataDisplay() {
  let templ = HtmlService.createTemplateFromFile('parsed');
  templ.records = parseMessageData(getRelevantMessages()); // gets the relevant messages and parses the data using the above functions
  return templ.evaluate();
}

// This function saves the parsed data to a Google Sheets spreadsheet
const saveDataToSheet = (records) => {
  const spreadsheet = SpreadsheetApp.openByUrl(<URL>);
  const sheet = spreadsheet.getSheetByName(`Transactions`);
  records.forEach(record => {
    sheet.appendRow([record.date, record.card, record.merchant, record.amount]); // appends a row to the "Transactions" sheet with the required data
  });
}

// This function retrieves the relevant messages and parses the data, then saves it to Google Sheets and labels the messages as done (commented out for now)
function processTransactionEmails() {
  let messages = getRelevantMessages();
  let records = parseMessageData(messages);
  console.log("records", records.length, records); // logs the number of records and the parsed data for debugging purposes
  saveDataToSheet(records); // saves the parsed data to Google Sheets (commented out for now)
  labelMessagesAsDone(messages); // labels the relevant messages as processed (commented out for now)
  return true; // returns true to indicate that the function has completed successfully
}

// This function labels the given messages as processed by adding a custom label to their threads
function labelMessagesAsDone(messages) {
  const labelName = 'hdfc_processed';
  let label = GmailApp.getUserLabelByName(labelName);
  
  if (!label) { // creates the custom label if it doesn't already exist
    label = GmailApp.createLabel(labelName);
  }
  
  for (let i = 0; i < messages.length; i++) { // iterates through each message and adds the custom label to its thread
     label.addToThread(messages[i].getThread());  
  }
}

// This function is called by the web app and returns the HTML template for displaying the parsed data to the user
function doGet() {
  return getParsedDataDisplay();
}
