/* global kintone */
/* global kintoneUtility */

jQuery.noConflict();
(function($) {
    'use strict';

    // common-js-functions.js
    var KC = window.kintoneCustomize;

    // azure_oauth.js
    var AO = window.azureOauth;

    // kintone-0365-connect_common.js
    var CM = window.kintoneAzureConnect;

    // Get value from kintone-0365-connect_common.js
    var SUBJECT_FIELD_CODE = CM.kintone.fieldCode.subject;
    var CONTENT_FIELD_CODE = CM.kintone.fieldCode.content;
    var FROM_FIELD_CODE = CM.kintone.fieldCode.from;
    var TO_FIELD_CODE = CM.kintone.fieldCode.to;
    var CC_FIELD_CODE = CM.kintone.fieldCode.cc;
    var BCC_FIELD_CODE = CM.kintone.fieldCode.bcc;
    var MESSAGE_ID_FIELD_CODE = CM.kintone.fieldCode.messageId;
    var MAIL_ACCOUNT_FIELD_CODE = CM.kintone.fieldCode.mailAccount;
    var ATTACH_FILE_FIELD_CODE = CM.kintone.fieldCode.attachFile;
    var MAIL_GET_URL = CM.azure.mailGetUrl;
    var MAIL_SEND_URL = CM.azure.mailSendUrl;

    var storage = window.localStorage;

    // Constant
    var SESSION_KEY_TO_ACCESS_TOKEN = 'ACCESS_TOKEN';
    var SIGN_USER_MAILACCOUNT = 'SIGN_USER_MAILACCOUNT';

    var kintoneMailService = {

        lang: {
            en: {
                button: {
                    signIn: 'Sign in Outlook',
                    signOut: 'Sign out of Outlook',
                    getMail: 'Receive email',
                    sendmail: 'Send email',
                    sendExec: 'Send',
                    cancelExec: 'Cancel'
                },
                message: {
                    info: {
                        confirmSend: 'Do you want to send this email?'
                    },
                    warning: {
                        noMail: 'There are no emails in your inbox.'
                    },
                    success: {
                        sendExec: 'Your email has been sent successfully.'
                    },
                    error: {
                        sendFailure: 'Failed to send email.',
                        signInFailure: 'Failed to sign in Outlook.',
                        getAccessTokenFailure: 'Failed to get access token.',
                        accessOutlookFailure: 'Failed to access to outlook.'
                    }
                }
            },
            ja: {
                button: {
                    signIn: 'Outlookにログイン',
                    signOut: 'Outlookからログアウト',
                    getMail: 'メール受信',
                    sendmail: 'メール送信',
                    sendExec: '送信',
                    cancelExec: 'キャンセル'
                },
                message: {
                    info: {
                        confirmSend: 'メールを送信しますか?'
                    },
                    warning: {
                        noMail: '受信箱にメールがありません'
                    },
                    success: {
                        sendExec: 'メールの送信に成功しました'
                    },
                    error: {
                        sendFailure: 'メールの送信に失敗しました',
                        signInFailure: 'サインインできませんでした',
                        getAccessTokenFailure: 'アクセストークンが取得できませんでした',
                        accessOutlookFailure: 'Outlookにアクセス出来ませんでした'
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
                    getMail: {
                        id: 'kintoneCustomizeBtnGetMail',
                        text: 'getMail'
                    },
                    sendMail: {
                        id: 'kintoneCustomizeBtnSendMail',
                        text: 'sendmail'
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
            mail: {
                profile: {
                    emailAddress: ''
                }
            },
            isLoginOutlook: false
        },

        init: function() {
            this.setting.lang = kintone.getLoginUser().language || 'ja';
            this.setting.i18n = this.setting.lang in this.lang ? this.lang[this.setting.lang] : this.lang.en;
        },

        // UI生成(一覧画面用)
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
            this.data.ui.btnGetmail = this.createButton(this.setting.ui.buttons.getMail, this.setting.i18n.button);

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
                    this.data.ui.btnGetmail,
                    this.data.ui.btnSignOut
                ])
                .appendTo(kintoneCustomizeOutlookHeader)
                .appendTo(kintoneHeaderSpace);
        },

        // UI生成(詳細画面用)
        uicreateForDetail: function() {
            if (!this.isExpireAccessToken()) {
                return;
            }
            kintone.app.record.setFieldShown('messageId', false);
            kintone.app.record.setFieldShown('mailAccount', false);
            var kintoneDetailHeaderSpace = kintone.app.record.getHeaderMenuSpaceElement();
            kintoneDetailHeaderSpace.appendChild(KC.ui.createButton(
                this.setting.ui.buttons.sendMail, this.setting.i18n.button));
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
            if (storage.getItem(SIGN_USER_MAILACCOUNT)) {
                return true;
            }
            return false;
        }
    };


    // outlook api用処理
    var outlookAPI = {

        // 初期処理
        init: function() {

            AO.init();
            if (!kintoneMailService.isExpireAccessToken() || !kintoneMailService.isSignUserDispInfo()) {
                kintoneMailService.data.ui.kintoneCustomizeOutlookHeaderNotSigned.style.display = 'inline-block';
                kintoneMailService.data.ui.kintoneCustomizeOutlookHeaderSigned.style.display = 'none';
            } else {
                kintoneMailService.data.ui.kintoneCustomizeOutlookHeaderNotSigned.style.display = 'none';
                kintoneMailService.data.ui.kintoneCustomizeOutlookHeaderSigned.style.display = 'inline-block';
                kintoneMailService.data.ui.kintoneCustomizeOutlookUserInfo.innerHTML =
                  storage.getItem(SIGN_USER_MAILACCOUNT);
                kintoneMailService.data.mail.profile.emailAddress = storage.getItem(SIGN_USER_MAILACCOUNT);
                kintoneMailService.data.isLoginOutlook = true;
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
                    text: kintoneMailService.setting.i18n.message.error.signInFailure,
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

                // 「getMail」「signout」ボタンを表示
                kintoneMailService.data.ui.kintoneCustomizeOutlookHeaderNotSigned.style.display = 'none';
                kintoneMailService.data.ui.kintoneCustomizeOutlookHeaderSigned.style.display = 'inline-block';
                kintoneMailService.data.ui.kintoneCustomizeOutlookUserInfo.innerHTML = userInfo.displayableId;
                kintoneMailService.data.mail.profile.emailAddress = userInfo.displayableId;
                kintoneMailService.data.isLoginOutlook = true;

                // セッションに入れておく
                storage.setItem(SESSION_KEY_TO_ACCESS_TOKEN, token);
                storage.setItem('SIGN_USER_MAILACCOUNT', userInfo.displayableId);

                KC.ui.loading.hide();

            }, function(error) {
                if (error) {
                    swal({
                        title: 'Error!',
                        type: 'error',
                        text: kintoneMailService.setting.i18n.message.error.getAccessTokenFailure,
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

        getMessageIDIndexIsNotRetrived: function(index, data) {
            var self = this;

            // 取得済みメールかチェック
            return self.checkMessagesIsNotExistsOnkintone(data[index].id).then(function(resp) {
                if (resp === false) {
                    if (data.length <= index + 1) {
                        // Out of index
                        return null;
                    }
                    return self.getMessageIDIndexIsNotRetrived(index + 1, data);
                }
                return index;
            });
        },

        // 取得済みメールかチェック
        checkMessagesIsNotExistsOnkintone: function(messageID) {
            var dataRequestkintoneApp = {
                app: kintone.app.getId(),
                fields: ['$id'],
                query: MESSAGE_ID_FIELD_CODE + ' like "' + messageID + '"',
                totalCount: true
            };
            return kintoneUtility.rest.getRecords(dataRequestkintoneApp).then(function(response) {

                if (!response.records || response.records.length === 0) {
                    return true;
                }
                return false;
            });
        },

        // outlookメール取得
        getMail: function() {
            KC.ui.loading.show();
            var self = this;
            var accessToken;

            if (kintoneMailService.isExpireAccessToken()) {
                accessToken = storage.getItem('ACCESS_TOKEN');
            } else {
                KC.ui.loading.hide();
                return;
            }

            var header = {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json',
                'outlook.body-content-type': 'html'
            };

            // OutlookのINBOXからメール取得
            return kintone.proxy(MAIL_GET_URL, 'GET', header, {}).then(function(res) {
                var data = JSON.parse(res[0]).value;
                
                if (data === undefined) {
                    swal({
                        title: 'ERROR!',
                        type: 'error',
                        text: kintoneMailService.setting.i18n.message.error.accessOutlookFailure,
                        allowOutsideClick: false
                    });
                    KC.ui.loading.hide();
                    return;
                }

                // 受信箱にメールが存在しない場合
                if (data.length === 0) {
                    swal({
                        title: 'WARN!',
                        type: 'warning',
                        text: kintoneMailService.setting.i18n.message.warning.noMail,
                        allowOutsideClick: false
                    });
                    KC.ui.loading.hide();
                    return;
                }

                // 取得したメールをkintoneへ登録
                return self.putMailToKintoneApp(0, data, accessToken).catch(function(err) {
                    KC.ui.loading.hide();
                });
            }, function(err) {
                KC.ui.loading.hide();
            });
        },

        // 取得したメールをkintoneへ登録
        putMailToKintoneApp: function(index, data, accessToken) {
            var self = this;

            return this.getMessageIDIndexIsNotRetrived(index, data).then(function(indexMessage) {

                if (indexMessage === null) {
                    return indexMessage;
                }
                // まだ未取得のメールを登録
                return self.addMailIntoKintone(data[indexMessage], accessToken).then(function(result) {
                    // Process next mail
                    if (indexMessage + 1 < data.length) {
                        return self.putMailToKintoneApp(indexMessage + 1, data, accessToken);
                    }
                });
            }).then(function(resp) {
                window.location.reload();
                KC.ui.loading.hide();
            });
        },

        addMailIntoKintone: function(data, accessToken) {
            var kintoneRecord = {};

            // Subject
            kintoneRecord[SUBJECT_FIELD_CODE] = {
                value: data.subject
            };

            // From
            kintoneRecord[FROM_FIELD_CODE] = {
                value: data.from.emailAddress.address
            };

            // To
            var toRecipents = data.toRecipients;
            var toRecipentsStr = toRecipents.map(function(el) {
                return el.emailAddress.address;
            }).toString();
            kintoneRecord[TO_FIELD_CODE] = {
                value: toRecipentsStr || ''
            };

            // Cc
            var ccRecipents = data.ccRecipients;
            var ccRecipentsStr = ccRecipents.map(function(el) {
                return el.emailAddress.address;
            }).toString();
            kintoneRecord[CC_FIELD_CODE] = {
                value: ccRecipentsStr || ''
            };

            // Bcc
            var bccRecipents = data.bccRecipients;
            var bccRecipentsStr = bccRecipents.map(function(el) {
                return el.emailAddress.address;
            }).toString();
            kintoneRecord[BCC_FIELD_CODE] = {
                value: bccRecipentsStr || ''
            };

            // Body
            // kintoneRecord[CONTENT_FIELD_CODE] = {
            //     value: data.body.content ? data.body.content : data.bodyPreview
            // };
            kintoneRecord[CONTENT_FIELD_CODE] = {
                value: data.body.content ? outlookAPI.removeStyleTagOnString(data.body.content) : data.bodyPreview
            };

            // messageId
            kintoneRecord[MESSAGE_ID_FIELD_CODE] = {
                value: data.id
            };

            // mailAccount
            kintoneRecord[MAIL_ACCOUNT_FIELD_CODE] = {
                value: kintoneMailService.data.mail.profile.emailAddress
            };

            // attachFile
            if (data.hasAttachments) {
                return outlookAPI.getAttach(data.id, accessToken).then(function(promiseArrayFiles) {
                    return kintone.Promise.all(promiseArrayFiles);
                }).then(function(arrayFiles) {
                    kintoneRecord[ATTACH_FILE_FIELD_CODE] = {
                        value: arrayFiles
                    };
                }).then(function() {
                    return outlookAPI.addKintone(kintoneRecord);
                });
            }
            return outlookAPI.addKintone(kintoneRecord);
        },

        // kintoneへ登録
        addKintone: function(postParam) {
            var param = {
                app: kintone.app.getId(),
                record: postParam,
                isGuest: false
            };

            return kintoneUtility.rest.postRecord(param);
        },

        // 添付ファイル取得
        getAttach: function(messageId, accessToken) {
            var self = this;
            var url = 'https://graph.microsoft.com/v1.0/me/messages/' + messageId + '/attachments';
            var header = {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            };

            // メールに添付されているファイルを取得
            return kintone.proxy(url, 'GET', header, {}).then(function(res) {
                var data = JSON.parse(res[0]).value;

                // kintoneへファイルをアップロード
                return self.uploadFileToKintone(messageId, data, 0, [], accessToken);
            });
        },

        // kintoneへファイルをアップロード
        uploadFileToKintone: function(messageId, attachData, index, attachDataArr, accessToken) {
            var self = this;
            var attachId = attachData[index].id;
            var url = 'https://graph.microsoft.com/v1.0/me/messages/' + messageId + '/attachments/' + attachId;
            var header = {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            };

            // 添付ファイル情報を取得
            return kintone.proxy(url, 'GET', header, {}).then(function(attachRes) {
                var data = JSON.parse(attachRes[0]);
                var param = {
                    fileName: data.name,
                    blob: outlookAPI.convertBase64AttachmentToBlob(data.contentBytes, data.contentType),
                    isGuest: false
                };

                // kintoneへファイルをアップロード
                return kintoneUtility.rest.uploadFile(param).then(function(resp) {
                    var fileKey = {};
                    fileKey['fileKey'] = resp.fileKey;
                    attachDataArr.push(fileKey);

                    if (index + 1 < attachData.length) {
                        return self.uploadFileToKintone(messageId, attachData, index + 1, attachDataArr);
                    }
                    return attachDataArr;
                });
            });
        },

        getKintoneAttach: function(attaches) {
            // 添付ファイル分
            var outlookAttachements = [];
            for (var i = 0; i < attaches.length; i++) {
                // kintoneからファイルをダウンロード
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
                        'contentBytes': outlookAPI.convertArrayBufferToBase64(this.response)
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
        decodeAttachment: function(stringEncoded) {
            return atob(stringEncoded.replace(/-/g, '+').replace(/_/g, '/'));
        },
        // base64データをBlobデータに変換
        convertBase64AttachmentToBlob: function(base64String, contentType) {
            var binary = outlookAPI.decodeAttachment(base64String),
                len = binary.length,
                arrBuffer = new ArrayBuffer(len),
                fileOutput = new Uint8Array(arrBuffer);
            for (var i = 0; i < len; i++) {
                fileOutput[i] = binary.charCodeAt(i);
            }
            var blob = new Blob([arrBuffer], {
                type: (contentType || 'octet/stream') + ';charset=utf-8;'
            });
            return blob;
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

        sendMailInit: function(kinRec) {
            var self = this;
            // Confirm whether to execute
            swal({
                title: kintoneMailService.setting.i18n.message.info.confirmSend,
                type: 'warning',
                confirmButtonColor: '#DD6B55',
                confirmButtonText: kintoneMailService.setting.i18n.button.sendExec,
                cancelButtonText: kintoneMailService.setting.i18n.button.cancelExec,
                showCancelButton: 'true',
                allowOutsideClick: false
            }).then(function(isConfirm) {
                if (isConfirm) {
                    self.sendMail(kinRec);
                }
            }, function(dismiss) {
                KC.ui.loading.hide();
            });
        },

        // メール送信
        sendMail: function(kintoneData) {

            KC.ui.loading.show();
            var accessToken;
            if (kintoneMailService.isExpireAccessToken()) {
                accessToken = storage.getItem(SESSION_KEY_TO_ACCESS_TOKEN);
            } else {
                return;
            }

            var sendParam = {};

            // 件名
            sendParam.subject = kintoneData[SUBJECT_FIELD_CODE].value;
            // 本文
            sendParam.body = {
                'contentType': 'html',
                'content': kintoneData[CONTENT_FIELD_CODE].value
            };

            // To
            if (kintoneData[TO_FIELD_CODE].value) {
                var toRecipentsArr = [];
                kintoneData[TO_FIELD_CODE].value.replace(/\s/g, '').split(',').map(function(email) {
                    if (!email) {
                        return;
                    }
                    toRecipentsArr.push({
                        'emailAddress': {
                            'address': email
                        }
                    });
                });
                sendParam.toRecipients = toRecipentsArr;
            }

            // Cc
            if (kintoneData[CC_FIELD_CODE].value) {
                var ccRecipentsArr = [];
                kintoneData[CC_FIELD_CODE].value.replace(/\s/g, '').split(',').map(function(email) {
                    if (!email) {
                        return;
                    }
                    ccRecipentsArr.push({
                        'emailAddress': {
                            'address': email
                        }
                    });
                });
                sendParam.ccRecipients = ccRecipentsArr;
            }

            // Bcc
            if (kintoneData[BCC_FIELD_CODE].value) {
                var bccRecipentsArr = [];
                kintoneData[BCC_FIELD_CODE].value.replace(/\s/g, '').split(',').map(function(email) {
                    if (!email) {
                        return;
                    }
                    bccRecipentsArr.push({
                        'emailAddress': {
                            'address': email
                        }
                    });
                });
                sendParam.bccRecipients = bccRecipentsArr;
            }
            return outlookAPI.getKintoneAttach(kintoneData[ATTACH_FILE_FIELD_CODE].value).then(function(files) {
                sendParam.Attachments = files;
                return outlookAPI.sendOutlook(sendParam, accessToken);
            });


        },

        // Outlookへ登録
        sendOutlook: function(sendParam, accessToken) {

            var header = {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            };

            var message = {};
            message.message = sendParam;
            message.saveToSentItems = true;
            kintone.proxy(MAIL_SEND_URL, 'POST', header, message).then(function(respdata) {
                var responeDataJson = window.JSON.parse(!respdata[0] ? '{}' : respdata[0]);
                if (typeof responeDataJson.error !== 'undefined') {
                    swal({
                        title: 'Error!',
                        type: 'error',
                        text: kintoneMailService.setting.i18n.message.error.sendFailure,
                        allowOutsideClick: false
                    });
                } else {
                    swal({
                        title: 'SUCCESS!',
                        type: 'success',
                        text: kintoneMailService.setting.i18n.message.success.sendExec,
                        allowOutsideClick: false
                    });
                }
                KC.ui.loading.hide();
            }).catch(function(error) {
                swal({
                    title: 'Error!',
                    type: 'error',
                    text: kintoneMailService.setting.i18n.message.error.sendFailure,
                    allowOutsideClick: false
                });
                KC.ui.loading.hide();
            });
        }
    };

    // レコード一覧画面の表示時
    kintone.events.on('app.record.index.show', function(event) {

        kintoneMailService.init();

        /* create kintone ui */
        kintoneMailService.uiCreate(kintone.app.getHeaderSpaceElement());

        // 初期処理
        outlookAPI.init();

        // Singinボタン押下時
        $('#kintoneCustomizeBtnSignInOutlook').on('click', function() {
            outlookAPI.signIn();
        });

        // Singoutボタン押下時
        $('#kintoneCustomizeBtnSignOut').on('click', function() {
            outlookAPI.signOut();
        });

        // GET MAILボタン押下時
        $('#kintoneCustomizeBtnGetMail').on('click', function() {
            outlookAPI.getMail();
        });
    });


    // レコード詳細画面の表示時
    kintone.events.on('app.record.detail.show', function(event) {
        var record = event.record;

        kintoneMailService.init();

        /* create kintone ui */
        kintoneMailService.uicreateForDetail();

        // SEND MAILボタン押下時
        $('#kintoneCustomizeBtnSendMail').on('click', function() {
            outlookAPI.sendMailInit(record);
        });
    });

    // レコード作成画面の表示時
    kintone.events.on('app.record.create.show', function(event) {
        var record = event.record;
        kintone.app.record.setFieldShown(MESSAGE_ID_FIELD_CODE, false);
        kintone.app.record.setFieldShown(MAIL_ACCOUNT_FIELD_CODE, false);
        record[FROM_FIELD_CODE]['disabled'] = true;
        record[FROM_FIELD_CODE]['value'] = storage.getItem(SIGN_USER_MAILACCOUNT);
        return event;
    });

    // レコード編集画面の表示時
    kintone.events.on('app.record.edit.show', function(event) {
        var record = event.record;
        kintone.app.record.setFieldShown(MESSAGE_ID_FIELD_CODE, false);
        kintone.app.record.setFieldShown(MAIL_ACCOUNT_FIELD_CODE, false);
        record[FROM_FIELD_CODE]['disabled'] = true;
        return event;
    });

})(jQuery);
