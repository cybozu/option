jQuery.noConflict();

(function($, PLUGIN_ID) {
    'use strict';

    var Msg = {
        en: {
            TableHeader: [
                {
                    title: 'Calculation target field',
                    description: 'Select items to calculate.<br>'
                                + 'You can select drop-down items, radio button items, check box items'
                                + ' or multi-choice items.'
                },
                {
                    title: 'Calculation method',
                    description: 'Select calculation method:<br>'
                                + 'COUNT: Number of values<br>'
                                + 'SUM: Sum of values<br>'
                                + 'AVERAGE: Average value'
                },
                {
                    title: 'Calculation word',
                    description: 'Enter the string to calculate.<br>'
                            + '(Only when you set the calculation method to COUNT)'
                },
                {
                    title: 'Calculation result field',
                    description: 'Show the calculated value. <br>'
                                + 'Select a number item.'
                }
            ],
            error: {
                failedToGetFormFieldsApi: 'Failed to get fields from the Form Setting. Please reload.',
                maximumRow: 'The maximum rows of a table is 20.',
                required: 'Required.',
                overLappedField: 'The field is overlapped.',
                errorOccur: 'Error'
            },
            button: {
                saveBtn: 'Save',
                cancelBtn: 'Cancel'
            },
            multipleSelect: {
                selectedItem: '%%number%% items selected'
            }
        },
        ja: {
            TableHeader: [
                {
                    title: '集計対象フィールド',
                    description: '集計対象となる項目を選択してください。 <br>'
                                + 'ドロップダウン, ラジオボタン, チェックボックス <br>'
                                + '複数選択タイプの項目が選択できます。'
                },
                {
                    title: '集計方法',
                    description: '集計方法を選択してください。<br>'
                                + 'COUNT: 値の数<br>'
                                + 'SUM: 値の和 <br>'
                                + 'AVERAGE: 値の平均'
                },
                {
                    title: '集計ワード',
                    description: '集計を行う文字列を'
                            + '入力してください。<br>'
                            + '(集計方法がCOUNTの場合のみ)'
                },
                {
                    title: '集計結果フィールド',
                    description: '集計した値を表示する <br>'
                                + '数値項目を選択してください。'
                }
            ],
            error: {
                failedToGetFormFieldsApi: 'フォーム設定からフィールドの取得に失敗しました。再度読み込んでください。',
                maximumRow: '設定行は20行までです。',
                required: '必須です。',
                overLappedField: 'フィールドが重複しています。',
                errorOccur: 'エラー'
            },
            button: {
                saveBtn: '保存する',
                cancelBtn: 'キャンセル'
            },
            multipleSelect: {
                selectedItem: '選択中 %%number%% 件'
            }
        },
        zh: {}
    };

    function getLanguage(language) {
        switch (language) {
            case 'ja':
                return 'ja';
            case 'en':
                return 'en';
            // case 'zh':
            //     return 'zh';
            default:
                return 'en';
        }
    }

    var loginInfo = kintone.getLoginUser();
    var lang = getLanguage(loginInfo.language);
    var table = null;

    var $containerEl = null;

    var KintoneUI = {
        classForControl: {
            alert: 'kintoneplugin-alert',
            rowAddBtn: 'kintoneplugin-button-add-row-image',
            rowRemovwBtn: 'kintoneplugin-button-remove-row-image',
            primaryBtn: 'kintoneplugin-button-dialog-ok',
            normalBtn: 'kintoneplugin-button-dialog-cancel',
            itemListDropdown: 'kintoneplugin-dropdown-list',
            itemDropdown: 'kintoneplugin-dropdown-list-item',
            selectedItemDropdown: 'kintoneplugin-dropdown-list-item-selected',
            dropdowm: 'kintoneplugin-dropdown'

        },
        Table: function(settings) {
            this.settings = {
                numCell: 2,
                headerContents: [],
                rowContents: [],
                rowDefaulValues: [],
                rowList: [],
                lastRowIndex: 0
            };

            this.settings = $.extend({}, this.settings, settings);
            this.constructor.prototype.template = {
                headerCell: '<div class="kintoneplugin-div-table-th">'
                        + '    <div class="title"></div>'
                        + '    <div class="description"></div>'
                        + '</div>',
                headerRow: '<div class="kintoneplugin-div-table-row"></div>',
                container: '<div class="kintoneplugin-div-table"> '
                + '	<div class="kintoneplugin-div-table-thead"></div> '
                + '	<div class="kintoneplugin-div-table-tbody"></div> '
                + '</div> '
            };

            this.constructor.prototype.render = function() {
                this.$el = $(this.template.container);
                this.catchElement();
                this.renderTable();
                return this.$el;
            };

            this.constructor.prototype.createHeaderRowEl = function() {
                var self = this;
                var $headerRowEl = $(this.template.headerRow);
                Msg[lang].TableHeader.forEach(function(headerInfo, i) {
                    var $headerCellEl = $(self.template.headerCell);
                    $headerCellEl.find('.title').text(headerInfo.title);
                    $headerCellEl.find('.description').html(headerInfo.description);
                    $headerRowEl.append($headerCellEl);
                    if (i === 0 || i === 3) {
                        $headerCellEl.find('.title').append('<span class="kintoneplugin-require">*</span>');
                    }
                });
                return $headerRowEl;
            };
            this.constructor.prototype.renderTable = function() {
                var $headerRowEl = this.createHeaderRowEl();
                this.$header.append($headerRowEl);
                this.addRow();
            };

            this.constructor.prototype.createRow = function(rowDefaulValue) {
                this.settings.lastRowIndex++;
                var row = new KintoneUI.TableRow(this.settings, rowDefaulValue);
                var rowContent = {
                    rowId: this.settings.lastRowIndex,
                    Control: row
                };
                return rowContent;
            };

            this.constructor.prototype.addRow = function() {
                var numRow = this.settings.rowDefaulValues.length > 0 ? this.settings.rowDefaulValues.length : 1;
                for (var i = 0; i < numRow; i++) {
                    var row = this.createRow(this.settings.rowDefaulValues[i]);
                    this.settings.rowList.push(row);
                    this.$body.append(row.Control.render());
                    this.handleTrigger(row.Control);
                }
                this.toggleBtnRemove();
            };
            this.constructor.prototype.getRows = function() {
                return this.settings.rowList;
            };
            this.constructor.prototype.catchElement = function() {
                this.$header = this.$el.find('.kintoneplugin-div-table-thead');
                this.$body = this.$el.find('.kintoneplugin-div-table-tbody');
            };
            this.constructor.prototype.handleTrigger = function(row) {
                this.handleRemoveRowTrigger(row);
                this.handleAddRowTrigger(row);
            };
            this.constructor.prototype.handleRemoveRowTrigger = function(row) {
                row.on('remove', function(even, rowId) {
                    this.settings.rowList = $.grep(this.settings.rowList, function(tmpRow) {
                        return tmpRow.rowId !== rowId;
                    });
                    this.toggleBtnRemove();
                }.bind(this));
            };
            this.constructor.prototype.toggleBtnRemove = function() {
                var flag = this.settings.rowList.length > 1;
                this.settings.rowList[0].Control.showBtnRemove(flag);
            };
            this.constructor.prototype.handleAddRowTrigger = function(row) {
                row.on('add', function(event, rowId) {
                    if (this.settings.rowList.length < 20) {
                        var newRow = this.createRow();
                        newRow.Control.render().insertAfter($(event.currentTarget));
                        this.handleTrigger(newRow.Control);

                        var index = $.map(this.settings.rowList, function(item, i) {
                            if (item.rowId === rowId) {
                                return i;
                            }
                        });
                        this.settings.rowList.splice(index + 1, 0, newRow);
                        this.toggleBtnRemove();
                    } else {
                        KintoneUI.NotifyPopup.showPopup(Msg[lang].error.maximumRow);
                    }
                }.bind(this));
            };
            this.constructor.prototype.onColumn = function(name, columnIndex, callback) {
                this.$el.on(name, function() {
                    $.each(this.settings.rowList, function(i) {
                        this.settings.rowList[i].Control.handleCellValueChange(name, columnIndex, callback);
                    }.bind(this));
                }.bind(this));
            };
        },
        TableRow: function(settings, rowDefaulValue) {
            this.settings = {
                numCell: 1,
                controlList: []
            };
            this.settings = $.extend({}, this.settings, settings);
            this.constructor.prototype.template = {
                container: '<div class="kintoneplugin-div-table-row"> '
                + '<div class="table-td-operation">'
                + '		<button type="button" class="' + KintoneUI.classForControl.rowAddBtn
                + '" title="Add row"></button>'
                + '		<button type="button" class="' + KintoneUI.classForControl.rowRemovwBtn
                + '" title="Delete this row"></button>'
                + '	</div> '
                + '	</div> '
            };
            this.constructor.prototype.render = function() {
                this.$el = $(this.template.container);
                this.catchElements();
                this.renderRow();
                this.bindEvents();
                return this.$el;
            };
            this.constructor.prototype.renderRow = function() {
                for (var i = 0; i < this.settings.numCell; i++) {
                    $('<div class="kintoneplugin-div-table-td"></div>').insertBefore(this.$tdOperation);
                }
                this.setControls(rowDefaulValue);
                this.handleAfterRowRender(this);
            };
            this.constructor.prototype.handleAfterRowRender = function(row) {
                var methodFieldValue = row.getControls()[1].getSelectedData().value;
                var disabled = methodFieldValue !== 'count';
                this.getControls()[2].setDisabled(disabled);
            };
            this.constructor.prototype.setControls = function(rowDefaulVal) {
                var self = this;
                var $cell = this.$el.find('.kintoneplugin-div-table-td');
                $cell.each(function(i) {
                    var content = self.settings.rowContents[i];
                    if (content) {
                        var initData = rowDefaulVal ? $.extend({}, content.data, rowDefaulVal[i]) : content.data;
                        var control = new content.Control(JSON.parse(JSON.stringify(initData)));
                        $cell.eq(i).append(control.render());
                        self.settings.controlList.push(control);
                    }
                });
            };
            this.constructor.prototype.showBtnRemove = function(flag) {
                var display = flag ? 'inline' : 'none';
                this.$removeBtn.css('display', display);
            };
            this.constructor.prototype.catchElements = function() {
                this.$tdOperation = this.$el.find('.table-td-operation');
                this.$removeBtn = this.$tdOperation.find('.kintoneplugin-button-remove-row-image');
                this.$addBtn = this.$tdOperation.find('.kintoneplugin-button-add-row-image');
            };
            this.constructor.prototype.bindEvents = function() {
                this.triggerRemoveRow();
                this.triggerAddRow();
            };
            this.constructor.prototype.triggerRemoveRow = function() {
                var self = this;
                this.$removeBtn.on('click', function() {
                    self.$el.trigger('remove', self.settings.lastRowIndex);
                    self.$el.remove();
                });
            };
            this.constructor.prototype.triggerAddRow = function() {
                var self = this;
                this.$addBtn.on('click', function() {
                    self.$el.trigger('add', self.settings.lastRowIndex);
                });
            };
            this.constructor.prototype.on = function(name, callback) {
                this.$el.on(name, callback);
            };
            this.constructor.prototype.handleCellValueChange = function(name, columnIndex, callback) {
                var colunm = this.$el.find('.kintoneplugin-div-table-td')[columnIndex];
                $(colunm).on('click', function() {
                    callback(this);
                }.bind(this));
            };
            this.constructor.prototype.getControls = function() {
                return this.settings.controlList;
            };
        },
        NotifyPopup: {
            control: {
                popup: null
            },
            template: '<div class="customization-notify error">'
            + '    <div class="notify-title"></div>'
            + '    <div class= "close-button">'
            + '        <div class="close-button-icon">'
            + '            <div class="icon-1"><div class="icon-2"></div></div>'
            + '        </div>'
            + '    </div>'
            + '</div>',
            createPopup: function() {
                this.control.popup = $(this.template);
                $('body').append(this.control.popup[0]);
                this.bindEvent();

                return this.control.popup;
            },
            showPopup: function(message) {
                this.control.popup.find('.notify-title').html(message);

                var popupWidth = this.control.popup.width();
                this.control.popup.css({ left: '-' + popupWidth / 2 + 'px' });

                this.control.popup.addClass('notify-slidedown');
            },
            hidePopup: function() {
                this.control.popup.removeClass('notify-slidedown');
            },
            bindEvent: function() {
                this.control.popup.click(function() {
                    this.hidePopup();
                }.bind(this));
            }
        },
        MultipleSelect: function(settings) {
            this.settings = {
                doSortListItem: true,
                listItem: [],
                selectedItem: []
            };
            this.settings = $.extend({}, this.settings, settings);
            this.constructor.prototype.template = {
                container: '<div class="kintoneplugin-table-td-control">'
                + '    <div class="kintoneplugin-table-td-control-value">'
                + '      <div class="kintoneplugin-multiple-list totalization-fields">'
                + '        <div class="' + KintoneUI.classForControl.dropdowm + '">'
                + '          <div class="kintoneplugin-dropdown-selected">'
                + '            <span class="kintoneplugin-dropdown-selected-name"></span>'
                + '          </div>'
                + '        </div>'
                + '        <div class="' + KintoneUI.classForControl.itemListDropdown + '"></div>'
                + '      </div>'
                + '    </div>'
                + '  </div>',
                item: '<div class="kintoneplugin-dropdown-list-item"></div>'
            };
            this.constructor.prototype.render = function() {
                this.$el = $(this.template.container);
                this.catchElement();
                this.renderItemList();
                this.setSelectedValue(this.settings.selectedItem);
                this.bindEvent();
                this.getSelectedData();
                this.alert = new KintoneUI.Alert();
                return this.$el;
            };
            this.constructor.prototype.getSelectedData = function() {
                return this.settings.selectedItem;
            };
            this.constructor.prototype.setSelectedValue = function(data) {
                this.settings.selectedItem = data;

                var $listItem = this.$itemList.find('.kintoneplugin-dropdown-list-item');
                if ($listItem.hasClass(KintoneUI.classForControl.selectedItemDropdown)) {
                    $listItem.remove(KintoneUI.classForControl.selectedItemDropdown);
                }

                var self = this;
                var selectedItems = [];
                $.each(self.settings.selectedItem, function(i, val) {
                    var correctSelectedItem = false;
                    $listItem.each(function(index) {
                        if ($(this).attr('value') === self.settings.selectedItem[i].value) {
                            $(this).addClass(KintoneUI.classForControl.selectedItemDropdown);
                            correctSelectedItem = true;
                        }
                    });
                    if (!correctSelectedItem) {
                        selectedItems = $.grep(data, function(item, j) {
                            return item !== val;
                        });
                    }
                });
                self.settings.selectedItem = selectedItems.length !== 0 ? selectedItems : data;

                var numSelected = self.$el.find('.' + KintoneUI.classForControl.selectedItemDropdown).length;
                var multipleText = Msg[lang].multipleSelect.selectedItem;
                self.$el.find('.kintoneplugin-dropdown-selected-name').text(
                    multipleText.replace('%%number%%', numSelected)
                );
            };
            this.constructor.prototype.sortListItem = function(data) {
                this.settings.listItem.sort(function(a, b) {
                    return a.name.localeCompare(b.name);
                });
            };
            this.constructor.prototype.renderItemList = function() {
                var self = this;
                if (self.settings.doSortListItem) {
                    self.sortListItem();
                }

                $.each(self.settings.listItem, function(index, item) {
                    var $itemEl = $(self.template.item);

                    $itemEl.attr('value', item.value);
                    $itemEl.attr('subtable', item.subtableCode);
                    $itemEl.text(item.name);
                    self.$itemList.append($itemEl);
                });
            };
            this.constructor.prototype.catchElement = function() {
                this.$itemList = this.$el.find('.' + KintoneUI.classForControl.itemListDropdown);
            };
            this.constructor.prototype.bindEvent = function() {
                this.handleItemListToggle();
                this.handleItemClick();
            };
            this.constructor.prototype.handleItemClick = function() {
                var self = this;
                this.$el.on('click', '.kintoneplugin-dropdown-list-item', function(event) {
                    var $item = $(event.currentTarget);
                    var dataItem = {
                        name: $item.text(),
                        value: $item.attr('value'),
                        subtableCode: $item.attr('subtable')
                    };
                    if ($(this).hasClass(KintoneUI.classForControl.selectedItemDropdown)) {
                        $(this).removeClass(KintoneUI.classForControl.selectedItemDropdown);
                        for (var i = 0; i < self.settings.selectedItem.length; i++) {
                            if (self.settings.selectedItem[i].value === dataItem.value) {
                                self.settings.selectedItem.splice(i, 1);
                            }
                        }
                    } else {
                        self.settings.selectedItem.push(dataItem);
                        $(this).addClass(KintoneUI.classForControl.selectedItemDropdown);
                    }
                    var numSelected = self.$el.find('.' + KintoneUI.classForControl.selectedItemDropdown).length;
                    var multipleText = Msg[lang].multipleSelect.selectedItem;
                    self.$el.find('.kintoneplugin-dropdown-selected-name').text(
                        multipleText.replace('%%number%%', numSelected)
                    );
                });

            };
            this.constructor.prototype.handleItemListToggle = function() {
                var self = this;
                this.$el.on('click', '.' + KintoneUI.classForControl.dropdowm, function(event) {
                    var $iconArrow = $(this).find('.kintoneplugin-dropdown-selected');
                    self.$el.find('.' + KintoneUI.classForControl.itemListDropdown).slideToggle();
                    $iconArrow.toggleClass('expain');
                });
            };
            this.constructor.prototype.setError = function(message) {
                if (this.$el.find('.' + KintoneUI.classForControl.alert).length === 0) {
                    this.alert.render().insertAfter(this.$el.find('.kintoneplugin-table-td-control-value'));
                }
                this.alert.setText(message);
            };
            this.constructor.prototype.removeError = function() {
                this.$el.find('.' + KintoneUI.classForControl.alert).remove();
            };
        },
        Dropdown: function(settings) {
            this.settings = {
                doSortListItem: true,
                listItem: [],
                selectedItem: {
                    value: null,
                    name: null
                },
                defaultSelectedItem: {
                    value: null,
                    name: '-----'
                }
            };
            this.settings = $.extend({}, this.settings, settings);
            this.constructor.prototype.template = {
                container: '<div class="kintoneplugin-dropdown-container">'
                + '    <div class="kintoneplugin-dropdown-sub-container">'
                + '    <div class="kintoneplugin-dropdown-outer">'
                + '        <div class="kintoneplugin-dropdown">'
                + '            <div class="kintoneplugin-dropdown-selected">'
                + '                <span class="kintoneplugin-dropdown-selected-name"></span>'
                + '            </div>'
                + '        </div>'
                + '    </div>'
                + '        <div class="' + KintoneUI.classForControl.itemListDropdown + '"></div>'
                + '    </div>'
                + '</div>',
                item: '<div class="' + KintoneUI.classForControl.itemDropdown + '"></div>'
            };
            this.constructor.prototype.render = function() {
                this.$el = $(this.template.container);
                this.catchElement();
                this.renderItemList();
                this.setSelectedValue(this.settings.selectedItem);
                this.bindEvent();
                this.getSelectedData();
                this.alert = new KintoneUI.Alert();
                return this.$el;
            };
            this.constructor.prototype.getSelectedData = function() {
                return this.settings.selectedItem;
            };
            this.constructor.prototype.setSelectedValue = function(selectedItem) {
                var itemSelected = this.$el.find('.' + KintoneUI.classForControl.selectedItemDropdown);
                itemSelected.removeClass(KintoneUI.classForControl.selectedItemDropdown);

                var arrItem = [];
                if (selectedItem.value) {
                    this.$listOption.find('.' + KintoneUI.classForControl.itemDropdown).each(function(index, item) {
                        if (selectedItem.value === $(item).data('value')) {
                            arrItem.push($(item));
                            this.settings.selectedItem.value = selectedItem.value;
                            this.settings.selectedItem.name = selectedItem.name;
                        }
                    }.bind(this));
                }
                if (!arrItem[0]) {
                    var $selected = $(this.$el.find('.' + KintoneUI.classForControl.itemDropdown)[0]);
                    $selected.addClass(KintoneUI.classForControl.selectedItemDropdown);
                    this.settings.selectedItem.value = this.settings.defaultSelectedItem.value;
                    this.settings.selectedItem.name = this.settings.defaultSelectedItem.name;

                } else {
                    arrItem[0].addClass(KintoneUI.classForControl.selectedItemDropdown);
                }
                this.$select.text(this.settings.selectedItem.name);
            };
            this.constructor.prototype.sortListItem = function(data) {
                this.settings.listItem.sort(function(a, b) {
                    return a.name.localeCompare(b.name);
                });
            };
            this.constructor.prototype.renderItemList = function() {
                var self = this;
                var $itemList = this.$el.find('.' + KintoneUI.classForControl.itemListDropdown);
                if (!this.settings) {
                    return;
                }

                if (self.settings.doSortListItem) {
                    self.sortListItem();
                }

                $.each(this.settings.listItem, function(index, item) {
                    var $item = $(self.template.item);
                    $item.text(item.name);
                    $item.data('value', item.value);
                    $itemList.append($item);
                });
            };
            this.constructor.prototype.catchElement = function() {
                this.$select = this.$el.find('.kintoneplugin-dropdown-selected-name');
                this.$listOption = this.$el.find('.' + KintoneUI.classForControl.itemListDropdown);
            };
            this.constructor.prototype.bindEvent = function() {
                this.handleDropdownOuterClick();
                this.handleDropdownListClick();
                this.handleOutsideDropdownListClick();
            };
            this.constructor.prototype.handleDropdownOuterClick = function() {
                var self = this;
                this.$el.find('.kintoneplugin-dropdown-outer').click(function() {
                    self.$listOption.toggle();
                });
            };
            this.constructor.prototype.handleDropdownListClick = function() {
                var self = this;
                this.$listOption.on('click', '.' + KintoneUI.classForControl.itemDropdown, function() {
                    self.settings.selectedItem.name = $(this).text();
                    self.settings.selectedItem.value = $(this).data('value');
                    self.setSelectedValue(self.settings.selectedItem);
                    self.$listOption.toggle();
                });
            };
            this.constructor.prototype.handleOutsideDropdownListClick = function() {
                var self = this;
                $('body').on('click', function(event) {
                    var isClickOnDropdown = $(event.target).closest(self.$el).length > 0;
                    if (!isClickOnDropdown) {
                        self.$listOption.hide();
                    }
                });
            };
            this.constructor.prototype.setError = function(message) {
                if (this.$el.find('.' + KintoneUI.classForControl.alert).length === 0) {
                    this.alert.render().insertAfter(this.$el.find('.kintoneplugin-dropdown-sub-container'));
                }
                this.alert.setText(message);
            };
            this.constructor.prototype.removeError = function() {
                this.$el.find('.' + KintoneUI.classForControl.alert).remove();
            };
        },
        Text: function(settings) {
            this.settings = {
                initValue: ''
            };
            this.settings = $.extend({}, this.settings, settings);
            this.constructor.prototype.template = {
                container: '<div class="kintoneplugin-input-outer">'
                + ' <input class="kintoneplugin-input-text" type="text" />'
                + ' </div>'
            };
            this.constructor.prototype.render = function() {
                this.$el = $(this.template.container);
                this.catchElement();
                this.setValue(this.settings.initValue);
                this.alert = new KintoneUI.Alert();
                return this.$el;
            };
            this.constructor.prototype.catchElement = function() {
                this.$input = this.$el.find('input');
            };
            this.constructor.prototype.setValue = function(value) {
                this.$input.val(value);
                this.settings.initValue = value;
            };
            this.constructor.prototype.setDisabled = function(disabled) {
                var cursor = disabled ? 'not-allowed' : 'auto';
                var background = disabled ? '#E4E6E7' : '#ffffff';
                this.$input.prop('disabled', disabled);
                this.$input.css({
                    'background-color': background,
                    'cursor': cursor
                });
                if (disabled) {
                    this.$input.val('');
                }
            };
            this.constructor.prototype.getValue = function() {
                return this.$input.val();
            };
            this.constructor.prototype.setError = function(message) {
                if (this.$el.find('.' + KintoneUI.classForControl.alert).length === 0) {
                    this.alert.render().insertAfter(this.$input);
                }
                this.alert.setText(message);
            };
            this.constructor.prototype.removeError = function() {
                this.$el.find('.' + KintoneUI.classForControl.alert).remove();
            };
        },
        Alert: function(message) {
            this.constructor.prototype.template = {
                container: '<div class="' + KintoneUI.classForControl.alert + '"></div>'
            };
            this.constructor.prototype.render = function() {
                this.$el = $(this.template.container);
                this.setText(message);
                return this.$el;
            };
            this.constructor.prototype.setText = function(text) {
                this.$el.text(text);
            };
        },
        Button: function(settings) {
            this.settings = {
                type: 'primary',
                text: ''
            };
            this.settings = $.extend({}, this.settings, settings);
            this.constructor.prototype.template = {
                container: '<button type="button" class=""></button>'
            };
            this.constructor.prototype.render = function() {
                this.$el = $(this.template.container);
                this.setType(settings.type);
                this.setText(settings.text);
                return this.$el;
            };
            this.constructor.prototype.setText = function(value) {
                this.$el.text(value);
            };
            this.constructor.prototype.setType = function(type) {
                this.settings.type = type;
                if (type === 'primary') {
                    this.$el.addClass(KintoneUI.classForControl.primaryBtn);
                } else if (type === 'normal') {
                    this.$el.addClass(KintoneUI.classForControl.normalBtn);
                }
            };
            this.constructor.prototype.on = function(name, callback) {
                this.$el.on(name, callback);
            };
        },
        Loading: {
            setting: {
                style: {
                    spinner: '.kintoneCustomizeloading{position: fixed; width: 100%; height:100%;' +
                    'top: 0; left:0; z-index:1000; background:rgba(204, 204, 204, 0.3)}' +
                    '.kintoneCustomizeloading:before{position: fixed; top: calc(50% - 25px);' +
                    'content: "";left: calc(50% - 25px);' +
                    'border:8px solid #f3f3f3;border-radius:50%;border-top:8px solid #3498db;width:50px;' +
                    'height:50px;-webkit-animation:spin .8s linear infinite; animation:spin .8s linear infinite}' +
                    '@-webkit-keyframes' +
                    'spin{0%{-webkit-transform:rotate(0)}100%{-webkit-transform:rotate(360deg)}}' +
                    '@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}'
                }
            },
            loading: null,
            addStyleOnHead: function(css) {
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
        }
    };

    var Settings = {
        items: {
            selectionField: {
                listItem: [],
                selectedItem: []
            },
            methodField: {
                doSortListItem: false,
                listItem: [
                    { name: 'COUNT', value: 'count' },
                    { name: 'SUM', value: 'sum' },
                    { name: 'AVERAGE', value: 'average' }
                ],
                defaultSelectedItem: { value: 'count', name: 'COUNT' }
            },
            numberField: {
                listItem: [{value: null, name: '-----'}]
            }
        },
        setFieldInfo: function(field) {
            var info = {
                name: field.label,
                value: field.code
            };
            switch (field.type) {
                case 'NUMBER':
                    this.items.numberField.listItem.push(info);
                    break;
                case 'CHECK_BOX':
                case 'MULTI_SELECT':
                case 'DROP_DOWN':
                case 'RADIO_BUTTON':
                    this.items.selectionField.listItem.push(info);
                    break;
            }
        },
        setListItem: function(items) {
            var self = this;
            $.each(items, function(fieldCode, field) {
                if (field.type !== 'SUBTABLE') {
                    self.setFieldInfo(field);
                } else {
                    $.each(field.fields, function(j, val) {
                        self.setFieldInfo(field.fields[j]);
                    });
                }
            });
        }
    };
    function escapeHtml(htmlstr) {
        return htmlstr.replace(/\s/g, '');
    }

    function checkError() {
        var message;
        var rows = table.getRows();
        var numberFieldDatas = [];
        $.each(rows, function(index) {
            var controls = rows[index].Control.getControls();
            var targetFieldValue = controls[0].getSelectedData();
            var methodFieldValue = controls[1].getSelectedData();
            var wordFieldValue = controls[2].getValue();
            var resultFieldValue = controls[3].getSelectedData();

            if (targetFieldValue.length === 0) {
                message = Msg[lang].error.required;
                controls[0].setError(message);
            } else {
                controls[0].removeError();
            }
            if (methodFieldValue.value === 'count' && (!wordFieldValue || escapeHtml(wordFieldValue).length === 0)) {
                message = Msg[lang].error.required;
                controls[2].setError(message);
            } else {
                controls[2].removeError();
            }

            if (!resultFieldValue.value) {
                message = Msg[lang].error.required;
                controls[3].setError(message);
            } else {
                numberFieldDatas.push(resultFieldValue.value);
                var numberFieldLength = numberFieldDatas.length;
                numberFieldDatas = $.grep(numberFieldDatas, function(el, i) {
                    return i === $.inArray(el, numberFieldDatas);
                });
                if (numberFieldDatas.length !== numberFieldLength) {
                    message = Msg[lang].error.required;
                    controls[3].setError(Msg[lang].error.overLappedField);
                } else {
                    controls[3].removeError();
                }
            }
        });
        return message;
    }

    function createPluginConfigForSave(rows) {
        var dataTable = [];
        $.each(rows, function(index) {
            var controls = rows[index].Control.getControls();
            var dataControls = [
                { selectedItem: controls[0].getSelectedData() },
                { selectedItem: controls[1].getSelectedData() },
                { initValue: controls[2].getValue().trim() },
                { selectedItem: controls[3].getSelectedData() }];
            dataTable.push(dataControls);
        });
        var config = {
            data: JSON.stringify(dataTable)
        };
        return config;
    }

    function handleSaveSetting() {
        var error = checkError(table);
        if (error) {
            KintoneUI.NotifyPopup.showPopup(Msg[lang].error.errorOccur);
        } else {
            var rows = table.getRows();
            kintone.plugin.app.setConfig(createPluginConfigForSave(rows));
        }
    }

    function handleCancelSetting() {
        window.history.back();
    }

    function createActionGroupEl() {
        var $actionGroupEl = $('<div class="action-group"></div>');

        var cancelBtnSetting = {
            text: Msg[lang].button.cancelBtn,
            type: 'normal'
        };
        var cancelBtn = new KintoneUI.Button(cancelBtnSetting);
        $actionGroupEl.append(cancelBtn.render());
        cancelBtn.on('click', handleCancelSetting);

        var saveBtnSettings = {
            text: Msg[lang].button.saveBtn,
            type: 'primary'
        };
        var saveBtn = new KintoneUI.Button(saveBtnSettings);
        $actionGroupEl.append(saveBtn.render());
        saveBtn.on('click', handleSaveSetting);

        return $actionGroupEl;
    }

    function getTableSettings(formFieldsresp) {
        Settings.setListItem(formFieldsresp.properties);

        var config = kintone.plugin.app.getConfig(PLUGIN_ID).data;
        var tableSetting = {
            numCell: 4,
            rowContents: [
                { Control: KintoneUI.MultipleSelect, data: Settings.items.selectionField },
                { Control: KintoneUI.Dropdown, data: Settings.items.methodField },
                { Control: KintoneUI.Text, data: {} },
                { Control: KintoneUI.Dropdown, data: Settings.items.numberField }
            ],
            rowDefaulValues: config ? jQuery.parseJSON(config) : []
        };
        return tableSetting;
    }

    function initTable(formFieldsresp) {
        var tableSetting = getTableSettings(formFieldsresp);

        table = new KintoneUI.Table(tableSetting);
        $containerEl.append(table.render());
        var columnIndex = 1;
        table.onColumn('click', columnIndex, function(row) {
            row.handleAfterRowRender(row);
        });
    }

    function handleGetFormFieldsError() {
        KintoneUI.NotifyPopup.showPopup(Msg[lang].error.failedToGetFormFieldsApi);
    }

    $(document).ready(function() {
        KintoneUI.Loading.addStyleOnHead(KintoneUI.Loading.setting.style.spinner);
        KintoneUI.Loading.show();

        KintoneUI.NotifyPopup.createPopup();
        $containerEl = $('.setting-container');
        $containerEl.append(createActionGroupEl());

        var param = {};
        param.app = kintone.app.getId();
        var url = kintone.api.urlForGet('/k/v1/preview/form', param);
        kintone.api(url, 'GET', {}).then(function(resp) {
            initTable(resp);
            KintoneUI.Loading.hide();
            $('.setting-container').css('display', 'block');
        }).catch(function(e) {
            handleGetFormFieldsError();
            KintoneUI.Loading.hide();
        });
    });
})(jQuery, kintone.$PLUGIN_ID);
