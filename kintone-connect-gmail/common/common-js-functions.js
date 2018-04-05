/**!
 * JSCustomize on kintone
 * Common functions
 * Copyright (c) 2017 Cybozu
 *
 * Licensed under the MIT License
 */
(function() {
    'use strict';
    window.kintoneCustomize = {
        setting: {
            element: {
                style: {
                    spinner: '.kintoneCustomizeloading{position: fixed; width: 100%; height:100%;' +
                        'top: 0; left:0; z-index:1000; background:rgba(204, 204, 204, 0.3)}' +
                        '.kintoneCustomizeloading:before{position: fixed; top: calc(50% - 25px);' +
                        'content: "";left: calc(50% - 25px);' +
                        'border:8px solid #f3f3f3;border-radius:50%;border-top:8px solid #3498db;width:50px;' +
                        'height:50px;-webkit-animation:spin .8s linear infinite; animation:spin .8s linear infinite}' +
                        '@-webkit-keyframes ' +
                        'spin{0%{-webkit-transform:rotate(0)}100%{-webkit-transform:rotate(360deg)}}' +
                        '@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}'
                }
            },
            apiUrl: {
                app: '/k/v1/app',
                form: '/k/v1/app/form/fields',
                layout: '/k/v1/app/form/layout',
                record: '/k/v1/record',
                records: '/k/v1/records',
                user: '/v1/users',
                userGroup: '/v1/user/groups',
                userOrganization: '/v1/user/organizations',
                file: '/k/v1/file.json?fileKey=',
                status: '/k/v1/record/status',
                statusApp: '/k/v1/app/status'
            },
            fieldSupport: {
                makePrefix: ['__ID__', 'SINGLE_LINE_TEXT', 'DROP_DOWN']
            },
            message: {
                requestNotAvailable: 'Error occurred when retrieving data, please try again!'
            }
        },
        data: {
            user: {
                code: kintone.getLoginUser().code,
                group: null
            }
        },
        preload: function() {
            this.ui.addStyleToHead(this.setting.element.style.spinner);
        },
        fnc: {
            app: {}
        },
        kintoneListenEvent: function(eventsName, callbackFunction, self) {
            kintone.events.on(eventsName, function(event) {
                return (self && self[callbackFunction]) ? self[callbackFunction](event) : callbackFunction(event);
            });
        },
        disableFields: function(appName, record) {
            try {
                var hasFieldCode = this.setting.app[appName].fieldCode.disabled.length > 0;
                if (hasFieldCode) {
                    this.setting.app[appName].fieldCode.disabled.forEach(function(fieldKey) {
                        record[this.setting.app[appName].fieldCode[fieldKey]].disabled = true;
                    }, this);
                }
                return record;
            } catch (error) {
                this.showError(error);
            }
        },
        record: function(recordData) {
            var self = this;
            return {
                recordData: recordData,
                getStringByPrefix: function(prefix) {
                    var prefixReplaced = prefix;
                    for (var fieldCode in this.recordData) {
                        if (!this.recordData.hasOwnProperty(fieldCode)) {
                            continue;
                        }
                        if (self.setting.fieldSupport.makePrefix.indexOf(this.recordData[fieldCode].type) === -1) {
                            prefixReplaced =
                                prefixReplaced.replace('{{' + fieldCode + '}}', '_' + fieldCode.toUpperCase() + '_');
                        } else {
                            prefixReplaced =
                                prefixReplaced.replace('{{' + fieldCode + '}}', this.recordData[fieldCode].value);
                        }
                    }
                    prefixReplaced = self.getStringByPrefixDate(prefixReplaced, new Date());
                    return prefixReplaced;
                },
                getValueByType: function(type) {
                    var typeUppercase = type.toUpperCase();
                    for (var fieldCode in this.recordData) {
                        if (!this.recordData.hasOwnProperty(fieldCode)) {
                            continue;
                        }
                        if (this.recordData[fieldCode].type === typeUppercase) {
                            return this.recordData[fieldCode].value;
                        }
                    }
                    return null;
                },
                checkFieldExists: function(fieldCode) {
                    var result = {
                        status: true,
                        invalidField: ''
                    };
                    if (typeof fieldCode === 'string') {
                        result.status = this.recordData.hasOwnProperty(fieldCode);
                        result.invalidField = fieldCode;
                    } else if (fieldCode.constructor === Array) {
                        fieldCode.forEach(function(fieldCodeItem) {
                            if (!this.recordData.hasOwnProperty(fieldCodeItem)) {
                                result.status = false;
                                result.invalidField += ',' + fieldCodeItem;
                            }
                        }, this);
                    } else {
                        result.status = false;
                    }
                    return result;
                }
            };
        },
        records: function(records) {
            return {
                recordsData: records,
                getIds: function(event) {
                    var ids = [];
                    this.recordsData.forEach(function(record) {
                        ids.push(parseInt(record.$id.value, 10));
                    }, this);
                    return ids;
                }
            };
        },
        getUserGroup: function(userCode) {
            var self = this;
            return this.apiRequest(
                self.setting.apiUrl.userGroup, 'GET', {
                    code: userCode
                }).then(function(resp) {
                var groupArray = [];
                resp.groups.forEach(function(groupItem) {
                    groupArray.push(groupItem.code);
                });
                return groupArray;
            });
        },
        apiRequestWithProxy: function(requestType, method, params, token) {
            var self = this;
            var headerProxy = {
                'X-Cybozu-API-Token': token
            };
            if (method !== 'GET' && method !== 'DELETE') {
                headerProxy['Content-Type'] = 'application/json';
            }
            var url = this.setting.apiUrl[requestType] || '/v1/apis',
                appUrl =
                (method !== 'GET' && method !== 'DELETE') ? kintone.api.url(url) : kintone.api.urlForGet(url, params);
            return new kintone.Promise(function(resolve, reject) {
                kintone.proxy(appUrl, method, headerProxy, params, function(respdata) {
                    var responeDataJson = window.JSON.parse(respdata);
                    if (typeof responeDataJson.code === 'string') {
                        reject(responeDataJson);
                    } else {
                        resolve(responeDataJson);
                    }
                }, function(error) {
                    reject(error);
                });
            }).then({}, function(error) {
                self.showError(error);
                return false;
            });
        },
        apiRequest: function(requestType, method, params) {
            var self = this;
            var url = this.setting.apiUrl[requestType] || '/k/v1/apis';
            return new kintone.Promise(function(resolve, reject) {
                kintone.api(kintone.api.url(url, true), method, params, function(respdata) {
                    resolve(respdata);
                }, function(error) {
                    reject(error);
                });
            }).then({}, function(error) {
                self.showError(error);
                return false;
            });
        },
        /**
         * Get file from url
         * @param {string} url the URL of file
         * @param {string} type the type of file
         * @returns {blob|error} return blob or error object
         */
        getFile: function(url, type) {
            var self = this;
            return new kintone.Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                xhr.responseType = 'arraybuffer';
                xhr.onload = function() {
                    var arrayBufferView = new window.Uint8Array(this.response);
                    var blob = new Blob([arrayBufferView], {
                        'type': type + ';charset=utf-8;'
                    });
                    resolve(blob);
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
        formRequest: function(url, method, formData, headers) {
            return new kintone.Promise(function(resolve, reject) {
                var xhrRequest = new XMLHttpRequest();
                xhrRequest.open(method, url);
                if (typeof headers !== 'undefined' && headers.length > 0) {
                    headers.forEach(function(header) {
                        if (header.key && header.value) {
                            xhrRequest.setRequestHeader(header.key, header.value);
                        }
                    });
                }
                xhrRequest.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                xhrRequest.onload = function() {
                    if (xhrRequest.status === 200) {
                        resolve(this);
                    } else {
                        reject(xhrRequest);
                    }
                };
                xhrRequest.send(formData);
            });
        },
        getTimeUser: function() {
            var self = this;
            return this.getTimeServer().then(function(date) {
                if (!window.moment) {
                    return self.getDateString(new Date(date));
                }
                var dateWithTimezone = window.moment.tz(date, kintone.getLoginUser().timezone);
                return dateWithTimezone.format('YYYY-MM-DD');
            });
        },
        getTimeServer: function() {
            return kintone.proxy(kintone.api.urlForGet('/v1/app', {}), 'GET', {}, {})
                .then(function(args) {
                    return args[2].Date;
                });
        },
        getStringByPrefixDate: function(prefixDate, date) {
            var resultString = prefixDate,
                yyyy = date.getFullYear().toString(),
                mm = (date.getMonth() + 1).toString(),
                dd = date.getDate().toString(),
                h = date.getHours().toString(),
                i = date.getMinutes().toString();
            resultString = resultString.replace(/{{yyyy}}|{{YYYY}}/g, yyyy);
            resultString = resultString.replace(/{{yy}}|{{YY}}/g, yyyy.substring(2));
            resultString = resultString.replace(/{{mm}}|{{MM}}/g, (mm[1] ? mm : '0' + mm[0]));
            resultString = resultString.replace(/{{dd}}|{{DD}}/g, (dd[1] ? dd : '0' + dd[0]));
            resultString = resultString.replace(/{{hh}}|{{HH}}/g, (h[1] ? h : '0' + h[0]));
            resultString = resultString.replace(/{{ii}}|{{II}}/g, (i[1] ? i : '0' + i[0]));
            return resultString;
        },
        getDateStringByFormat: function(formatString, date) {
            if (typeof date === 'undefined') {
                date = new Date();
            }
            var resultString = formatString,
                yyyy = date.getFullYear().toString(),
                mm = (date.getMonth() + 1).toString(),
                dd = date.getDate().toString(),
                h = date.getHours().toString(),
                i = date.getMinutes().toString();
            resultString = resultString.replace(/yyyy|YYYY/g, yyyy);
            resultString = resultString.replace(/yy|YY/g, yyyy.substring(2));
            resultString = resultString.replace(/mm|MM/g, (mm[1] ? mm : '0' + mm[0]));
            resultString = resultString.replace(/dd|DD/g, (dd[1] ? dd : '0' + dd[0]));
            resultString = resultString.replace(/hh|HH/g, (h[1] ? h : '0' + h[0]));
            resultString = resultString.replace(/ii|II/g, (i[1] ? i : '0' + i[0]));
            return resultString;
        },
        getDateString: function(datetime) {
            if (typeof datetime === 'undefined') {
                return '';
            }
            if (isNaN(datetime.getUTCFullYear()) ||
                isNaN(datetime.getUTCMonth()) ||
                isNaN(datetime.getUTCDate())) {
                return '';
            }
            var dateValue = datetime.getUTCFullYear() + '-';
            dateValue += (datetime.getUTCMonth() > 8) ?
                datetime.getUTCMonth() + 1 : '0' + (datetime.getUTCMonth() + 1);
            dateValue += '-' + datetime.getUTCDate();
            return dateValue;
        },
        filePath: function(filePathInput) {
            return {
                filePath: filePathInput,
                getExtention: function() {
                    return this.filePath.toString().split('.').reverse()[0];
                },
                getBasename: function(separateInput) {
                    var separate = (typeof separateInput === 'undefined') ? '/' : separateInput;
                    return this.filePath.toString().split(separate).reverse()[0];
                },
                getFileName: function() {
                    return this.getBasename().replace('.' + this.getExtention(), '');
                }
            };
        },
        ui: {
            element: function(inputElement) {
                var parent = inputElement;
                return {
                    append: function(element) {
                        try {
                            if (element.constructor === Array) {
                                element.forEach(function(el) {
                                    parent.appendChild(el);
                                });
                                return this;
                            }
                            parent.appendChild(element);
                            return this;
                        } catch (e) {
                            return this;
                        }
                    },
                    appendTo: function(element) {
                        try {
                            element.appendChild(parent);
                            parent = element;
                            return this;
                        } catch (e) {
                            return this;
                        }
                    },
                    prepend: function(element) {
                        try {
                            if (element.constructor === Array) {
                                element.forEach(function(el) {
                                    parent.insertBefore(el, parent.firstChild);
                                });
                                return this;
                            }
                            parent.insertBefore(element, parent.firstChild);
                            return this;
                        } catch (e) {
                            return this;
                        }
                    }
                };
            },
            elements: function(selector) {
                var elementArray = [];
                if (typeof selector === 'string') {
                    var elNodeList = document.querySelectorAll(selector);
                    elementArray = Array.prototype.slice.call(elNodeList);
                } else {
                    elementArray.push(selector);
                }
                return {
                    elArr: elementArray,
                    on: function(eventName, callbackFunction) {
                        this.each(function(el) {
                            el.addEventListener(eventName, callbackFunction);
                        });
                        return this;
                    },
                    each: function(callbackFunction) {
                        this.elArr.forEach(function(el, index) {
                            callbackFunction(el, index);
                        }, this);
                    },
                    data: function(dataKey, dataValue) {
                        var prefixKey = 'data-';
                        if (typeof dataValue === 'undefined') {
                            return this.elArr[0].getAttribute(prefixKey + dataKey);
                        }
                        try {
                            this.elArr.forEach(function(el) {
                                this.attr(prefixKey + dataKey, dataValue);
                            }, this);
                        } catch (e) {
                            return false;
                        }
                        return this;
                    },
                    attr: function(attrKey, attrValue) {
                        if (this.elArr.length === 0) {
                            return typeof attrValue !== 'undefined' ? this : null;
                        }
                        if (typeof attrValue !== 'undefined') {
                            this.elArr.forEach(function(el) {
                                el.setAttribute(attrKey, attrValue);
                            }, this);
                            return this;
                        }
                        return this.elArr[0].getAttribute(attrKey);
                    },
                    removeAttr: function(attrKey) {
                        this.attr();
                    },
                    val: function(value) {
                        if (this.elArr.length === 0) {
                            return typeof value !== 'undefined' ? this : null;
                        }
                        if (typeof value !== 'undefined') {
                            this.elArr.forEach(function(el) {
                                el.value = value;
                            }, this);
                            return this;
                        }
                        return this.elArr[0].value;
                    },
                    html: function(value) {
                        if (this.elArr.length === 0) {
                            return typeof value !== 'undefined' ? this : null;
                        }
                        if (typeof value !== 'undefined') {
                            this.elArr.forEach(function(el) {
                                el.innerHTML = value;
                            }, this);
                            return this;
                        }
                        return this.elArr[0].innerHTML;
                    },
                    focus: function() {
                        if (this.elArr.length === 0) {
                            return;
                        }
                        this.elArr[0].focus();
                    },
                    remove: function() {
                        if (this.elArr.length === 0) {
                            return;
                        }
                        this.elArr.forEach(function(el) {
                            try {
                                el.parentNode.removeChild(el);
                            } catch (e) {
                                //
                            }
                        }, this);
                    },
                    trigger: function(eventName) {
                        if (this.elArr.length === 0) {
                            return;
                        }
                        this.elArr.forEach(function(el) {
                            function createEvent() {
                                if (typeof Event === 'function') {
                                    return new Event(eventName, {
                                        'bubbles': true,
                                        'cancelable': true
                                    });
                                }
                                var event = document.createEvent('Event');
                                event.initEvent(eventName, true, true);

                                return event;
                            }
                            el.dispatchEvent(createEvent());
                        }, this);

                    },
                    addClass: function(className) {
                        try {
                            this.elArr.forEach(function(el) {
                                var classNameArr = el.className.split(' ');
                                if (classNameArr.indexOf(className) === -1) {
                                    classNameArr.push(className);
                                    el.className = classNameArr.join(' ').trim();
                                }
                            }, this);
                            return this;
                        } catch (e) {
                            return this;
                        }
                    },
                    removeClass: function(class_name) {
                        try {
                            if (!this.hasClass(class_name)) {
                                return this;
                            }
                            this.elArr.forEach(function(el) {
                                var classNameArr = el.className.split(' ');
                                classNameArr.splice(classNameArr.indexOf(class_name), 1);
                                el.className = classNameArr.join(' ');
                            }, this);

                            return this;
                        } catch (e) {
                            return this;
                        }
                    },
                    hasClass: function(class_name) {
                        if (typeof class_name === 'undefined') {
                            return false;
                        }
                        try {
                            var classNameArr = this.elArr[0].className.split(' ');
                            return classNameArr.indexOf(class_name) !== -1;
                        } catch (e) {
                            return false;
                        }
                    },
                    append: function(elements) {
                        try {
                            this.elArr.forEach(function(currentEl) {
                                if (elements.constructor === Array) {
                                    elements.forEach(function(el) {
                                        currentEl.appendChild(el.elArr ? el.elArr[0] || null : el);
                                    });
                                    return this;
                                }
                                currentEl.appendChild(elements.elArr ? elements.elArr[0] || null : elements);
                            }, this);
                            return this;
                        } catch (e) {
                            return this;
                        }
                    },
                    appendTo: function(elements) {
                        try {
                            this.elArr.forEach(function(currentEl) {
                                if (elements.constructor === Array) {
                                    elements.forEach(function(elChild) {
                                        var ele = elChild.elArr ? elChild.elArr[0] || null : elChild;
                                        ele.appendChild(currentEl);
                                    });
                                    return this;
                                }
                                var ele = elements.elArr ? elements.elArr[0] || null : elements;
                                ele.appendChild(currentEl);
                            }, this);
                            return this;
                        } catch (e) {
                            window.console.error(e);
                            return this;
                        }
                    },
                    prepend: function(element) {
                        try {
                            this.elArr.forEach(function(currentEl) {
                                if (element.constructor === Array) {
                                    element.forEach(function(el) {
                                        currentEl.insertBefore(el.elArr ? el.elArr[0] || null : el,
                                            currentEl.firstChild);
                                    });
                                    return this;
                                }
                                currentEl.insertBefore(element.elArr ? element.elArr[0] || null : element,
                                    currentEl.firstChild);
                            });
                            return this;
                        } catch (e) {
                            return this;
                        }
                    }
                };
            },
            /**
             * Create new button as HTMLDOM element
             * @param {object} setting Object {id String, style Css-String, text String}
             * @returns {HTMLDOM} HTMLDOM element
             */
            createButton: function(setting, lang) {
                if (document.getElementById(setting.id)) {
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
            addStyleToHead: function(css) {
                var head = document.head || document.getElementsByTagName('head')[0],
                    style = document.createElement('style');

                style.type = 'text/css';
                if (style.styleSheet) {
                    style.styleSheet.cssText = css;
                } else {
                    style.appendChild(document.createTextNode(css));
                }
                head.appendChild(style);
            },
            loading: {
                loading: null,
                show: function(status) {
                    var idLoading = 'kintoneCustomizeloading',
                        divSpinnerExists = document.getElementById(idLoading),
                        divSpinner = document.createElement('div');
                    if (this.loading && divSpinnerExists) {
                        return;
                    }
                    if (status === false) {
                        if (divSpinnerExists) {
                            divSpinnerExists.parentNode.removeChild(divSpinnerExists);
                        }
                        return;
                    }
                    divSpinner.className = idLoading;
                    divSpinner.id = idLoading;
                    document.body.appendChild(divSpinner);
                    this.loading = true;
                },
                hide: function() {
                    this.loading = false;
                    this.show(false);
                }
            },
            createMessageTemplate: function() {
                var messBox = document.createElement('div'),
                    messWrap = document.createElement('div'),
                    messHeader = document.createElement('header'),
                    messList = document.createElement('ul'),
                    messHeaderText = document.createElement('span'),
                    messHeaderButtonClose = document.createElement('span');

                messHeaderButtonClose.className = 'close';
                messHeaderButtonClose.addEventListener('click', function() {
                    messBox.className = 'hidden';
                });
                messBox.id = 'kintoneCustomizeMessage';
                messBox.className = 'hidden';
                this.element(messHeader).append([messHeaderText, messHeaderButtonClose]);
                this.element(messWrap).append([messHeader, messList]).appendTo(messBox);

                document.body.appendChild(messBox);
                return messBox;
            }
        },
        objectValueToArray: function(obj) {
            var result = [];
            for (var objKey in obj) {
                if (obj.hasOwnProperty(objKey)) {
                    result.push(obj[objKey]);
                }
            }
            return result;
        },
        objectMerge: function(obj, src) {
            Object.keys(src).forEach(function(key) {
                obj[key] = src[key];
            });
            return obj;
        },
        showError: function(e) {
            try {
                var err = e.code ? e : window.JSON.parse(e);
                window.console.error(err.code + '\n' + err.message);
                this.alertMessage(err.message + '\n' + err.code, 'error');
            } catch (error) {
                window.console.error(e);
            }
            this.ui.loading.hide();
        },
        alertMessage: function(message, type) {
            var IDMess = '#kintoneCustomizeMessage';
            var elementMess = document.querySelector(IDMess);
            if (elementMess) {
                this.ui.elements(elementMess).remove();
            }
            elementMess = this.ui.createMessageTemplate();
            // Set class
            switch (type) {
                case 'success':
                    elementMess.className = 'kintoneCustomizeMessageSuccess';
                    break;
                default:
                    elementMess.className = '';

            }
            var messageHeader = document.querySelector(IDMess + ' header>span'),
                messageList = document.querySelector(IDMess + ' ul');
            //Remove last message
            messageHeader.innerHTML = "";
            messageList.innerHTML = "";

            if (message.header) {
                messageHeader.innerHTML = message.header;
                if (message.messages) {
                    if (message.messages.length > 0) {
                        document.querySelector(IDMess + '>div').style.width = 'auto';
                    }
                    message.messages.forEach(function(messItem) {
                        var itemMessage = document.createElement('li');
                        itemMessage.innerHTML = messItem;
                        messageList.appendChild(itemMessage);
                    });
                }
                return;
            }
            var mess = document.createElement('li');
            mess.innerHTML = message;
            messageList.appendChild(mess);

            setTimeout(function() {
                elementMess.className = 'hidden';
            }, 10000);
        }
    };
    window.kintoneCustomize.preload();
})();
