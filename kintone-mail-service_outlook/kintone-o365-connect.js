jQuery.noConflict();
(function($) {
    'use strict';

    // common-js-functions.jsを読み込み
    var KC = window.kintoneCustomize;

    // Get value from grkin_schedule_common.js
    var SUBJECT_FIELD_CODE = window.kintoneO365Connect.kintone.fieldCode.subject;
    var CONTENT_FIELD_CODE = window.kintoneO365Connect.kintone.fieldCode.content;
    var FROM_FIELD_CODE = window.kintoneO365Connect.kintone.fieldCode.from;
    var TO_FIELD_CODE = window.kintoneO365Connect.kintone.fieldCode.to;
    var CC_FIELD_CODE = window.kintoneO365Connect.kintone.fieldCode.cc;
    var BCC_FIELD_CODE = window.kintoneO365Connect.kintone.fieldCode.bcc;
    var MESSAGE_ID_FIELD_CODE = window.kintoneO365Connect.kintone.fieldCode.messageId;
    var MAIL_ACCOUNT_FIELD_CODE = window.kintoneO365Connect.kintone.fieldCode.mailAccount;
    var ATTACH_FILE_FIELD_CODE = window.kintoneO365Connect.kintone.fieldCode.attachFile;
    var OUTLOOK_CLIENT_ID = window.kintoneO365Connect.outlook.clientId;

    // アクセストークン
    var access_token;
    var storage = window.sessionStorage;

    // button name
    var BUTTON_EXECUTE = '送信';
    var BUTTON_CANCEL = 'キャンセル';

    // info message
    var INFO_MESSAGE_SEND_MAIL_SUCCESS = 'メールを送信しました';
    var INFO_MESSAGE_EXECUTION_CONFIRM = 'メールを送信しますか';
    var INFO_MESSAGE_NO_MAIL_INBOX = '受信箱にメールがありません';

    // error message
    var ERROR_MESSAGE_SEND_MAIL_FAILURE = 'メールの送信に失敗しました。';
    var EEROR_SIGIN_FAILURE = 'サインインできませんでした。';
    var EEROR_GET_ACCESS_TOKEN = 'アクセストークンが取得できませんでした。';

    var kintoneMailService = {

        setting: {
            lang: 'ja',
            i18n: {},
            gAPI: {},
            ui: {
                buttons: {
                    signInOutlook: {
                        id: 'kintoneCustomizeBtnSignInOutlook',
                        text: 'signInOutlook'
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

        // UI生成(一覧画面用)
        uiCreate: function(kintoneHeaderSpace) {
            if (typeof kintoneHeaderSpace === 'undefined') {
                return;
            }
            var kintoneCustomizeOutlookHeader = document.createElement('div');

            this.data.ui.kintoneCustomizeOutlookHeaderSigned = document.createElement('div');
            this.data.ui.kintoneCustomizeOutlookHeaderNotSigned = document.createElement('div');
            this.data.ui.kintoneCustomizeOutlookUserInfo = document.createElement('div');

            this.data.ui.btnSignIn = KC.ui.createButton(this.setting.ui.buttons.signInOutlook);
            this.data.ui.btnSignOut = KC.ui.createButton(this.setting.ui.buttons.signOut);
            this.data.ui.btnGetmail = KC.ui.createButton(this.setting.ui.buttons.getMail);
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
            var kintoneDetailHeaderSpace = kintone.app.record.getHeaderMenuSpaceElement();
            kintoneDetailHeaderSpace.appendChild(KC.ui.createButton(this.setting.ui.buttons.sendMail));
        }
    };


    // outlook api用処理
    var outlookAPI = {

        // 定数値
        CONST: {
            CLIENT_ID: OUTLOOK_CLIENT_ID,
            GRAPH_API_SCOPES: ['https://graph.microsoft.com/mail.read'],
            ID_TOKEN: ''
        },
        userAgentApplication: null,

        // 初期処理
        init: function() {

            this.userAgentApplication = new Msal.UserAgentApplication(outlookAPI.CONST.CLIENT_ID, null, function(
                errorDes, token, error, tokenType) {});

            var user = this.userAgentApplication.getUser();
            if (!user) {
                kintoneMailService.data.ui.kintoneCustomizeOutlookHeaderNotSigned.style.display = 'inline-block';
                kintoneMailService.data.ui.kintoneCustomizeOutlookHeaderSigned.style.display = 'none';
            } else {
                kintoneMailService.data.ui.kintoneCustomizeOutlookHeaderNotSigned.style.display = 'none';
                kintoneMailService.data.ui.kintoneCustomizeOutlookHeaderSigned.style.display = 'inline-block';
                kintoneMailService.data.ui.kintoneCustomizeOutlookUserInfo.innerHTML = user.displayableId;
                kintoneMailService.data.mail.profile = user;
                kintoneMailService.data.mail.profile.emailAddress = user.displayableId;
                kintoneMailService.data.isLoginOutlook = true;
            }
        },

        // サインイン
        signIn: function() {
            KC.ui.loading.show();
            var self = this;
            self.userAgentApplication.loginPopup(['mail.read', 'mail.send']).then(function(id_token) {

                // signin successful
                self.CONST.ID_TOKEN = id_token;
                self.callGraphApi();
            }, function(error) {
                // handle error
                swal('Error!', EEROR_SIGIN_FAILURE, 'error');
                KC.ui.loading.hide();
            });
        },

        // サインアウト
        signOut: function() {
            this.userAgentApplication.logout();
        },

        // In order to call the Graph API, an access token needs to be acquired.
        callGraphApi: function() {
            var self = this;

            // Try to acquire the token used to query Graph API silently first:
            this.userAgentApplication.acquireTokenSilent(self.CONST.GRAPH_API_SCOPES).then(function(token) {

                var userInfo = self.userAgentApplication.getUser();

                // 「getMail」「signout」ボタンを表示
                kintoneMailService.data.ui.kintoneCustomizeOutlookHeaderNotSigned.style.display = 'none';
                kintoneMailService.data.ui.kintoneCustomizeOutlookHeaderSigned.style.display = 'inline-block';
                kintoneMailService.data.ui.kintoneCustomizeOutlookUserInfo.innerHTML = userInfo.displayableId;
                kintoneMailService.data.mail.profile = userInfo;
                kintoneMailService.data.mail.profile.emailAddress = userInfo.displayableId;
                kintoneMailService.data.isLoginOutlook = true;

                // セッションに入れておく
                storage.setItem('ACCESS_TOKEN', token);
                storage.setItem('SIGN_USER_MAILACCOUNT', userInfo.displayableId);

                KC.ui.loading.hide();

            }, function(error) {
                if (error) {
                    swal('Error!', EEROR_GET_ACCESS_TOKEN, 'error');
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

            // セッションからアクセストークン取得
            if (storage.getItem('ACCESS_TOKEN') !== '') {
                access_token = storage.getItem('ACCESS_TOKEN');
            } else {
                KC.ui.loading.hide();
                return;
            }

            var url = 'https://graph.microsoft.com/v1.0/me/MailFolders/Inbox/messages?$top=100';
            var header = {
                'Authorization': 'Bearer ' + access_token,
                'Content-Type': 'application/json'
            };

            // OutlookのINBOXからメール取得
            return kintone.proxy(url, 'GET', header, {}).then(function(res) {
                var data = JSON.parse(res[0]).value;

                // 受信箱にメールが存在しない場合
                if (data.length === 0) {
                    swal('Warning!', INFO_MESSAGE_NO_MAIL_INBOX, 'warning');
                    KC.ui.loading.hide();
                }

                // 取得したメールをkintoneへ登録
                return self.putMailToKintoneApp(0, data).catch(function(err) {
                    KC.ui.loading.hide();
                });
            }, function(err) {
                KC.ui.loading.hide();
            });
        },

        // 取得したメールをkintoneへ登録
        putMailToKintoneApp: function(index, data) {
            var self = this;

            return this.getMessageIDIndexIsNotRetrived(index, data).then(function(indexMessage) {

                if (indexMessage === null) {
                    return indexMessage;
                }
                // まだ未取得のメールを登録
                return self.addMailIntoKintone(data[indexMessage]).then(function(result) {
                    // Process next mail
                    if (indexMessage + 1 < data.length) {
                        return self.putMailToKintoneApp(indexMessage + 1, data);
                    }
                });
            }).then(function(resp) {
                window.location.reload();
                KC.ui.loading.hide();
            });
        },

        addMailIntoKintone: function(data) {
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
            var toRecipentsStr = '';
            for (var toIx = 0; toIx < toRecipents.length; toIx++) {
                if (toRecipents.length === 0 || toIx === toRecipents.length - 1) {
                    toRecipentsStr = toRecipentsStr + toRecipents[toIx].emailAddress.address;
                } else {
                    toRecipentsStr = toRecipentsStr + toRecipents[toIx].emailAddress.address + ',';
                }
            }
            kintoneRecord[TO_FIELD_CODE] = {
                value: toRecipentsStr || ''
            };

            // Cc
            var ccRecipents = data.ccRecipients;
            var ccRecipentsStr = '';
            for (var ccIx = 0; ccIx < ccRecipents.length; ccIx++) {
                if (ccRecipents.length === 0 || ccIx === ccRecipents.length - 1) {
                    ccRecipentsStr = ccRecipentsStr + ccRecipents[ccIx].emailAddress.address;
                } else {
                    ccRecipentsStr = ccRecipentsStr + ccRecipents[ccIx].emailAddress.address + ',';
                }
            }
            kintoneRecord[CC_FIELD_CODE] = {
                value: ccRecipentsStr || ''
            };

            // Bcc
            var bccRecipents = data.bccRecipients;
            var bccRecipentsStr = '';
            for (var bccIx = 0; bccIx < bccRecipents.length; bccIx++) {
                if (bccRecipents.length === 0 || bccIx === bccRecipents.length - 1) {
                    bccRecipentsStr = bccRecipentsStr + bccRecipents[bccIx].emailAddress.address;
                } else {
                    bccRecipentsStr = bccRecipentsStr + bccRecipents[bccIx].emailAddress.address + ',';
                }
            }
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
                return outlookAPI.getAttach(data.id).then(function(promiseArrayFiles) {
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

            return kintoneUtility.rest.postRecord(param).then(function(resp) {
            });
        },

        // 添付ファイル取得
        getAttach: function(messageId) {
            var self = this;
            var url = 'https://graph.microsoft.com/v1.0/me/messages/' + messageId + '/attachments';
            var header = {
                'Authorization': 'Bearer ' + access_token,
                'Content-Type': 'application/json'
            };

            // メールに添付されているファイルを取得
            return kintone.proxy(url, 'GET', header, {}).then(function(res) {
                var data = JSON.parse(res[0]).value;

                // kintoneへファイルをアップロード
                return self.uploadFileToKintone(messageId, data, 0, []);
            });
        },

        // kintoneへファイルをアップロード
        uploadFileToKintone: function(messageId, attachData, index, attachDataArr) {
            var self = this;
            var attachId = attachData[index].id;
            var url = 'https://graph.microsoft.com/v1.0/me/messages/' + messageId + '/attachments/' + attachId;
            var header = {
                'Authorization': 'Bearer ' + access_token,
                'Content-Type': 'application/json'
            };

            // 添付ファイル情報を取得
            return kintone.proxy(url, 'GET', header, {}).then(function(attachRes) {
                var data = JSON.parse(attachRes[0]);
                var param = {
                    fileName: data.name,
                    blob: outlookAPI.base64AttachmentToBlob(data.contentBytes, data.contentType),
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
                        'contentBytes': outlookAPI.arraybufferToBase64(this.response)
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
        attachmentDecode: function(stringEncoded) {
            return atob(stringEncoded.replace(/-/g, '+').replace(/_/g, '/'));
        },
        // base64データをBlobデータに変換
        base64AttachmentToBlob: function(base64String, contentType) {
            var binary = outlookAPI.attachmentDecode(base64String),
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
        arraybufferToBase64: function(arraybuffer) {
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
                title: INFO_MESSAGE_EXECUTION_CONFIRM,
                type: 'warning',
                confirmButtonColor: '#DD6B55',
                confirmButtonText: BUTTON_EXECUTE,
                cancelButtonText: BUTTON_CANCEL,
                showCancelButton: 'true'

            }).then(function(isConfirm) {
                if (isConfirm) {
                    self.sendMail(kinRec);
                }
            });
        },

        // メール送信
        sendMail: function(kintoneData) {

            KC.ui.loading.show();

            if (storage.getItem('ACCESS_TOKEN') !== '') {
                access_token = storage.getItem('ACCESS_TOKEN');
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
                kintoneData[TO_FIELD_CODE].value.split(',').map(function(email) {
                    if (!email) {
                        return;
                    }
                    toRecipentsArr.push({
                        'emailAddress': {
                            'address': email.trim()
                        }
                    });
                });
                sendParam.toRecipients = toRecipentsArr;
            }

            // Cc
            if (kintoneData[CC_FIELD_CODE].value) {
                var ccRecipentsArr = [];
                kintoneData[CC_FIELD_CODE].value.split(',').map(function(email) {
                    if (!email) {
                        return;
                    }
                    ccRecipentsArr.push({
                        'emailAddress': {
                            'address': email.trim()
                        }
                    });
                });
                sendParam.ccRecipients = ccRecipentsArr;
            }

            // Bcc
            if (kintoneData[BCC_FIELD_CODE].value) {
                var bccRecipentsArr = [];
                kintoneData[BCC_FIELD_CODE].value.split(',').map(function(email) {
                    if (!email) {
                        return;
                    }
                    bccRecipentsArr.push({
                        'emailAddress': {
                            'address': email.trim()
                        }
                    });
                });
                sendParam.bccRecipients = bccRecipentsArr;
            }
            return outlookAPI.getKintoneAttach(kintoneData[ATTACH_FILE_FIELD_CODE].value).then(function(files) {
                sendParam.Attachments = files;
                return outlookAPI.sendOutlook(sendParam);
            });


        },

        // Outlookへ登録
        sendOutlook: function(sendParam) {

            var url = 'https://graph.microsoft.com/v1.0/me/sendmail';
            var header = {
                'Authorization': 'Bearer ' + access_token,
                'Content-Type': 'application/json'
            };

            var message = {};
            message.message = sendParam;
            message.saveToSentItems = true;
            kintone.proxy(url, 'POST', header, message).then(function(respdata) {
                var responeDataJson = window.JSON.parse(!respdata[0] ? '{}' : respdata[0]);
                if (typeof responeDataJson.error !== 'undefined') {
                    swal('ERROR!', responeDataJson.error.message, 'error');
                } else {
                    swal('SUCCESS!', INFO_MESSAGE_SEND_MAIL_SUCCESS, 'success');
                }
                KC.ui.loading.hide();
            }).catch(function(error) {
                swal('Error!', ERROR_MESSAGE_SEND_MAIL_FAILURE, 'error');
                KC.ui.loading.hide();
            });
        }
    };

    // レコード一覧画面の表示時
    kintone.events.on('app.record.index.show', function(event) {

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
        record['from']['disabled'] = true;
        record['from']['value'] = storage.getItem('SIGN_USER_MAILACCOUNT');
        return event;
    });

    // レコード編集画面の表示時
    kintone.events.on('app.record.edit.show', function(event) {
        var record = event.record;
        record['from']['disabled'] = true;
        return event;
    });

})(jQuery);
