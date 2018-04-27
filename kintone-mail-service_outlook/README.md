# Authentication with kintone from Azure AD

Use Microsoft's authentication library (msal.js) to enable access to Microsoft Cloud service resources from kintone.

## Version
1.0.0

## Description
With Microsoft's authentication library, you can obtain the access token from the Azure Active Directory v2 endpoint,
From kintone you can access the data in the Microsoft cloud using the Microsoft Graph API.
 ex) Get outlook mail or Send outlook mail from kintone

## Usage
1. Register the application to Azure AD from the following site.
   https://apps.dev.microsoft.com/#/appList

>* Register the application name with an arbitrary name.
>* We will copy the automatically assigned application ID for later use.
>* Add "Web" by adding platform. Please specify the target application of kintone as the redirect destination.

2. Download msal.js.
   https://github.com/AzureAD/microsoft-authentication-library-for-js

3. Download kintoneUtility.min.js and kintoneUtility.min.css (Future) from releases. Or copy the following URL. https://kintone.github.io/kintoneUtility/kintoneUtility.min.js

4. Create kintone application

5. Open `kintone-o365-connect_common.js` and config Fieldcode of the kintone app

```javascript
window.kintoneO365Connect = {

    kintone: {

        fieldCode: {

            // Field code of subject
            subject: 'subject',

            // Field code of content
            content: 'contents',

            // Field code of from
            from: 'from',

            // Field code of to
            to: 'TO',

            // Field code of cc
            cc: 'CC',

            // Field code of bcc
            bcc: 'BCC',

            // Field code of messageId
            messageId: 'messageId',

            // Field code of mailAccount
            mailAccount: 'mailAccount',

            // Field code of attachFile
            attachFile: 'attachFile'
        }

    },

    outlook: {
        // ClientId
        clientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    }
};
```

6. Upload JavaScript for PC
* [msal.js](https://github.com/AzureAD/microsoft-authentication-library-for-js)
* [jquery.min.js](https://js.cybozu.com/jquery/3.2.1/jquery.min.js)
* [sweetalert2.min.js](https://js.cybozu.com/sweetalert2/v6.10.1/sweetalert2.min.js)
* [kintoneUtility.min.js](https://kintone.github.io/kintoneUtility/kintoneUtility.min.js)
* [common-js-functions.min.js](lib/common-js-functions.min.js)
* [kintone-o365-connect_common.js](kintone-o365-connect_common.js)
* [kintone-o365-connect.js](kintone-o365-connect.js)

7. Upload CSS File for PC
* [sweetalert2.min.css](https://js.cybozu.com/sweetalert2/v6.10.1/sweetalert2.min.css)
* [kintone-o365-connect.css](kintone-o365-connect.css)

## Authentication flow
![overview image](img/AuthenticationFlow.png?raw=true)

## Remarks
If the following error occurs, please follow the following procedure.
"You need permission to access resources within your organization"

With an account with overall administrator privileges
grant access rights to users from the following MS portal sites
https://portal.azure.com/

>1. Select "Azure Active Directory"
>2. Select "Users and Groups"
>3. Select "User setting"
>4. In the "Enterprise application" item, select "Yes" for "Users can access corporate data on behalf of the app itself."

## License
MIT

## Copyright
Copyright(c) Cybozu, Inc.
