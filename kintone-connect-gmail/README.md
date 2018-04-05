# kintone connect Gmail

> Recieve and send email with Gmail on kintone app

## App Customization

> On the _JavaScript and CSS Customization_, add the files following the setting below

- **Upload JavaScript for PC**
  - [google-api.min.js](https://apis.google.com/js/api.js)
  - [common-js-functions.min.js](./common/common-js-functions.min.js)
  - [kintone-connect-gmail.js](./js/kintone-connect-gmail.js)

- **Upload CSS File for PC**
  - [kintone-connect-gmail.css](./css/kintone-connect-gmail.css)

**Setting**:
> Open `kintone-connect-gmail.js`, config the extensions prohibited and the fieldcode of the kintone app

```javascript
app: {
    appClientID: "{App client ID}", // the Google app client ID
    fieldsCode: {
        attachment: "attachment",    // ATTACHMENT field
        bcc: "bcc",                  // SINGLE_LINE_TEXT field
        cc: "cc",                    // SINGLE_LINE_TEXT field
        content: "message",          // RICH_TEXT field
        dateTime: "Date_and_time",   // DATE_AND_TIME field
        from: "from",                // SINGLE_LINE_TEXT field
        labels: "labels_id",         // SINGLE_LINE_TEXT field
        mailAccount: "email_account",// SINGLE_LINE_TEXT field
        messageID: "message_id",     // SINGLE_LINE_TEXT field
        owner: "owner",              // USER_SELECTION field
        subject: "subject",          // SINGLE_LINE_TEXT field
        threadID: "thread_id",       // SINGLE_LINE_TEXT field
        to: "to"                     // SINGLE_LINE_TEXT field
    },
    extensionProhibited: [/*your extensions (seperated with comma)*/] // Example: ['exe', 'csv']
}
```

## Reference

- [Get OAuth client ID](https://developers.google.com/api-client-library/javascript/start/start-js#setup)

## License

MIT License

## Copyright

Copyright(c) Cybozu, Inc.
