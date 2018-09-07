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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.naming.directory.Attributes;

import com.cybozu.Configuration;

public class OrgDataParser extends DataParser {
    private List<String[]> orgs = new ArrayList<String[]>();

    @Override
    public String parseDataToCSV(Attributes attrs) {
        if (Configuration.orgInfoKeyMap.isEmpty()) {
            return null;
        }

        // clear previous value
        sb.setLength(0);
        orgs.clear();

        String loginKey = Configuration.usersInfoKeyMap.get("Login Name");
        String loginValue = getLdapAttributeValue(attrs, loginKey);
        sb.append("\"" + loginValue + "\"");

        int maxNum = 0;
        for (Map.Entry<String, String> entry : Configuration.orgInfoKeyMap.entrySet()) {
            String[] ldapValue = getLdapAttributeValue(attrs, entry.getValue()).split(",");

            if (maxNum < ldapValue.length) {
                maxNum = ldapValue.length;
            }

            orgs.add(ldapValue);
        }

        for (int i = 0; i < maxNum; i++) {
            for (String[] ldapValue : orgs) {
                sb.append(",");
                if (i < ldapValue.length) {
                    sb.append("\"").append(ldapValue[i]).append("\"");
                } else {
                    sb.append("\"\"");
                }
            }
        }

        return sb.toString();
    }
}
