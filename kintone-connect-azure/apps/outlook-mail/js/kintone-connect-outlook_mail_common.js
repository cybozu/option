/** *************************************************************************
 *grkin_schedule_common.js
 *
***************************************************************************/

window.kintoneAzureConnect = {

    azure: {
        clientId: 'c8438913-9647-48b0-8bd9-9b4d03bf168e',
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
