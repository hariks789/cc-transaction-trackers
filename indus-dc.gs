function getRelevantMessages()
{
  var threads = GmailApp.search('newer_than:2d AND in:all AND from:indusind.com AND subject:"Important : Transaction Alert from IndusInd Bank" AND -label:indus_dc_processed',0,100);
  console.log('Emails', threads.length)
  var arrToConvert=[];
  for(var i = threads.length - 1; i >=0; i--) {
    arrToConvert.push(threads[i].getMessages());   
  }
  var messages = [];
  for(var i = 0; i < arrToConvert.length; i++) {
    messages = messages.concat(arrToConvert[i]);
  }
  console.log('messages', messages.length)
  return messages;
}

function parseMessageData(messages)
{
  var records=[];
  if(!messages)
  {
    //messages is undefined or null or just empty
    return records;
  }
  for(var m=0;m<messages.length;m++)
  {
    var text = messages[m].getPlainBody();
    

    var textWithoutBreaksAndSpaces = text.replace(/(\r\n|\n|\r|\*)/gm, "").replace(/\s\s+/g, ' ').replace("is INR", "is RS");


    var matches = textWithoutBreaksAndSpaces.match(/ending\s([0-9]+)\sis[a-zA-Z .]+Merchant\sName\s:*([a-zA-Z_0-9 ]+)\sAmount[a-zA-Z0-9 .(),&@:_-]+\sINR\s([0-9,]*\.*[0-9]*)\sDate[\s:]*([0-9-]+)\sTime[\s:]*([0-9:-]*)/);
    if(!matches){
      console.log('Org Text', text);
      console.log('Match failed', matches, textWithoutBreaksAndSpaces);
    }
    
    if(!matches || matches.length < 2)
    {
      //No matches; couldn't parse continue with the next message
      continue;
    }

    var rec = {};
    rec.amount = matches[3];
    rec.card = matches[1];
    rec.date= matches[4] +' '+ matches[5];
    rec.merchant = matches[2];
    
    records.push(rec);
  }
  return records;
}

function getMessagesDisplay()
{
  var templ = HtmlService.createTemplateFromFile('messages');
  templ.messages = getRelevantMessages();
  return templ.evaluate();  
}

function getParsedDataDisplay()
{
  var templ = HtmlService.createTemplateFromFile('parsed');
  templ.records = parseMessageData(getRelevantMessages());
  return templ.evaluate();
}

function saveDataToSheet(records)
{
//REPLACE WITH YOUR GOOGLE SHEET URL
try {
  var spreadsheet = SpreadsheetApp.openByUrl(<sheet-url>);
  var sheet = spreadsheet.getSheetByName("Transactions");
  for(var r=0;r<records.length;r++)
  {
    sheet.appendRow([records[r].date,records[r].card, records[r].merchant, records[r].amount] );
  }
} catch(e) {
  console.log(e)
}

  
}

function processTransactionEmails()
{
  var messages = getRelevantMessages();
  var records = parseMessageData(messages);
  console.log("records", records.length, records)
  saveDataToSheet(records);
  labelMessagesAsDone(messages);
  return true;
}

function labelMessagesAsDone(messages)
{
  var label = 'indus_dc_processed';
  var label_obj = GmailApp.getUserLabelByName(label);
  if(!label_obj)
  {
    label_obj = GmailApp.createLabel(label);
  }
  
  for(var m =0; m < messages.length; m++ )
  {
     label_obj.addToThread(messages[m].getThread() );  
  }
  
}

function doGet()
{
  return getParsedDataDisplay();

  //return getMessagesDisplay();
}
