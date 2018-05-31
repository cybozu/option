/* global kintone */
/* global kintoneUtility */

jQuery.noConflict();
(function($) {
    'use strict';

    // common-js-functions.js
    var KC = window.kintoneCustomize;

    // azure_oauth.js
    var AO = window.azureOauth;

    // kintone-0365-shcedule_common.js
    var CM = window.kintoneAzureConnect;

    // Get value from kintone-o365-schedule_common.js
    var SUBJECT_FIELD_CODE = CM.kintone.fieldCode.subject;
    var BODY_FIELD_CODE = CM.kintone.fieldCode.body;
    var START_DATE_FIELD_CODE = CM.kintone.fieldCode.startDate;
    var END_DATE_FIELD_CODE = CM.kintone.fieldCode.endDate;
    var ATTACH_FILE_FIELD_CODE = CM.kintone.fieldCode.attachFile;
    var EVENT_ID_FIELD_CODE = CM.kintone.fieldCode.eventId;
    var EVENT_URL = CM.azure.eventUrl;

    var storage = window.localStorage;

    // Constant
    var SESSION_KEY_TO_ACCESS_TOKEN = 'ACCESS_TOKEN';
    var SIGN_USER_DISPINFO = 'SIGN_USER_DISPINFO';

    var kintoneScheduleService = {
        lang: {
            en: {
                button: {
                    signIn: 'Sign in Outlook',
                    signOut: 'Sign out of Outlook',
                    addEvent: 'Add Event',
                    registerExec: 'Add',
                    updateExec: 'Update',
                    deleteExec: 'Delete',
                    cancelExec: 'Cancel'
                },
                message: {
                    info: {
                        confirmRegister: 'Do you want to add this event to Outlook?',
                        confirmUpdate: 'Do you want to update this event in Outlook?',
                        confirmDelete: 'Do you want to delete this event from Outlook?'
                    },
                    warning: {
                        noEvent: 'The target event does not exist in Outlook.'
                    },
                    success: {
                        registerExec: 'Your event has been added successfully.',
                        updateExec: 'Your event has been updated successfully.',
                        deleteExec: 'Your event has been deleted successfully.'
                    },
                    error: {
                        registerFailure: 'Failed to add your event.',
                        updateFailure: 'Failed to update your event.',
                        deleteFailure: 'Failed to delete your event.',
                        signInFailure: 'Failed to sign in Outlook.',
                        getAccessTokenFailure: 'Failed to get access token.',
                        fromtoDatetimeNodata: 'Start date/time or end date/time has not been entered.',
                        fromDatetimeFuture: 'Start date/time is not earlier than end date/time.',
                        addAttachFileFailure: 'Failed to add attachments.',
                        updateAttachFileFailure: 'Failed to update attachments.'
                    }
                }
            },
            ja: {
                button: {
                    signIn: 'Outlookにログイン',
                    signOut: 'Outlookからログアウト',
                    addEvent: '予定を登録',
                    registerExec: '登録',
                    updateExec: '更新',
                    deleteExec: '削除',
                    cancelExec: 'キャンセル'
                },
                message: {
                    info: {
                        confirmRegister: 'Outlookに登録しますか?',
                        confirmUpdate: 'Outlookを更新しますか?',
                        confirmDelete: 'Outlookから削除しますか?'
                    },
                    warning: {
                        noEvent: '対象の予定がOutlookに存在しません'
                    },
                    success: {
                        registerExec: 'Outlookに登録しました',
                        updateExec: 'Outlookを更新しました',
                        deleteExec: 'Outlookから削除しました'
                    },
                    error: {
                        registerFailure: 'Outlookの登録に失敗しました',
                        updateFailure: 'Outlookの更新に失敗しました',
                        deleteFailure: 'Outlookの削除に失敗しました ',
                        signInFailure: 'サインインできませんでした',
                        getAccessTokenFailure: 'アクセストークンが取得できませんでした',
                        fromtoDatetimeNodata: '開始日時または終了日時が未入力です',
                        fromDatetimeFuture: '開始日時が未来日時になっています',
                        addAttachFileFailure: '添付ファイルの登録に失敗しました',
                        updateAttachFileFailure: '添付ファイルの更新に失敗しました'
                    }
                }
            }
        },

        setting: {
            lang: 'ja',
            i18n: {},
            gAPI: {},
            ui: {
                buttons: {
                    signInOutlook: {
                        id: 'kintoneCustomizeBtnSignInOutlook',
                        text: 'signIn'
                    },
                    signOut: {
                        id: 'kintoneCustomizeBtnSignOut',
                        text: 'signOut'
                    },
                    sendEvent: {
                        id: 'kintoneCustomizeBtnSendSchedule',
                        text: 'addEvent'
                    }
                },
                label: {
                    userInfo: {

                    }
                }
            }
        },

        data: {
            ui: {},
            isLoginOutlook: false
        },

        init: function() {
            this.setting.lang = kintone.getLoginUser().language || 'ja';
            this.setting.i18n = this.setting.lang in this.lang ? this.lang[this.setting.lang] : this.lang.en;
        },

        uiCreate: function(kintoneHeaderSpace) {
            if (typeof kintoneHeaderSpace === 'undefined') {
                return;
            }
            var kintoneCustomizeOutlookHeader = document.createElement('div');

            this.data.ui.kintoneCustomizeOutlookHeaderSigned = document.createElement('div');
            this.data.ui.kintoneCustomizeOutlookHeaderNotSigned = document.createElement('div');
            this.data.ui.kintoneCustomizeOutlookUserInfo = document.createElement('div');

            this.data.ui.btnSignIn = this.createButton(this.setting.ui.buttons.signInOutlook, this.setting.i18n.button);
            this.data.ui.btnSignOut = this.createButton(this.setting.ui.buttons.signOut, this.setting.i18n.button);
            this.data.ui.kintoneCustomizeOutlookUserInfo = document.createElement('div');

            this.data.ui.kintoneCustomizeOutlookHeaderSigned.style.display = 'none';

            kintoneHeaderSpace.innerHTML = '';

            kintoneCustomizeOutlookHeader.className = 'kintoneCustomizeOutlookUIHeader';
            this.data.ui.kintoneCustomizeOutlookUserInfo.className = 'kintoneCustomizeOutlookUIUserInfo';
            KC.ui.element(this.data.ui.kintoneCustomizeOutlookHeaderNotSigned)
                .append(this.data.ui.btnSignIn)
                .appendTo(kintoneCustomizeOutlookHeader)
                .appendTo(kintoneHeaderSpace);
            KC.ui.element(this.data.ui.kintoneCustomizeOutlookHeaderSigned)
                .append([
                    this.data.ui.kintoneCustomizeOutlookUserInfo,
                    this.data.ui.btnSignOut
                ])
                .appendTo(kintoneCustomizeOutlookHeader)
                .appendTo(kintoneHeaderSpace);
        },

        uicreateForDetail: function() {
            if (!this.isExpireAccessToken()) {
                return;
            }
            var kintoneDetailHeaderSpace = kintone.app.record.getHeaderMenuSpaceElement();
            kintoneDetailHeaderSpace.appendChild(KC.ui.createButton(
                this.setting.ui.buttons.sendEvent, this.setting.i18n.button));
        },

        getKintoneAttach: function(attaches) {
            var outlookAttachements = [];
            for (var i = 0; i < attaches.length; i++) {
                var outlookAttachement = this.kintoneFileToOutlookAttachment(attaches[i]).catch(function(error) {
                });
                outlookAttachements.push(outlookAttachement);
            }
            return kintone.Promise.all(outlookAttachements);
        },

        kintoneFileToOutlookAttachment: function(kintoneFileObj) {
            var self = this,
                url = '/k/v1/file.json?fileKey=' + kintoneFileObj.fileKey;
            return new kintone.Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                xhr.responseType = 'arraybuffer';
                xhr.onload = function() {
                    var outlookAttachment = {
                        '@odata.type': '#microsoft.graph.fileAttachment',
                        'name': kintoneFileObj.name,
                        'contentBytes': kintoneScheduleService.convertArrayBufferToBase64(this.response)
                    };
                    resolve(outlookAttachment);
                };
                xhr.onerror = function(e) {
                    reject(e);
                };
                xhr.send();
            }).then({}, function(error) {
                self.showError(error);
                return false;
            });
        },

        convertArrayBufferToBase64: function(arraybuffer) {
            var binary = '',
                bytes = new Uint8Array(arraybuffer),
                len = bytes.byteLength;
            for (var i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return window.btoa(binary);
        },

        removeStyleTagOnString: function(text) {
            return text.replace(/<style.*style>|<style.*[[\s\S\t]*?.*style>/mg, '');
        },

        setEventIdToKintone: function(recId, eventId) {
            var putParam = {};

            putParam[EVENT_ID_FIELD_CODE] = {
                value: eventId
            };

            var param = {
                app: kintone.app.getId(),
                id: recId,
                record: putParam,
                isGuest: false
            };

            return kintoneUtility.rest.putRecord(param).then(function(resp) {
            });
        },

        checkDateTime: function(record) {
            return new kintone.Promise(function(resolve, reject) {
                var fromDateStr = record[START_DATE_FIELD_CODE]['value'];
                var toDateStr = record[END_DATE_FIELD_CODE]['value'];
                var fromDate = new Date(fromDateStr);
                var toDate = new Date(toDateStr);
                if (fromDate === '' && toDate === '') {
                    swal({
                        title: 'Error!',
                        type: 'error',
                        text: kintoneScheduleService.setting.i18n.message.error.fromtoDatetimeNodata,
                        allowOutsideClick: false
                    });
                    reject();
                } else if (fromDateStr === '' || toDateStr === '') {
                    swal({
                        title: 'Error!',
                        type: 'error',
                        text: kintoneScheduleService.setting.i18n.message.error.fromtoDatetimeNodata,
                        allowOutsideClick: false
                    });
                    reject();
                } else if (fromDate.getTime() > toDate.getTime()) {
                    swal({
                        title: 'Error!',
                        type: 'error',
                        text: kintoneScheduleService.setting.i18n.message.error.fromDatetimeFuture,
                        allowOutsideClick: false
                    });
                    reject();
                } else if (fromDate.getTime() === toDate.getTime()) {
                    resolve(true);
                }
                resolve(false);
            });
        },

        convertDateForAllDay: function(targetDate) {
            var date = new Date(targetDate);
            var localeDate = date.getFullYear() + '-' +
                ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
            return localeDate;
        },

        createButton: function(setting, lang) {
            if (typeof setting === 'undefined' || !setting) {
                return null;
            }
            var button = document.createElement('button');
            button.id = setting.id || '';
            button.className = setting.class || '';
            var text = lang ? lang[setting.text] || setting.text || '' : setting.text || '';
            button.innerHTML = text;
            button.style.cssText = setting.style || '';
            return button;
        },

        isExpireAccessToken: function() {
            if (storage.getItem(SESSION_KEY_TO_ACCESS_TOKEN)) {
                return true;
            }
            return false;
        },

        isSignUserDispInfo: function() {
            if (storage.getItem(SIGN_USER_DISPINFO)) {
                return true;
            }
            return false;
        }
    };


    /**
     * Javascript API for outlook schedule
     */
    var outlookAPI = {

        init: function() {

            AO.init();
            if (!kintoneScheduleService.isExpireAccessToken() || !kintoneScheduleService.isSignUserDispInfo()) {
                kintoneScheduleService.data.ui.kintoneCustomizeOutlookHeaderNotSigned.style.display = 'inline-block';
                kintoneScheduleService.data.ui.kintoneCustomizeOutlookHeaderSigned.style.display = 'none';
            } else {
                kintoneScheduleService.data.ui.kintoneCustomizeOutlookHeaderNotSigned.style.display = 'none';
                kintoneScheduleService.data.ui.kintoneCustomizeOutlookHeaderSigned.style.display = 'inline-block';
                kintoneScheduleService.data.ui.kintoneCustomizeOutlookUserInfo.innerHTML =
                  storage.getItem(SIGN_USER_DISPINFO);
                kintoneScheduleService.data.isLoginOutlook = true;
            }
        },

        signIn: function() {
            KC.ui.loading.show();

            var self = this;
            AO.signIn().then(function(id_token) {
                self.callGraphApi();
                KC.ui.loading.hide();
            }, function(error) {
                swal({
                    title: 'Error!',
                    type: 'error',
                    text: kintoneScheduleService.setting.i18n.message.error.signInFailure,
                    allowOutsideClick: false
                });
                KC.ui.loading.hide();
            });
        },

        signOut: function() {
            KC.ui.loading.show();
            storage.clear();
            AO.signOut();
            KC.ui.loading.hide();
        },

        // In order to call the Graph API, an access token needs to be acquired.
        callGraphApi: function() {
            var self = this;

            AO.callGraphApi().then(function(token) {
                var userInfo = AO.getUserInfo();

                kintoneScheduleService.data.ui.kintoneCustomizeOutlookHeaderNotSigned.style.display = 'none';
                kintoneScheduleService.data.ui.kintoneCustomizeOutlookHeaderSigned.style.display = 'inline-block';
                kintoneScheduleService.data.ui.kintoneCustomizeOutlookUserInfo.innerHTML = userInfo.displayableId;
                kintoneScheduleService.data.isLoginOutlook = true;

                storage.setItem(SESSION_KEY_TO_ACCESS_TOKEN, token);
                storage.setItem(SIGN_USER_DISPINFO, userInfo.displayableId);

                KC.ui.loading.hide();
            }, function(error) {
                if (error) {
                    swal({
                        title: 'Error!',
                        type: 'error',
                        text: kintoneScheduleService.setting.i18n.message.error.getAccessTokenFailure,
                        allowOutsideClick: false
                    });
                    self.userAgentApplication = null;
                    KC.ui.loading.hide();
                    return;
                }
            }).then(function() {
                KC.ui.loading.hide();
            }).catch(function() {
                KC.ui.loading.hide();
            });
        },

        setDataForRegistration: function(kintoneData, isAllDay) {
            KC.ui.loading.show();
            var accessToken;
            if (kintoneScheduleService.isExpireAccessToken()) {
                accessToken = storage.getItem(SESSION_KEY_TO_ACCESS_TOKEN);
            } else {
                return;
            }

            var sendParam = {};
            var recId = kintoneData.$id.value;

            sendParam.subject = kintoneData[SUBJECT_FIELD_CODE].value;

            var startDate;
            var endDate;
            if (isAllDay) {
                startDate = kintoneScheduleService.convertDateForAllDay(
                    kintoneData[START_DATE_FIELD_CODE].value) + 'T00:00:00.000Z';
                endDate = kintoneScheduleService.convertDateForAllDay(
                    kintoneData[END_DATE_FIELD_CODE].value) + 'T24:00:00.000Z';
            } else {
                startDate = kintoneData[START_DATE_FIELD_CODE].value;
                endDate = kintoneData[END_DATE_FIELD_CODE].value;
            }

            sendParam.body = {
                'contentType': 'text',
                'content': kintoneData[BODY_FIELD_CODE].value
            };
            sendParam.start = {
                'dateTime': startDate,
                'timeZone': 'UTC'
            };

            sendParam.end = {
                'dateTime': endDate,
                'timeZone': 'UTC'
            };

            sendParam.isAllDay = isAllDay;

            return kintoneScheduleService.getKintoneAttach(
                kintoneData[ATTACH_FILE_FIELD_CODE].value).then(function(files) {
                if (files.length !== 0) {
                    sendParam.hasAttachments = true;
                }
                return outlookAPI.registerToOutlook(sendParam, recId, files, accessToken);
            });
        },

        registerToOutlook: function(sendParam, recId, files, accessToken) {

            var header = {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            };

            kintone.proxy(EVENT_URL, 'POST', header, sendParam).then(function(respdata) {
                var responeDataJson = window.JSON.parse(!respdata[0] ? '{}' : respdata[0]);
                if (typeof responeDataJson.error !== 'undefined') {
                    swal({
                        title: 'Error!',
                        type: 'error',
                        text: kintoneScheduleService.setting.i18n.message.error.registerFailure,
                        allowOutsideClick: false
                    });
                    KC.ui.loading.hide();
                } else {
                    if (sendParam.hasAttachments) {
                        return outlookAPI.registerToOutlookForAttachement(0, files, responeDataJson.id, accessToken
                        ).then(function() {
                            kintoneScheduleService.setEventIdToKintone(recId, responeDataJson.id);
                            swal({
                                title: 'SUCCESS!',
                                type: 'success',
                                text: kintoneScheduleService.setting.i18n.message.success.registerExec,
                                allowOutsideClick: false
                            });
                            KC.ui.loading.hide();
                        }).catch(function(error) {
                            swal({
                                title: 'Error!',
                                type: 'error',
                                text: kintoneScheduleService.setting.i18n.message.error.addAttachFileFailure,
                                allowOutsideClick: false
                            });
                            kintoneScheduleService.setEventIdToKintone(recId, responeDataJson.id);
                            KC.ui.loading.hide();
                        });
                    }
                    kintoneScheduleService.setEventIdToKintone(recId, responeDataJson.id);
                    swal({
                        title: 'SUCCESS!',
                        type: 'success',
                        text: kintoneScheduleService.setting.i18n.message.success.registerExec,
                        allowOutsideClick: false
                    });
                    KC.ui.loading.hide();
                }
            }).catch(function(error) {
                swal({
                    title: 'Error!',
                    type: 'error',
                    text: kintoneScheduleService.setting.i18n.message.error.registerFailure,
                    allowOutsideClick: false
                });
                KC.ui.loading.hide();
            });
        },

        registerToOutlookForAttachement: function(index, file, eventId, accessToken) {
            var self = this;
            var url = EVENT_URL + '/' + eventId + '/attachments';
            var header = {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            };

            return kintone.proxy(url, 'POST', header, file[index]).then(function(respdata) {
                var responeDataJson = window.JSON.parse(!respdata[0] ? '{}' : respdata[0]);
                if (typeof responeDataJson.error !== 'undefined') {
                    throw responeDataJson;
                } else {
                    if (index + 1 < file.length) {
                        return self.registerToOutlookForAttachement(index + 1, file, eventId, accessToken);
                    }
                    return;
                }
            });
        },

        getToOutlook: function(kintoneData) {
            KC.ui.loading.show();

            return new kintone.Promise(function(resolve, reject) {

                var eventId = kintoneData[EVENT_ID_FIELD_CODE].value;
                var accessToken;
                if (kintoneScheduleService.isExpireAccessToken()) {
                    accessToken = storage.getItem(SESSION_KEY_TO_ACCESS_TOKEN);
                } else {
                    reject();
                }

                var url = EVENT_URL + '/' + eventId;
                var header = {
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'application/json'
                };

                kintone.proxy(url, 'GET', header, {}).then(function(respdata) {
                    var respJson = window.JSON.parse(!respdata[0] ? '{}' : respdata[0]);
                    if (typeof respJson.error !== 'undefined') {
                        if (respJson.error.code === 'ErrorItemNotFound') {
                            return swal({
                                title: 'WARN!',
                                type: 'warning',
                                text: kintoneScheduleService.setting.i18n.message.warning.noEvent,
                                allowOutsideClick: false
                            }).then(function() {
                                resolve();
                            });
                        }
                        reject();
                    }
                    resolve(respJson);
                });
            });
        },

        setDataForUpdate: function(kintoneData, isAllDay) {
            KC.ui.loading.show();
            var accessToken;
            if (kintoneScheduleService.isExpireAccessToken()) {
                accessToken = storage.getItem(SESSION_KEY_TO_ACCESS_TOKEN);
            } else {
                return;
            }

            var sendParam = {};

            var startDate;
            var endDate;
            if (isAllDay) {
                startDate = kintoneScheduleService.convertDateForAllDay(
                    kintoneData[START_DATE_FIELD_CODE].value) + 'T00:00:00.000Z';
                endDate = kintoneScheduleService.convertDateForAllDay(
                    kintoneData[END_DATE_FIELD_CODE].value) + 'T24:00:00.000Z';
            } else {
                startDate = kintoneData[START_DATE_FIELD_CODE].value;
                endDate = kintoneData[END_DATE_FIELD_CODE].value;
            }

            var eventId = kintoneData[EVENT_ID_FIELD_CODE].value;

            sendParam.subject = kintoneData[SUBJECT_FIELD_CODE].value;

            sendParam.body = {
                'contentType': 'text',
                'content': kintoneData[BODY_FIELD_CODE].value
            };

            sendParam.start = {
                'dateTime': startDate,
                'timeZone': 'UTC'
            };

            sendParam.end = {
                'dateTime': endDate,
                'timeZone': 'UTC'
            };

            sendParam.isAllDay = isAllDay;

            return kintoneScheduleService.getKintoneAttach(kintoneData[ATTACH_FILE_FIELD_CODE].value
            ).then(function(files) {
                if (files.length !== 0) {
                    sendParam.hasAttachments = true;
                }
                return outlookAPI.updateToOutlook(accessToken, sendParam, eventId, files);
            });
        },

        updateToOutlook: function(accessToken, sendParam, eventId, files) {
            var url = EVENT_URL + '/' + eventId;
            var header = {
                'Authorization': 'Bearer ' + accessToken
            };

            $.ajax({
                type: 'PATCH',
                url: url,
                headers: header,
                contentType: 'application/json',
                data: JSON.stringify(sendParam),
                cache: false,
                dataType: 'json'
            }).done(function(resp) {
                if (typeof resp.error !== 'undefined') {
                    swal({
                        title: 'Error!',
                        type: 'error',
                        text: kintoneScheduleService.setting.i18n.message.error.updateFailure,
                        allowOutsideClick: false
                    });
                } else {
                    return outlookAPI.deleteToOutlookForAttachement(eventId, accessToken).then(function() {
                        if (sendParam.hasAttachments) {
                            return outlookAPI.registerToOutlookForAttachement(0, files, resp.id, accessToken
                            ).then(function() {
                                swal({
                                    title: 'SUCCESS!',
                                    type: 'success',
                                    text: kintoneScheduleService.setting.i18n.message.success.updateExec,
                                    allowOutsideClick: false
                                });
                                KC.ui.loading.hide();
                            });
                        }
                        swal({
                            title: 'SUCCESS!',
                            type: 'success',
                            text: kintoneScheduleService.setting.i18n.message.success.updateExec,
                            allowOutsideClick: false
                        });
                        KC.ui.loading.hide();
                    }).catch(function(error) {
                        swal({
                            title: 'Error!',
                            type: 'error',
                            text: kintoneScheduleService.setting.i18n.message.error.updateAttachFileFailure,
                            allowOutsideClick: false
                        });
                        KC.ui.loading.hide();
                    });
                }
            });
        },

        setDataForDelete: function(kintoneData) {
            KC.ui.loading.show();
            var accessToken;
            if (kintoneScheduleService.isExpireAccessToken()) {
                accessToken = storage.getItem(SESSION_KEY_TO_ACCESS_TOKEN);
            } else {
                return;
            }

            var eventId = kintoneData[EVENT_ID_FIELD_CODE].value;

            return outlookAPI.deleteToOutlook(eventId, accessToken);
        },

        deleteToOutlook: function(eventId, accessToken) {
            var url = EVENT_URL + '/' + eventId;
            var header = {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            };
            return kintone.proxy(url, 'DELETE', header, {}).then(function(respdata) {
                var responeDataJson = window.JSON.parse(!respdata[0] ? '{}' : respdata[0]);
                if (typeof responeDataJson.error !== 'undefined') {
                    swal({
                        title: 'Error!',
                        type: 'error',
                        text: kintoneScheduleService.setting.i18n.message.error.deleteFailure,
                        allowOutsideClick: false
                    });
                } else {
                    swal({
                        title: 'SUCCESS!',
                        type: 'success',
                        text: kintoneScheduleService.setting.i18n.message.success.deleteExec,
                        allowOutsideClick: false
                    });
                }
                KC.ui.loading.hide();
            }).catch(function(error) {
                swal({
                    title: 'Error!',
                    type: 'error',
                    text: kintoneScheduleService.setting.i18n.message.error.deleteFailure,
                    allowOutsideClick: false
                });
                KC.ui.loading.hide();
            });

        },

        deleteToOutlookForAttachement: function(eventId, accessToken) {
            var url = EVENT_URL + '/' + eventId + '/attachments/';
            var header = {
                'Authorization': 'Bearer ' + accessToken
            };
            return kintone.proxy(url, 'DELETE', header, {});
        }
    };


    kintone.events.on('app.record.index.show', function(event) {

        kintoneScheduleService.init();

        /* create kintone ui */
        kintoneScheduleService.uiCreate(kintone.app.getHeaderSpaceElement());

        // init process
        outlookAPI.init();

        // click sign in button
        $('#kintoneCustomizeBtnSignInOutlook').on('click', function() {
            outlookAPI.signIn();
        });

        // click sign out button
        $('#kintoneCustomizeBtnSignOut').on('click', function() {
            outlookAPI.signOut();
        });
    });


    kintone.events.on('app.record.detail.show', function(event) {
        var record = event.record;

        kintoneScheduleService.init();

        kintoneScheduleService.uicreateForDetail();

        $('#kintoneCustomizeBtnSendSchedule').on('click', function() {
            // Confirm whether to execute
            swal({
                title: kintoneScheduleService.setting.i18n.message.info.confirmRegister,
                type: 'warning',
                confirmButtonColor: '#DD6B55',
                confirmButtonText: kintoneScheduleService.setting.i18n.button.registerExec,
                cancelButtonText: kintoneScheduleService.setting.i18n.button.cancelExec,
                showCancelButton: 'true',
                allowOutsideClick: false
            }).then(function(isConfirm) {
                if (isConfirm) {
                    return kintoneScheduleService.checkDateTime(record).then(function(isAllDay) {
                        outlookAPI.setDataForRegistration(record, isAllDay);
                    }, function() {
                        KC.ui.loading.hide();
                    });
                }
            }, function(dismiss) {
                KC.ui.loading.hide();
            });
        });
    });


    kintone.events.on(['app.record.create.show',
        'app.record.edit.show', 'app.record.index.edit.show'], function(event) {
        var record = event.record;
        if (event.type === 'app.record.create.show') {
            record[EVENT_ID_FIELD_CODE]['value'] = '';
        }
        record[EVENT_ID_FIELD_CODE]['disabled'] = true;

        return event;
    });


    kintone.events.on('app.record.edit.submit.success', function(event) {
        var record = event.record;

        kintoneScheduleService.init();

        if (record[EVENT_ID_FIELD_CODE] === undefined) {
            return event;
        }

        var eventId = record[EVENT_ID_FIELD_CODE].value;
        if (eventId === '' || !kintoneScheduleService.isExpireAccessToken()) {
            return event;
        }

        swal({
            title: kintoneScheduleService.setting.i18n.message.info.confirmUpdate,
            type: 'warning',
            confirmButtonColor: '#DD6B55',
            confirmButtonText: kintoneScheduleService.setting.i18n.button.updateExec,
            cancelButtonText: kintoneScheduleService.setting.i18n.button.cancelExec,
            showCancelButton: 'true',
            allowOutsideClick: false
        }).then(function(isConfirm) {
            if (!isConfirm) {
                return;
            }
            return kintoneScheduleService.checkDateTime(record).then(function(isAllDay) {
                outlookAPI.getToOutlook(record).then(function(respdata) {
                    if (respdata === undefined) {
                        KC.ui.loading.hide();
                        return event;
                    }
                    outlookAPI.setDataForUpdate(record, isAllDay);
                }, function() {
                    swal({
                        title: 'Error!',
                        type: 'error',
                        text: kintoneScheduleService.setting.i18n.message.error.updateFailure,
                        allowOutsideClick: false
                    });
                    KC.ui.loading.hide();
                });
            }, function() {
                KC.ui.loading.hide();
            });
        }, function(dismiss) {
            KC.ui.loading.hide();
        });
    });


    kintone.events.on('app.record.detail.delete.submit', function(event) {
        var record = event.record;
        var eventId = record[EVENT_ID_FIELD_CODE].value;
        if (!kintoneScheduleService.isExpireAccessToken() || eventId === '') {
            return;
        }

        return new kintone.Promise(function(resolve, reject) {
            swal({
                title: kintoneScheduleService.setting.i18n.message.info.confirmDelete,
                type: 'warning',
                confirmButtonColor: '#DD6B55',
                confirmButtonText: kintoneScheduleService.setting.i18n.button.deleteExec,
                cancelButtonText: kintoneScheduleService.setting.i18n.button.cancelExec,
                showCancelButton: 'true',
                allowOutsideClick: false
            }).then(function(isConfirm) {
                if (!isConfirm) {
                    return event;
                }
                outlookAPI.getToOutlook(record).then(function(respdata) {
                    if (respdata === undefined) {
                        KC.ui.loading.hide();
                        resolve(true);
                    } else {
                        outlookAPI.setDataForDelete(record).then(function(resp) {
                            resolve(true);
                        });
                    }
                }, function() {
                    swal({
                        title: 'Error!',
                        type: 'error',
                        text: kintoneScheduleService.setting.i18n.message.error.deleteFailure,
                        allowOutsideClick: false
                    }).then(function() {
                        KC.ui.loading.hide();
                        resolve(true);
                    });
                });
            }, function(dismiss) {
                resolve(false);
            });
        });
    });

})(jQuery);
