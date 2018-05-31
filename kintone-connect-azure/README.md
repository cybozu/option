# Authentication with kintone from Azure AD

Use Microsoft's authentication library (msal.js) to enable access to Microsoft Cloud service resources from kintone.

## Description
With Microsoft's authentication library, you can obtain the access token from the Azure Active Directory v2 endpoint,
From kintone you can access the data in the Microsoft cloud using the Microsoft Graph API.
<br>ex) Send and receive Outlook mail from kintone and data linkage between kintone and Outlook schedule.

## Usage
1. Create kintone application

2. Register the application to Azure AD from the following site.  
   https://apps.dev.microsoft.com/#/appList

>* Register the application name with an arbitrary name.
>* Copy the automatically assigned application ID for later use.
>* Add "Web" by adding platform. Please specify the target application of kintone as the redirect destination.

3. Download msal.min.js.  
   https://github.com/AzureAD/microsoft-authentication-library-for-js/releases/tag/v0.1.2/

4. Download kintoneUtility.min.js and kintoneUtility.min.css (Future) from releases. Or copy the following URL. https://kintone.github.io/kintoneUtility/kintoneUtility.min.js

5. Set common file according to kintone environment

***In case of cooperation with Outlook Mail***

```javascript
window.kintoneAzureConnect = {

    azure: {
        clientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        graphApiScorp: ['https://graph.microsoft.com/mail.read'],
        access: ['mail.read', 'mail.send'],
        mailGetUrl: 'https://graph.microsoft.com/v1.0/me/MailFolders/Inbox/messages?$top=100',
        mailSendUrl: 'https://graph.microsoft.com/v1.0/me/sendmail'
    },

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
    }
};
```

***In case of cooperation with Outlook Schedule***

```javascript
window.kintoneAzureConnect = {

    azure: {
        clientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        graphApiScorp: ['https://graph.microsoft.com/calendars.readwrite'],
        access: ['calendars.readwrite'],
        eventUrl: 'https://graph.microsoft.com/v1.0/me/events'
    },

    kintone: {

        fieldCode: {

            // Field code of subject
            subject: 'To_Do',

            // Field code of body
            body: 'Details',

            // Field code of start
            startDate: 'From',

            // Field code of end
            endDate: 'To',

            // Field code of eventId
            eventId: 'EventId',

            // Field code of attachFile
            attachFile: 'Attachments'
        }
    }
};
```


6. Upload JavaScript for PC

***In case of cooperation with Outlook Mail***
* [msal.min.js](https://github.com/AzureAD/microsoft-authentication-library-for-js/releases/tag/v0.1.2/)
* [jquery.min.js](https://js.cybozu.com/jquery/3.2.1/jquery.min.js)
* [sweetalert2.min.js](https://js.cybozu.com/sweetalert2/v6.10.1/sweetalert2.min.js)
* [kintoneUtility.min.js](https://kintone.github.io/kintoneUtility/kintoneUtility.min.js)
* [common-js-functions.min.js](lib/common-js-functions.min.js)
* [kintone-connect-outlook_mail_common.js](apps/outlook-mail/js/kintone-connect-outlook_mail_common.js)
* [oauth.js](common/outlook-auth/js/oauth.js)
* [kintone-connect-outlook_mail.js](apps/outlook-mail/js/kintone-connect-outlook_mail.js)

***In case of cooperation with Outlook Schedule***
* [msal.min.js](https://github.com/AzureAD/microsoft-authentication-library-for-js/releases/tag/v0.1.2/)
* [jquery.min.js](https://js.cybozu.com/jquery/3.2.1/jquery.min.js)
* [sweetalert2.min.js](https://js.cybozu.com/sweetalert2/v6.10.1/sweetalert2.min.js)
* [kintoneUtility.min.js](https://kintone.github.io/kintoneUtility/kintoneUtility.min.js)
* [common-js-functions.min.js](lib/common-js-functions.min.js)
* [kintone-connect-outlook-schedule-common.js](apps/outlook-schedule/js/kintone-connect-outlook-schedule-common.js)
* [oauth.js](common/outlook-auth/js/oauth.js)
* [kintone-connect-outlook-schedule.js](apps/outlook-schedule/js/kintone-connect-outlook-schedule.js)


7. Upload CSS File for PC

***In case of cooperation with Outlook Mail***
* [sweetalert2.min.css](https://js.cybozu.com/sweetalert2/v6.10.1/sweetalert2.min.css)
* [kintone-connect-outlook_mail.css](kintone-connect-outlook_mail.css)

***In case of cooperation with Outlook Schedule***
* [sweetalert2.min.css](https://js.cybozu.com/sweetalert2/v6.10.1/sweetalert2.min.css)
* [kintone-connect-outlook_mail.css](kintone-connect-outlook-schedule.css)

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
