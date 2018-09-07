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

import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;

import org.apache.log4j.Logger;

/**
 * This class is use for parsing Ldap data to csv row.
 * However only method getLdapAttributeValue is defined here.
 * The detail of each parsing type will be implement on children class.
 */
public abstract class DataParser {
    private static Logger logger = Logger.getLogger(DataParser.class);

    /*
     * For construct csv string
     */
    protected StringBuilder sb = new StringBuilder();

    /**
     * Parse LDAP information to CSV row data.
     * @param attrs
     * @return
     */
    public abstract String parseDataToCSV(Attributes attrs);

    /**
     * Get correspondence LDAP information with key
     * @param attributes
     * @param key
     * @return
     */
    protected String getLdapAttributeValue(Attributes attributes, String key) {
        // Set default value is empty string
        String result = "";
        if (key == null || key.isEmpty()) {
            return result;
        }

        Attribute attribute = attributes.get(key);
        if (attribute != null) {
            String target;
            try {
                target = attribute.get().toString();
                // Only accept non empty value
                if (!target.isEmpty()) {
                    result = target;
                }
            } catch (NamingException e) {
                logger.error(e.getMessage());
            }
        }

        return result;
    }
}
