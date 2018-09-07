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

import javax.naming.directory.Attributes;

import com.cybozu.Configuration;

public class ServiceDataParser extends DataParser {

    @Override
    public String parseDataToCSV(Attributes attrs) {
        if (Configuration.defaultServiceCode.isEmpty()) {
            return null;
        }

        String loginKey = Configuration.usersInfoKeyMap.get("Login Name");
        String loginValue = getLdapAttributeValue(attrs, loginKey);

        return "\"" + loginValue + "\"," + Configuration.defaultServiceCode;
    }
}
