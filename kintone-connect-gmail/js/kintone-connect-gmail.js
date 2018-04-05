/**!
 * JSCustomize on kintone - kintone and mail service
 *
 * App: kintone - Mail service
 *
 * Copyright (c) 2017 Cybozu
 *
 * Licensed under the MIT License
 */
(function (PLUGIN_ID, KC, GAPI) {
    'use strict';
    if (KC === null) {
        return;
    }
    var gmailAPI, kintoneMailService;
    kintoneMailService = {
        lang: {
            en: {
                button: {
                    signInGmail: 'Sign In to Gmail',
                    signOut: 'Sign Out of Gmail',
                    getMail: 'Receive Emails',
                    sendMail: 'Send email'
                },
                message: {
                    success: {
                        sendMail: 'Your email has been sent successfully.'
                    },
                    error: {
                        occurred: 'Error occurred.',
                        invalidEmail: 'Invalid email address format.',
                        mailSizeLarge: 'The email size exceeds the maximum of {{maxFileSize}}MB.',
                        recordNotFound: 'Record was not found!',
                        emailHasSend: 'This email has been send with message ID: {{messageID}}',
                        unsupportExtension: 'The "{{fileName}}" file is not supported to sending email. ' +
                            'The ".{{fileExt}}" extension is blocked on Gmail.'
                    }
                }
            },
            ja: {
                button: {
                    signInGmail: 'Gmailにログイン',
                    signOut: 'Gmailからログアウト',
                    getMail: 'メールを受信',
                    sendMail: '送信する'
                },
                message: {
                    success: {
                        sendMail: 'メールの送信に成功しました。'
                    },
                    error: {
                        occurred: 'エラー',
                        invalidEmail: 'メールアドレスの形式が正しくありません。',
                        mailSizeLarge: 'メールサイズが上限（{{maxFileSize}}MB）を超えています。 ',
                        recordNotFound: 'レコードが見つかりませんでした！',
                        emailHasSend: 'このメールはメッセージID: {{messageID}}で送信されました',
                        unsupportExtension: '「{{fileName}}」ファイルはメールの送信に対応していません. ' +
                            'Gmailでは「.{{fileExt}}」の拡張子がブロックされています。'
                    }
                }
            }
        },
        setting: {
            lang: 'en',
            i18n: {},
            app: {
                appClientID: "", /* Your google app client ID */
                fieldsCode: {
                    attachment: "attachment",
                    bcc: "bcc",
                    cc: "cc",
                    content: "message",
                    dateTime: "Date_and_time",
                    from: "from",
                    labels: "labels_id",
                    mailAccount: "email_account",
                    messageID: "message_id",
                    owner: "owner",
                    subject: "subject",
                    threadID: "thread_id",
                    to: "to"
                }
            },
            extensionProhibited: [
                'ADE', 'ADP', 'BAT', 'CHM', 'CMD', 'COM',
                'CPL', 'DLL', 'DMG', 'EXE', 'HTA', 'INS',
                'ISP', 'JAR', 'JS', 'JSE', 'LIB', 'LNK',
                'MDE', 'MSC', 'MSI', 'MSP', 'MST', 'NSH',
                'PIF', 'SCR', 'SCT', 'SHB', 'SYS', 'VB',
                'VBE', 'VBS', 'VXD', 'WSC', 'WSF', 'WSH'
            ],
            gAPI: {
                labelIdsForGet: ['INBOX', 'SENT'],
                // Max value of maxMessagesForGet is 45 because 45*5 = 225, limit quota per second is 250
                maxMessagesForGet: 45,
                maxEmailSize: 5 * 1024 * 1024 // (byte) ~5MB
            },
            ui: {
                buttons: {
                    signInGmail: {
                        id: 'kintoneCustomizeBtnSignInGmail',
                        text: 'signInGmail'
                    },
                    signOut: {
                        id: 'kintoneCustomizeBtnSignOut',
                        text: 'signOut'
                    },
                    getMail: {
                        id: 'kintoneCustomizeBtnGetMail',
                        text: 'getMail'
                    },
                    sendMail: {
                        id: 'kintoneCustomizeBtnSendMail',
                        text: 'sendMail'
                    }
                },
                label: {
                    userInfo: {}
                }
            }
        },
        data: {
            ui: {},
            mail: {}
        },
        error: [],
        init: function () {
            var self = this;

            this.setting.lang = kintone.getLoginUser().language || 'en';
            this.setting.i18n = this.setting.lang in this.lang ? this.lang[this.setting.lang] : this.lang.en;

            KC.kintoneListenEvent([
                'app.record.index.edit.show',
                'app.record.edit.show',
                'app.record.create.show'
            ], 'disableAndResetField', this);
            KC.kintoneListenEvent([
                'app.record.index.show',
                'app.record.detail.show'
            ], 'kintoneEventListener', this);
            document.addEventListener('click', function (el) {
                self.handleEventClick(el);
            });
        },
        disableAndResetField: function (evt) {
            evt.record[this.setting.app.fieldsCode.from].disabled = true;
            if (evt.type === 'app.record.create.show') {
                evt.record[this.setting.app.fieldsCode.from].value = '';
                evt.record[this.setting.app.fieldsCode.threadID].value = '';
                evt.record[this.setting.app.fieldsCode.labels].value = '';
                evt.record[this.setting.app.fieldsCode.mailAccount].value = '';
                evt.record[this.setting.app.fieldsCode.messageID].value = '';
                evt.record[this.setting.app.fieldsCode.owner].value = [{
                    code: kintone.getLoginUser().code
                }];
            }
            return evt;
        },
        kintoneEventListener: function (event) {
            var status = false;
            switch (event.type) {
                case 'app.record.index.show':
                    status = this.eventOnIndexShow(event);
                    break;
                case 'app.record.detail.show':
                    status = this.eventOnDetailShow(event);
                    break;
                default:
                    break;
            }
            if (status !== true) {
                return;
            }
            KC.ui.element(this.data.ui.kintoneCustomizeGmailHeaderSigned)
                .append(this.data.ui.btnSignOut);

            var self = this;
            gmailAPI.init(function (isSignedIn) {
                self.updateSigninStatus(isSignedIn);
            });
        },
        eventOnIndexShow: function (event) {
            if (this.hasInitUIIndex()) {
                return;
            }
            this.uiCreate(kintone.app.getHeaderSpaceElement());

            this.data.ui.btnGetmail = KC.ui.createButton(this.setting.ui.buttons.getMail, this.setting.i18n.button);
            KC.ui.element(this.data.ui.kintoneCustomizeGmailHeaderSigned)
                .append(this.data.ui.btnGetmail);
            return true;
        },
        eventOnDetailShow: function (event) {
            if (this.hasInitUIDetail()) {
                return false;
            }
            this.uiCreate(kintone.app.record.getHeaderMenuSpaceElement());

            this.data.ui.btnSendmail = KC.ui.createButton(this.setting.ui.buttons.sendMail, this.setting.i18n.button);
            KC.ui.element(this.data.ui.kintoneCustomizeGmailHeaderSigned)
                .append(this.data.ui.btnSendmail);
            return true;
        },
        hasInitUIIndex: function () {
            return document.getElementById(this.setting.ui.buttons.signInGmail.id);
        },
        hasInitUIDetail: function () {
            return document.getElementById(this.setting.ui.buttons.sendMail.id);
        },
        uiCreate: function (kintoneHeaderSpace) {
            var kintoneCustomizeGmailHeader = document.createElement('div');

            this.data.ui.kintoneCustomizeGmailHeaderSigned = document.createElement('div');
            this.data.ui.kintoneCustomizeGmailHeaderNotSigned = document.createElement('div');
            this.data.ui.kintoneCustomizeGmailUserInfo = document.createElement('div');

            this.data.ui.btnSignIn = KC.ui.createButton(this.setting.ui.buttons.signInGmail, this.setting.i18n.button);
            this.data.ui.btnSignOut = KC.ui.createButton(this.setting.ui.buttons.signOut, this.setting.i18n.button);
            this.data.ui.kintoneCustomizeGmailUserInfo = document.createElement('div');

            this.data.ui.kintoneCustomizeGmailHeaderSigned.style.display = 'none';

            kintoneCustomizeGmailHeader.className = 'kintoneCustomizeGmailUIHeader';
            this.data.ui.kintoneCustomizeGmailUserInfo.className = 'kintoneCustomizeGmailUIUserInfo';
            KC.ui.element(this.data.ui.kintoneCustomizeGmailHeaderNotSigned)
                .append(this.data.ui.btnSignIn)
                .appendTo(kintoneCustomizeGmailHeader)
                .appendTo(kintoneHeaderSpace);
            KC.ui.element(this.data.ui.kintoneCustomizeGmailHeaderSigned)
                .append(this.data.ui.kintoneCustomizeGmailUserInfo)
                .appendTo(kintoneCustomizeGmailHeader)
                .appendTo(kintoneHeaderSpace);
        },
        handleEventClick: function (el) {
            var element = this.elementFnc(el.target) || this.elementFnc(el.srcElement);
            var IDElement = element.getId();
            switch (IDElement) {
                case this.setting.ui.buttons.signOut.id:
                    gmailAPI.auth.signOut();
                    return;
                case this.setting.ui.buttons.signInGmail.id:
                    KC.ui.loading.show();
                    gmailAPI.auth.signIn();
                    break;
                case this.setting.ui.buttons.getMail.id:
                    KC.ui.loading.show();
                    this.initGetMail();
                    break;
                case this.setting.ui.buttons.sendMail.id:
                    var recordID = kintone.app.record.getId();
                    if (recordID === null || recordID < 1) {
                        KC.alertMessage(this.setting.i18n.message.error.occurred, 'error');
                        return;
                    }
                    KC.ui.loading.show();
                    this.initSendMail(recordID);
                    break;
                default:
                    return false;
            }
            return;

        },
        elementFnc: function (el) {
            return {
                getId: function () {
                    return el.id;
                },
                getData: function (dataId) {
                    return el.getAttribute('data-' + dataId);
                },
                hasClass: function (className) {
                    if (el.className.split(" ").indexOf(className) === -1) {
                        return false;
                    }
                    return true;
                },
                on: function (DOMEventName, callbackFnc) {
                    el.addEventListener(DOMEventName, callbackFnc);
                    return this;
                },
                remove: function () {
                    el.remove();
                },
                clear: function () {
                    el.innerHTML = '';
                }
            };
        },
        /**
         *  Called when the signed in status changes, to update the UI
         *  appropriately. After a sign-in, the API is called.
         */
        updateSigninStatus: function (isSignedIn) {
            var self = this;
            KC.ui.loading.show();
            if (!isSignedIn) {
                self.data.ui.kintoneCustomizeGmailHeaderNotSigned.style.display = 'inline-block';
                self.data.ui.kintoneCustomizeGmailHeaderSigned.style.display = 'none';
                KC.ui.loading.hide();
                return;
            }
            return self.getUserProfile().then(function (userProfile) {
                self.data.mail.profile = userProfile;
                self.data.ui.kintoneCustomizeGmailUserInfo.innerHTML = self.data.mail.profile.emailAddress;
            }).then(function () {
                self.data.ui.kintoneCustomizeGmailHeaderNotSigned.style.display = 'none';
                self.data.ui.kintoneCustomizeGmailHeaderSigned.style.display = 'inline-block';
                KC.ui.loading.hide();
            });
        },
        getUserProfile: function () {
            KC.ui.loading.show();
            var dataRequest = {
                userId: 'me'
            };
            return gmailAPI.user(dataRequest).profile();
        },
        initGetMail: function () {
            var self = this;
            KC.ui.loading.show();
            this.getMessageListFromGmail(self.setting.gAPI.labelIdsForGet).then(function (emailMessages) {
                if (!emailMessages || emailMessages.length === 0) {
                    KC.ui.loading.hide();
                    return;
                }
                self.data.emailMessages = emailMessages.reverse();
                return self.putMailToKintoneApp().then(function () {
                    window.location.reload();
                    KC.ui.loading.hide();
                }).catch(function (err) {
                    window.console.error(err);
                    KC.ui.loading.hide();
                });
            }).catch(function (err) {
                window.console.error(err);
                KC.ui.loading.hide();
            });
        },

        getMessageListFromGmail: function (labelIds) {
            var self = this;
            var getMessagesProcesses = [];

            labelIds.forEach(function (labelId) {
                getMessagesProcesses.push(self.gmail('me').getAll([labelId]));
            });

            return kintone.Promise.all(getMessagesProcesses).then(function (resp) {
                var returnList = [];
                resp.forEach(function (messageList) {
                    messageList.forEach(function (messageItem) {
                        if (!messageItem) {
                            return;
                        }

                        var exitsItem = returnList.filter(function (item) {
                            return item.id === messageItem.id;
                        });
                        if (exitsItem.length === 0) {
                            returnList.push(messageItem);
                        }
                    });
                });

                if (returnList.length === 0) {
                    return null;
                }
                return returnList;
            });
        },

        putMailToKintoneApp: function () {
            var self = this;

            function addMail(messageId) {
                return self.gmail('me').getMessageByID(messageId).then(function (data) {
                    if (data === false) {
                        KC.alertMessage(self.setting.i18n.message.error.occurred);
                        return false;
                    }

                    return self.addMailIntoKintone(data.mailInfo, data.headers, data.body, data.files);
                });
            }

            return self.getExitsMessageIdsOnkintone().then(function (kintoneMessageRecordIds) {
                var messageInfos = self.data.emailMessages.filter(function (item) {
                    return kintoneMessageRecordIds.indexOf(item.id) === -1;
                }).slice(0, self.setting.gAPI.maxMessagesForGet);

                var addKintoneRecordProcesses = [];
                messageInfos.forEach(function (messageInfo) {
                    addKintoneRecordProcesses.push(addMail(messageInfo.id));
                });

                return kintone.Promise.all(addKintoneRecordProcesses);
            });
        },

        getExitsMessageIdsOnkintone: function () {
            var params = {
                app: kintone.app.getId(),
                fields: [this.setting.app.fieldsCode.messageID],
                totalCount: true
            };

            var self = this;

            var records = [];
            var limit = 500;

            function getRecords(offset) {
                var curOffset = offset;
                params.query = 'limit ' + limit + ' offset ' + curOffset;
                return KC.apiRequest('records', 'GET', params).then(function (resp) {
                    if (resp.records && resp.records.length > 0) {
                        records = records.concat(resp.records);
                    }

                    if (resp.records.length !== 0) {
                        curOffset += limit;
                        return getRecords(curOffset);
                    }

                    return records;
                });

            }

            return getRecords(0).then(function (recordsData) {
                return recordsData.map(function (item) {
                    return item[self.setting.app.fieldsCode.messageID].value;
                });
            });
        },

        getLabelsStringForStorage: function (labelList) {
            var self = this;
            return labelList.filter(function (item) {
                return self.setting.gAPI.labelIdsForGet.indexOf(item) > -1;
            }).join(', ');
        },

        removeStyleTagOnString: function (text) {
            return text.replace(/<style.*style>|<style.*[[\s\S\t]*?.*style>/mg, '');
        },

        addMailIntoKintone: function (mailInfo, headers, body, files) {
            var kintoneRecord = {};

            kintoneRecord[this.setting.app.fieldsCode.subject] = {
                value: headers.subject
            };
            kintoneRecord[this.setting.app.fieldsCode.from] = {
                value: headers.from
            };
            kintoneRecord[this.setting.app.fieldsCode.to] = {
                value: headers.to
            };
            kintoneRecord[this.setting.app.fieldsCode.cc] = {
                value: headers.cc || ''
            };
            kintoneRecord[this.setting.app.fieldsCode.bcc] = {
                value: headers.bcc || ''
            };

            var content = this.removeStyleTagOnString(body);
            kintoneRecord[this.setting.app.fieldsCode.content] = {
                value: content
            };

            kintoneRecord[this.setting.app.fieldsCode.dateTime] = {
                value: (new Date(parseInt(mailInfo.date, 10))).toISOString()
            };
            kintoneRecord[this.setting.app.fieldsCode.threadID] = {
                value: mailInfo.threadId
            };
            kintoneRecord[this.setting.app.fieldsCode.messageID] = {
                value: mailInfo.id
            };
            kintoneRecord[this.setting.app.fieldsCode.labels] = {
                value: this.getLabelsStringForStorage(mailInfo.labelIds)
            };
            kintoneRecord[this.setting.app.fieldsCode.mailAccount] = {
                value: this.data.mail.profile.emailAddress
            };
            kintoneRecord[this.setting.app.fieldsCode.owner] = {
                value: [{
                    code: kintone.getLoginUser().code,
                    type: 'USER'
                }]
            };
            var self = this;
            if (typeof files !== 'undefined' && files.length > 0) {
                return this.uploadFileToKintone(mailInfo.messageID, files, 0, []).then(function (filesKey) {
                    kintoneRecord[self.setting.app.fieldsCode.attachment] = {
                        value: filesKey
                    };
                    return self.addNewRecord(kintoneRecord);
                }).catch(function (error) {
                    KC.alertMessage(self.setting.i18n.message.error.occurred);
                    window.console.error(error);
                });
            }
            return self.addNewRecord(kintoneRecord);
        },
        addNewRecord: function (kintoneRecord) {
            return KC.apiRequest('record', 'POST', {
                app: kintone.app.getId(),
                record: kintoneRecord
            });
        },
        uploadFileToKintone: function (messageID, files, index, kintoneFilesKey) {
            var self = this,
                file = files[index];
            return this.gmail('me').getAttachmentByID(messageID, file.body.attachmentId)
                .then(function (attachment) {
                    //Create form file
                    var formFile = new FormData(),
                        blobFileAttachment = self.base64AttachmentToBlob(attachment.data, file.mimeType);
                    formFile.append('__REQUEST_TOKEN__', kintone.getRequestToken());
                    formFile.append('file', blobFileAttachment, file.filename);

                    return KC.formRequest(kintone.api.url('/k/v1/file'), 'POST', formFile);
                }).then(function (kintoneFileResponse) {
                    kintoneFilesKey.push(window.JSON.parse(kintoneFileResponse.response));
                    // POST files to kintone
                    if (index + 1 < files.length) {
                        return self.uploadFileToKintone(messageID, files, index + 1, kintoneFilesKey);
                    }
                    return kintoneFilesKey;
                });
        },
        base64AttachmentToBlob: function (base64String, contentType) {
            var binary = gmailAPI.attachmentDecode(base64String),
                len = binary.length,
                arrBuffer = new ArrayBuffer(len),
                fileOutput = new Uint8Array(arrBuffer);
            for (var i = 0; i < len; i++) {
                fileOutput[i] = binary.charCodeAt(i);
            }
            var blob = new Blob([arrBuffer], {
                type: (contentType || "octet/stream") + ';charset=utf-8;'
            });
            return blob;
        },
        initSendMail: function (recordID) {
            var self = this;
            // TODO: Check size of email
            return this.kintoneGetRecordData(recordID)
                .then(function (data) {
                    return self.parseRecordDataToEmailData(data);
                }).then(function (dataEmail) {
                    var mineEmail = self.mineMessage(dataEmail),
                        hasAttachment = false;
                    // Get byte size of mineEmail with attachment
                    var mineEmailByte = self.byteOfString(mineEmail);
                    if (typeof dataEmail.attachment !== 'undefined' &&
                        dataEmail.attachment.constructor === Array && dataEmail.attachment.length > 0) {
                        hasAttachment = true;
                        dataEmail.attachment.forEach(function (att) {
                            // Validate file extension
                            var fileExt = self.getFileExtension(att.name);
                            if (self.setting.extensionProhibited.indexOf(fileExt) >= 0) {
                                self.stopProcessWithMessage(self.setting.i18n.message.error.unsupportExtension
                                    .replace('{{fileName}}', att.name)
                                    .replace('{{fileExt}}', fileExt));
                            }
                            // Get filesize
                            mineEmailByte += parseInt(att.size, 10);
                            // Reduce byte of fileKey string which has defined as prefix in mineEmail
                            mineEmailByte -= self.byteOfString(att.fileKey);
                            // Incresae byte of filename
                            mineEmailByte += self.byteOfString(att.name + '\r\n\r\n\r\n\r\n');

                        });
                    }
                    // Validate fileSize
                    if (!self.isValidFileSize(mineEmailByte)) {
                        self.stopProcessWithMessage(self.setting.i18n.message.error.mailSizeLarge
                            .replace('{{maxFileSize}}', self.convertByteSize(self.setting.gAPI.maxEmailSize, 'MB')));
                    }
                    // Return mine raw without attachment
                    if (hasAttachment === false) {
                        return mineEmail;
                    }
                    // Get attachment and return mine raw with attachment
                    return self.kintoneGetAttachments(dataEmail.attachment)
                        .then(function (mailAttachments) {
                            mailAttachments.forEach(function (att) {
                                mineEmail = mineEmail.replace('"' + att.fileKey + '"',
                                    '"' + att.name + '"\r\n\r\n' + att.contentBytes + '\r\n\r\n');
                            });
                            return mineEmail;
                        });
                }).then(function (mineRaw) {
                    // Send data to Gmail
                    return self.gmail('me').send(mineRaw);
                }).then(function (dataEmailResponse) {
                    // Update data response of Gmail to kintone app
                    var updateRecordData = {};
                    updateRecordData[self.setting.app.fieldsCode.messageID] = {
                        value: dataEmailResponse.id
                    };
                    updateRecordData[self.setting.app.fieldsCode.threadID] = {
                        value: dataEmailResponse.threadId
                    };
                    updateRecordData[self.setting.app.fieldsCode.labels] = {
                        value: dataEmailResponse.labelIds ? dataEmailResponse.labelIds.join(',') : ''
                    };
                    updateRecordData[self.setting.app.fieldsCode.mailAccount] = {
                        value: self.data.mail.profile.emailAddress
                    };
                    updateRecordData[self.setting.app.fieldsCode.owner] = {
                        value: [{
                            code: kintone.getLoginUser().code,
                            type: 'USER'
                        }]
                    };
                    updateRecordData[self.setting.app.fieldsCode.from] = {
                        value: self.data.mail.profile.emailAddress
                    };
                    return KC.apiRequest('record', 'PUT', {
                        app: kintone.app.getId(),
                        id: recordID,
                        record: updateRecordData
                    });
                }).then(function (dataEmailMine) {
                    KC.alertMessage(self.setting.i18n.message.success.sendMail, 'success');
                    KC.ui.loading.hide();
                }).catch(function (error) {
                    KC.showError(error);
                });
        },
        kintoneGetRecordData: function (recordID) {
            var self = this;
            return KC.apiRequest('records', 'GET', {
                app: kintone.app.getId(),
                fields: KC.objectValueToArray(self.setting.app.fieldsCode),
                query: '$id = ' + recordID
            }).then(function (data) {
                if (typeof data.records === 'undefined' || data.records.length === 0) {
                    throw new Error(this.setting.i18n.message.error.recordNotFound);
                }
                return data.records[0];
            });
        },
        parseRecordDataToEmailData: function (recordData) {
            var result = {};
            for (var key in this.setting.app.fieldsCode) {
                var fieldCode = this.setting.app.fieldsCode[key];
                if (!recordData.hasOwnProperty(fieldCode)) {
                    continue;
                }
                result[key] = recordData[fieldCode].value;
            }
            // Force set From sender with value is the email of current user-login (gmail)
            result.from = this.data.mail.profile.emailAddress;
            return result;
        },
        kintoneGetAttachments: function (attachments) {
            var attachmentPromise = [];
            for (var i = 0; i < attachments.length; i++) {
                attachmentPromise.push(this.kintoneGetAttachment(attachments[i]));
            }
            return kintone.Promise.all(attachmentPromise)
                .catch(function (error) {
                    KC.showError(error);
                });
        },
        kintoneGetAttachment: function (kintoneFileData) {
            var self = this,
                url = '/k/v1/file.json?fileKey=' + kintoneFileData.fileKey;
            return new kintone.Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                xhr.responseType = 'arraybuffer';
                xhr.onload = function () {
                    kintoneFileData.contentBytes = self.arraybufferToBase64(this.response);
                    resolve(kintoneFileData);
                };
                xhr.onerror = function (e) {
                    reject(e);
                };
                xhr.send();
            }).then({}, function (error) {
                KC.showError(error);
                return false;
            });
        },
        arraybufferToBase64: function (arraybuffer) {
            var binary = '',
                bytes = new Uint8Array(arraybuffer),
                len = bytes.byteLength;
            for (var i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return window.btoa(binary);
        },
        /**
         * mineMessage: convert data to RFC 5322 format
         * @param data {
         *  subject: "string",
         *  from: [], // emails array
         *  to: [],  // emails array
         *  cc: [],  // emails array
         *  bcc: [],  // emails array
         *  content: {
         *      content: "",
         *      type: ""
         *  }
         *  attachment: [] // Array attachments (Binary)
         * }
         */
        mineMessage: function (data) {
            var boundary = 'kintoneBoundaryData';
            var mineData = [];
            mineData.push('Content-Type: multipart/mixed; charset="UTF-8"; boundary="' + boundary + '"\r\n');
            mineData.push('MIME-Version: 1.0\r\n');
            if (typeof data.from !== 'undefined' && data.from !== '') {
                mineData.push('From: ' + this.encodeSender(data.from) + '\r\n');
            }
            if (typeof data.to !== 'undefined' && data.to !== '') {
                mineData.push('To: ' + this.encodeSender(data.to) + '\r\n');
            }
            if (typeof data.cc !== 'undefined' && data.cc !== '') {
                mineData.push('Cc: ' + this.encodeSender(data.cc) + '\r\n');
            }
            if (typeof data.bcc !== 'undefined' && data.bcc !== '') {
                mineData.push('Bcc: ' + this.encodeSender(data.bcc) + '\r\n');
            }
            if (typeof data.subject !== 'undefined' && data.subject !== '') {
                mineData.push('Subject: ' + this.encodeUTF8(data.subject) + '\r\n\r\n');
            }
            if (typeof data.content !== 'undefined' && data.content !== '') {
                mineData.push('--' + boundary + '\r\n');
                mineData.push('Content-Type: text/html; charset="UTF-8"\r\n');
                mineData.push('MIME-Version: 1.0\r\n');
                mineData.push('Content-Transfer-Encoding: 8bit\r\n\r\n');

                mineData.push(data.content + '\r\n\r\n');
            }
            if (typeof data.attachment !== 'undefined' &&
                data.attachment.constructor === Array && data.attachment.length !== 0) {
                data.attachment.forEach(function (attach) {
                    mineData.push('--' + boundary + '\r\n');
                    mineData.push('Content-Type: ' + attach.contentType + '\r\n');
                    mineData.push('MIME-Version: 1.0\r\n');
                    mineData.push('Content-Transfer-Encoding: base64\r\n');
                    mineData.push('Content-Disposition: attachment; filename="' + attach.fileKey + '"');
                });
            }
            mineData.push('--' + boundary + '--');
            return mineData.join('');
        },
        encodeSender: function (senderString) {
            var self = this,
                senderArray = String(senderString).trim().split(','),
                senderResult = [];
            senderArray.forEach(function (sender) {
                var patternSender = new RegExp(/(.*)<(.*)>/),
                    result = patternSender.exec(sender.trim()),
                    email = '',
                    emailEncoded = '';
                if (result !== null && result.length === 3) {
                    emailEncoded = this.encodeUTF8(result[1]) + ' <' + result[2] + '>';
                    email = result[2];
                } else {
                    emailEncoded = sender;
                    email = sender;
                }
                if (email === '') {
                    this.stopProcessWithMessage(
                        self.setting.i18n.message.error.invalidEmail + ' (' + senderString + ')');
                }
                if (!this.isValidEmail(email)) {
                    this.stopProcessWithMessage(self.setting.i18n.message.error.invalidEmail + ' (' + email + ')');
                }
                senderResult.push(emailEncoded);
            }, this);
            return senderResult.join(',');
        },
        isValidEmail: function (email) {
            var regex = /^\s*[\w\-\+_]+(\.[\w\-\+_]+)*\@[\w\-\+_]+\.[\w\-\+_]+(\.[\w\-\+_]+)*\s*$/;
            return regex.test(String(email).toLowerCase());
        },
        isValidFileSize: function (byte) {
            return this.setting.gAPI.maxEmailSize >= byte;
        },
        encodeUTF8: function (string) {
            return '=?UTF-8?B?' + this.stringToBase64(string) + '?=';
        },
        stringToBase64: function (string) {
            return window.btoa(unescape(encodeURIComponent(string)));
        },
        encodeURI: function (string) {
            return this.stringToBase64(string).replace(/\//g, '_').replace(/\+/g, '-');
        },
        byteOfString: function (string) {
            return encodeURI(string).split(/%..|./).length - 1;
        },
        getFileExtension: function (fileName) {
            if (!fileName) {
                return;
            }
            var fileInfoArr = fileName.split('.');
            return String(fileInfoArr[fileInfoArr.length - 1]).toUpperCase();
        },
        stopProcessWithMessage: function (string) {
            KC.alertMessage({
                header: this.setting.i18n.message.error.occurred,
                messages: [string]
            });
            throw new Error(string);
        },
        convertByteSize: function (byte, unit) {
            switch (unit) {
                case 'KB':
                    return byte / 1024;
                case 'MB':
                    return byte / 1024 / 1024;
                case 'GB':
                    return byte / 1024 / 1024 / 1024;
                case 'TB':
                    return byte / 1024 / 1024 / 1024 / 1024;
                default:
                    return NaN;
            }
        }
    };

    /**
     * kintone - Gmail functions
     */
    kintoneMailService.gmail = function (userID) {
        return {
            getMessageByID: function (messageId) {
                return gmailAPI.messages({
                    userId: userID,
                    id: messageId
                }).get().then(function (gmailResp) {
                    if (gmailResp === false) {
                        return false;
                    }
                    var gmailData = gmailAPI.parse(gmailResp.payload);
                    return {
                        headers: gmailData.headers(['From', 'To', 'Cc', 'Bcc', 'Subject']),
                        body: gmailData.body(),
                        files: gmailData.files(),
                        mailInfo: {
                            id: gmailResp.id,
                            threadId: gmailResp.threadId,
                            labelIds: gmailResp.labelIds,
                            date: gmailResp.internalDate
                        }
                    };
                });
            },
            get: function (itemsCount, labelIDs, query) {
                var dataRequest = {
                    userId: userID,
                    maxResults: itemsCount || 100,
                    q: query || ''
                };
                if (labelIDs && labelIDs.length > 0) {
                    dataRequest.labelIds = labelIDs;
                }
                return gmailAPI.messages(dataRequest).list(labelIDs).then(function (result) {
                    if (!result.messages || result.messages.length === 0) {
                        return null;
                    }
                    return result.messages;
                });
            },
            getAll: function (labelIDs, query) {
                var dataRequest = {
                    userId: userID,
                    maxResults: 9999,
                    q: query
                };
                if (labelIDs && labelIDs.length > 0) {
                    dataRequest.labelIds = labelIDs;
                }
                return new kintone.Promise(function (resolve, reject) {
                    try {
                        gmailAPI.messages(dataRequest).listAll(userID, query, function (messages) {
                            resolve(messages);
                        });

                    } catch (error) {
                        reject(error);
                    }
                });
            },
            getAttachmentByID: function (messageID, attachmentID) {
                return gmailAPI.messages().getAttachmentByID(userID, messageID, attachmentID);
            },
            send: function (mineFormatString) {
                return gmailAPI.messages({
                    'userId': userID,
                    'resource': {
                        'raw': kintoneMailService.encodeURI(mineFormatString)
                    }
                }).send();
            }
        };
    };

    /**
     * Javascript API for google mail
     */
    gmailAPI = {
        CONST: {
            CLIENT_ID: kintoneMailService.setting.app.appClientID,
            DISCOVERY_DOCS: ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"],
            SCOPES: 'https://mail.google.com/'
        },
        init: function (callbackFnc) {
            KC.ui.loading.show();
            GAPI.load('client:auth2', function (e) {
                return GAPI.client.init({
                    discoveryDocs: gmailAPI.CONST.DISCOVERY_DOCS,
                    clientId: gmailAPI.CONST.CLIENT_ID,
                    scope: gmailAPI.CONST.SCOPES
                }).then(function () {
                    // Listen for sign-in state changes.
                    GAPI.auth2.getAuthInstance().isSignedIn.listen(function (err) {
                        callbackFnc(err);
                    });
                    // Handle the initial sign-in state.
                    callbackFnc(GAPI.auth2.getAuthInstance().isSignedIn.get());
                }).then(function () {
                    KC.ui.loading.hide();
                }).catch(function (err) {
                    KC.showError(err);
                    KC.ui.loading.hide();
                });
            });
        },
        auth: {
            signIn: function () {
                GAPI.auth2.getAuthInstance().signIn().catch(function () {
                    KC.ui.loading.hide();
                });
            },
            signOut: function () {
                GAPI.auth2.getAuthInstance().signOut();
            }
        },
        messages: function (dataRequest) {
            return {
                get: function () {
                    return GAPI.client.gmail.users.messages.get(dataRequest).then(function (response) {
                        return gmailAPI.handleError(response);
                    }).catch(function (e) {
                        return gmailAPI.handleError(e);
                    });
                },
                list: function () {
                    return GAPI.client.gmail.users.messages.list(dataRequest).then(function (response) {
                        return gmailAPI.handleError(response);
                    }).catch(function (e) {
                        return gmailAPI.handleError(e);
                    });
                },
                listAll: function (userId, query, callback) {
                    var getPageOfMessages = function (request, result) {
                        request.execute(function (resp) {
                            var responseResult = result.concat(resp.messages);
                            var nextPageToken = resp.nextPageToken;
                            if (nextPageToken) {
                                dataRequest.pageToken = nextPageToken;
                                var requestNext = GAPI.client.gmail.users.messages.list(dataRequest);
                                getPageOfMessages(requestNext, responseResult);
                            } else {
                                callback(responseResult);
                            }
                        });
                    };
                    var initialRequest = GAPI.client.gmail.users.messages.list(dataRequest);
                    getPageOfMessages(initialRequest, []);
                },
                send: function (userID, base64EncodedEmail) {
                    return new kintone.Promise(function (resolve, reject) {
                        var request = GAPI.client.gmail.users.messages.send(dataRequest);
                        try {
                            request.execute(function (response) {
                                resolve(gmailAPI.handleError(response));
                            });
                        } catch (error) {
                            reject(error);
                        }
                    });
                },
                getAttachmentByID: function (userID, messageID, attachmentID) {
                    return new kintone.Promise(function (resolve, reject) {
                        var request = GAPI.client.gmail.users.messages.attachments.get({
                            id: attachmentID,
                            messageId: messageID,
                            userId: userID
                        });
                        try {
                            request.execute(function (attachment) {
                                resolve(gmailAPI.handleError(attachment));
                            });
                        } catch (error) {
                            reject(error);
                        }
                    });
                }
            };
        },
        labels: function (dataRequest) {
            return {
                list: function () {
                    return GAPI.client.gmail.users.labels.list(dataRequest).then(function (response) {
                        var labels = response.result.labels;
                        if (labels && labels.length > 0) {
                            return labels;
                        }
                        return false;
                    }).catch(function (e) {
                        return gmailAPI.handleError(e);
                    });
                }
            };
        },
        user: function (dataRequest) {
            return {
                profile: function () {
                    return GAPI.client.gmail.users.getProfile(dataRequest).then(function (response) {
                        return gmailAPI.handleError(response);
                    }).catch(function (e) {
                        return gmailAPI.handleError(e);
                    });
                }
            };
        },
        parse: function (payloadData) {
            return {
                headers: function (arrayKeys) {
                    var result = {};
                    if (!arrayKeys || arrayKeys.constructor !== Array) {
                        return result;
                    }
                    for (var i = 0; i < payloadData.headers.length; i++) {
                        if (arrayKeys.indexOf(payloadData.headers[i].name) !== -1) {
                            result[payloadData.headers[i].name.toLowerCase()] = payloadData.headers[i].value;
                        }
                    }
                    return result;
                },
                body: function () {
                    if (!payloadData.parts) {
                        return payloadData.snippet || '';
                    }

                    function getBodyMessage(dataParts) {
                        var body = '';
                        for (var index = 0; index < dataParts.length; index++) {
                            var bodyPart = dataParts[index];
                            if (bodyPart.parts) {
                                return getBodyMessage(bodyPart.parts);
                            }
                            body = bodyPart.body.data;
                            if (bodyPart.mineType === 'text/html') {
                                return body;
                            }
                        }
                        return body;
                    }
                    return gmailAPI.bodyDecode(getBodyMessage(payloadData.parts));
                },
                files: function () {
                    var files = [];
                    if (!payloadData.parts) {
                        return files;
                    }

                    function getFiles(dataParts) {
                        dataParts.forEach(function (part) {
                            if (part.parts) {
                                return getFiles(part.parts);
                            }
                            if (part.filename !== '' && part.body.attachmentId) {
                                files.push(part);
                            }
                        });
                    }
                    getFiles(payloadData.parts);
                    return files;
                }
            };
        },
        handleError: function (response) {
            if (response && typeof response.status === 'undefined' && typeof response.error === 'undefined') {
                return response;
            }
            var statusCode = (response.error) ? response.error.code : response.status;
            switch (statusCode) {
                case 200:
                    return response.result ? response.result : response;
                case 401:
                    gmailAPI.auth.signOut();
                    break;
                default:
                    break;
            }
            var errMessage = [];
            if (response.error) {
                errMessage.push(statusCode + ': ' + response.error.message);
            } else if (response.result) {
                errMessage.push(statusCode + ': ' + response.result.error.message);
            } else {
                errMessage.push(response);
            }
            KC.alertMessage({
                header: kintoneMailService.setting.i18n.message.error.occurred,
                messages: errMessage
            }, 'error');
            KC.ui.loading.hide();
            throw new Error(errMessage.join());

        },
        attachmentDecode: function (stringEncoded) {
            return atob(stringEncoded.replace(/-/g, '+').replace(/_/g, '/'));
        },
        bodyDecode: function (stringEncoded) {
            if (!stringEncoded) {
                return '';
            }
            return decodeURIComponent(escape(atob(stringEncoded.replace(/-/g, '+').replace(/_/g, '/'))));
        }
    };

    kintoneMailService.init();
})(kintone.$PLUGIN_ID, window.kintoneCustomize || null, window.gapi);