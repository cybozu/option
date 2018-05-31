/** *************************************************************************
 *kintone-0365-schedule_common.js
 *
***************************************************************************/

window.kintoneAzureConnect = {

    azure: {
        clientId: 'cd8eaf08-e4eb-4ffd-99bb-8533132cb036',
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
