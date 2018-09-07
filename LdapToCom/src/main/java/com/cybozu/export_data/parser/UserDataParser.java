/**
 * Copyright 2018 Cybozu
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.cybozu.export_data.parser;

import java.util.Map;

import javax.naming.directory.Attributes;

import com.cybozu.Configuration;

public class UserDataParser extends DataParser {
    public String parseDataToCSV(Attributes attrs) {
        // clear the previous value
        sb.setLength(0);

        for (Map.Entry<String, String> entry : Configuration.usersInfoKeyMap.entrySet()) {
            String key = entry.getKey();
            String value = getLdapAttributeValue(attrs, entry.getValue());

            if ("Status".equals(key)) {
                value = parseStatusValue(value);
            }

            sb.append("\"");
            if (value.isEmpty()) {
                sb.append("*");
            } else {
                sb.append(value);
            }
            sb.append("\"");
            sb.append(",");
        }

        int length = sb.length();
        if (length > 1) {
            sb.setLength(length - 1);
        }

        return sb.toString();
    }

    private String parseStatusValue(String value) {
        if ("AD".equals(Configuration.ldapType)) {
            if (value == null || value.isEmpty()) {
                return "*";
            }

            if (!value.matches("[0-9]+")) {
                return "*";
            }

            int integerValue = Integer.parseInt(value);
            String binaryString = Integer.toBinaryString(integerValue);

            int length = binaryString.length();
            String statusCode = binaryString;
            if (length >= 2) {
                statusCode = binaryString.substring(length - 2, length - 1);
            }

            if ("1".equals(statusCode)) {
                return "0";
            } else {
                return "1";
            }
        } else {
            if (Configuration.statusFlag.isEmpty()) {
                return "*";
            }

            if (Configuration.statusFlag.equals(value)) {
                return "0";
            } else {
                return "1";
            }
        }
    }
}