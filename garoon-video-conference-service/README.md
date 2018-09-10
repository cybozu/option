# Garoon video conference service

> Use google video conference on garoon schedule

## App Customization

> On the _JavaScript and CSS Customization_, add the files following the setting below

- **Upload JavaScript for PC**
  - [google-api.min.js](https://apis.google.com/js/api.js)
  - [garoon-connect-video-conference-service.js](./js/garoon-connect-video-conference-service.js)

- **Upload CSS File for PC**
  - [grn_kit.css](https://github.com/garoon/css-for-customize/blob/master/css/grn_kit.css)

**Setting**:
> Open `garoon-connect-video-conference-service.js`, config the google calendar app client id and google accounts(mail addresses).
> If everyone is allowed to register google calendar,set nothing in accounts.

```javascript
google: {
      clientId: '',    // the Google app client ID
      accounts: []     // the Google accounts to register google calendar
}

```

## Reference

- [Get OAuth client ID](https://developers.google.com/api-client-library/javascript/start/start-js#setup)

## License

MIT License

## Copyright

Copyright(c) Cybozu, Inc.
