jQuery.noConflict();
(function($, PLUGIN_ID) {

    var avgDecimalPlaces = 2;
    var conf = kintone.plugin.app.getConfig(PLUGIN_ID);
    var tables = 'data' in conf ? JSON.parse(conf.data) : [];
    function getFieldConfig() {
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
        $.each(targetFields, function(i, field) {
            if (record[field]) {
                switch (method) {
                    case 'sum' :
                        sum = formatSum(sum, calcSum(record, field));
                        break;
                    case 'average' :
                        var avg = calcAverage(record, field);
                        sum = sum + avg.sum;
                        countAvg = countAvg + avg.countAvg;
                        break;
                    case 'count' :
                        count = count + calcCount(record, field, word);
                        break;
                    default: break;
                }
            }
        });
        var result = 0;
        if (count === 0) {
            result = countAvg === 0 ? sum : roundNumber(parseFloat(sum / countAvg));
        } else {
            result = count;
        }
        return result;
    }

    function calculator(fields, record) {
        $.each(fields, function(i, field) {
            if (record[field.resultField]) {
                record[field.resultField].disabled = true;
                record[field.resultField].value = calcTargetFields(
                    record, field.targetFields, field.method, field.word)
                ;
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

    $.each(getFieldConfig(), function(i, fields) {
        $.each(fields.targetFields, function(j, targetField) {
            events.push('app.record.index.edit.change.' + targetField);
            events.push('app.record.edit.change.' + targetField);
            events.push('app.record.create.change.' + targetField);
            events.push('mobile.app.record.index.edit.change.' + targetField);
            events.push('mobile.app.record.edit.change.' + targetField);
            events.push('mobile.app.record.create.change.' + targetField);
        });
    });

    events = $.grep(events, function(el, index) {
        return index === $.inArray(el, events);
    });

    kintone.events.on(events, function(event) {
        var record = event['record'];
        var fields = getFieldConfig();
        calculator(fields, record);
        return event;
    });
})(jQuery, kintone.$PLUGIN_ID);
