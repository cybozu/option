jQuery.noConflict();
(function($, PLUGIN_ID) {
    'use strict';

    var avgDecimalPlaces = 2;
    var conf = kintone.plugin.app.getConfig(PLUGIN_ID);
    var tables = 'data' in conf ? JSON.parse(conf.data) : [];

    var subTableCodes = [];
    function getSubTableCodes(record) {
        var codes = [];
        $.each(record, function(recordFieldCode, recordField) {
            if (recordField.type === 'SUBTABLE') {
                codes.push(recordFieldCode);
            }
        });
        return codes;
    }

    function getConfig() {
        var fields = [];
        $.each(tables, function(i, field) {
            var fieldObj = {};
            fieldObj.targetFields = [];
            $.each(field[0].selectedItem, function(j, targetField) {
                fieldObj.targetFields.push(targetField.value);
            });
            fieldObj.method = field[1].selectedItem.value;
            fieldObj.word = field[2].initValue;
            fieldObj.resultField = field[3].selectedItem.value;
            fields.push(fieldObj);
        });
        return fields;
    }

    function formatSum(num1, num2) {
        var decimalNum1 = num1.toString().indexOf('.') !== -1 ? num1.toString().split('.')[1].length : 1;
        var decimalNum2 = num2.toString().indexOf('.') !== -1 ? num2.toString().split('.')[1].length : 1;
        var decimal = decimalNum1 > decimalNum2 ? Math.pow(10, decimalNum1) : Math.pow(10, decimalNum2);
        var sum = (Math.round(num1 * decimal) + Math.round(num2 * decimal)) / decimal;
        return sum;
    }

    function calcSum(record, field) {
        var sum = 0;
        if (!$.isArray(record[field].value)) {
            sum = $.isNumeric(record[field].value) ? formatSum(sum, parseFloat(record[field].value)) : sum;
        } else {
            $.each(record[field].value, function(j, value) {
                sum = $.isNumeric(value) ? formatSum(sum, parseFloat(value)) : sum;
            });
        }
        return sum;
    }

    function calcAverage(record, field) {
        var avg = {
            sum: 0,
            countAvg: 0
        };
        if (!$.isArray(record[field].value)) {
            avg.sum = $.isNumeric(record[field].value) ? avg.sum + parseFloat(record[field].value) : avg.sum;
            avg.countAvg += $.isNumeric(record[field].value);
        } else {
            $.each(record[field].value, function(j, value) {
                avg.sum = $.isNumeric(value) ? avg.sum + parseFloat(value) : avg.sum;
                avg.countAvg += $.isNumeric(value);
            });
        }
        return avg;
    }

    function calcCount(record, field, word) {
        var count = 0;
        if (!$.isArray(record[field].value)) {
            var val = record[field].value;
            count += (val === word);
        } else {
            $.each(record[field].value, function(j, value) {
                count += (value === word);
            });
        }
        return count;
    }

    function roundNumber(number) {
        if (typeof number === 'number') {
            var denominator = Math.pow(10, avgDecimalPlaces);
            var roundedNumber = Math.round(Math.abs(number) * denominator) / denominator;
            roundedNumber = number > 0 ? roundedNumber : -roundedNumber;
            return roundedNumber;
        }
        return number;
    }

    function calcTargetFields(record, targetFields, method, word) {
        var sum = 0;
        var countAvg = 0;
        var count = 0;

        $.each(record, function(fieldCode, recordField) {
            if (targetFields.indexOf(fieldCode) !== -1) {
                switch (method) {
                    case 'sum' :
                        sum = formatSum(sum, calcSum(record, fieldCode));
                        break;
                    case 'average' :
                        var avg = calcAverage(record, fieldCode);
                        sum = sum + avg.sum;
                        countAvg = countAvg + avg.countAvg;
                        break;
                    case 'count' :
                        count = count + calcCount(record, fieldCode, word);
                        break;
                    default:
                        break;
                }
            }
        });

        $.each(subTableCodes, function(i, subTableCode) {
            var subRecords = record[subTableCode].value;
            $.each(subRecords, function(j, subRecord) {
                var subRecordFields = subRecord.value;
                $.each(subRecordFields, function(subRecordFieldCode, subRecordField) {
                    if (targetFields.indexOf(subRecordFieldCode) !== -1) {
                        switch (method) {
                            case 'sum' :
                                sum = formatSum(sum, calcSum(subRecordFields, subRecordFieldCode));
                                break;
                            case 'average' :
                                var avg = calcAverage(subRecordFields, subRecordFieldCode);
                                sum = sum + avg.sum;
                                countAvg = countAvg + avg.countAvg;
                                break;
                            case 'count' :
                                count = count + calcCount(subRecordFields, subRecordFieldCode, word);
                                break;
                            default:
                                break;
                        }
                    }
                });
            });
        });

        var result = 0;
        if (count === 0) {
            result = countAvg === 0 ? sum : roundNumber(parseFloat(sum / countAvg));
        } else {
            result = count;
        }
        return result;
    }

    function calculator(caculations, record) {
        $.each(caculations, function(i, caculation) {
            if (record[caculation.resultField]) {
                record[caculation.resultField].disabled = true;
                record[caculation.resultField].value = calcTargetFields(
                    record,
                    caculation.targetFields,
                    caculation.method,
                    caculation.word
                );
            } else {
                $.each(subTableCodes, function(j, subTableCode) {
                    $.each(record[subTableCode].value, function(k, subTableRow) {
                        if (subTableRow.value[caculation.resultField]) {
                            record[subTableCode].value[k].value[caculation.resultField].disabled = true;
                            record[subTableCode].value[k].value[caculation.resultField].value = calcTargetFields(
                                record,
                                caculation.targetFields,
                                caculation.method,
                                caculation.word
                            );
                        }
                    });
                });
            }
        });
    }

    var events = [
        'app.record.create.show',
        'app.record.create.submit',
        'app.record.edit.submit',
        'app.record.edit.show',
        'app.record.index.edit.show',
        'app.record.index.edit.submit',
        'mobile.app.record.create.show',
        'mobile.app.record.create.submit',
        'mobile.app.record.edit.submit',
        'mobile.app.record.edit.show',
        'mobile.app.record.index.edit.show',
        'mobile.app.record.index.edit.submit'
    ];

    function uniqueEvents(eventList) {
        return $.grep(eventList, function(el, index) {
            return index === $.inArray(el, eventList);
        });
    }

    function bindFieldEvents(caculations) {
        var fieldEvents = [];
        $.each(caculations, function(i, caculation) {
            $.each(caculation.targetFields, function(j, targetField) {
                fieldEvents.push('app.record.index.edit.change.' + targetField);
                fieldEvents.push('app.record.edit.change.' + targetField);
                fieldEvents.push('app.record.create.change.' + targetField);
                fieldEvents.push('mobile.app.record.index.edit.change.' + targetField);
                fieldEvents.push('mobile.app.record.edit.change.' + targetField);
                fieldEvents.push('mobile.app.record.create.change.' + targetField);
            });
        });

        fieldEvents = uniqueEvents(fieldEvents);
        kintone.events.on(fieldEvents, function(fieldEvent) {
            calculator(caculations, fieldEvent['record']);
            return fieldEvent;
        });
    }

    function bindSubTableEvents(caculations) {
        var subTableEvents = [];
        $.each(subTableCodes, function(i, tableCode) {
            subTableEvents.push('app.record.edit.change.' + tableCode);
            subTableEvents.push('app.record.create.change.' + tableCode);
            subTableEvents.push('mobile.app.record.edit.change.' + tableCode);
            subTableEvents.push('mobile.app.record.create.change.' + tableCode);
        });

        subTableEvents = uniqueEvents(subTableEvents);
        kintone.events.on(subTableEvents, function(subTableEvent) {
            calculator(caculations, subTableEvent['record']);
            return subTableEvent;
        });
    }

    kintone.events.on(events, function(event) {
        var record = event['record'];
        subTableCodes = getSubTableCodes(record);
        var caculations = getConfig();
        calculator(caculations, record);

        bindFieldEvents(caculations);
        bindSubTableEvents(caculations);

        return event;
    });
})(jQuery, kintone.$PLUGIN_ID);
