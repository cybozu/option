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

package com.cybozu;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;

import org.apache.log4j.Logger;

/**
 * This class is use for parsing parameters and store configuration for
 * whole program.
 */
public class Configuration {
    private static Logger logger = Logger.getLogger(Configuration.class);

    /*
     * Number of LDAP users which program can read each request.
     */
    public static final int PAGE_SIZE = 1000;

    /*
     * Cybozu service url
     */
    public static String cybozuDomain = "";

    /*
     * Cybozu account name
     */
    public static String cybozuAccount = "";

    /*
     * Cybozu account password
     */
    public static String cybozuPassword = "";

    /*
     * Verify the import will succeeds even if the csv data columns value
     * is excess or deficiency.
     */
    public static String variable = "false";

    /*
     * LDAP URL. Should have format ldap://host:389 or ldaps://host:636
     */
    public static String ldapUrl = "";

    /*
     * Ldap Login Name
     */
    public static String ldapLogin = "";

    /*
     * Ldap Password
     */
    public static String ldapPass = "";

    /*
     * UserDN which specify path to user's location.
     */
    public static String userDn = "";

    /*
     * LDAP filter. Default is take all.
     */
    public static String ldapFilter = "CN=*";

    /*
     * User data file
     */
    public static final String USER_DATA_FILE_NAME = "user_template.csv";

    /*
     * Department and Job Title data file
     */
    public static final String ORG_DATA_FILE_NAME = "user_org_title_template.csv";

    /*
     * Services data file
     */
    public static final String SERVICE_DATA_FILE_NAME = "user_service_template.csv";

    /*
     * Specify export data from LDAP operation can be run.
     */
    public static boolean isExport = false;

    /*
     * Specify import data to Cybozu domain can be run.
     */
    public static boolean isImport = false;

    /*
     * Mapping LDAP attribute and Cybozu user infor fields
     */
    public static Map<String, String> usersInfoKeyMap = new LinkedHashMap<String, String>();

    /*
     * Mapping Department Code and Job Title Code fields
     */
    public static Map<String, String> orgInfoKeyMap = new LinkedHashMap<String, String>();

    /*
     * Default service for user when import user
     */
    public static String defaultServiceCode = "";

    /*
     * Proxy Host
     */
    public static String proxyHost = "";

    /*
     * Proxy Port
     */
    public static int proxyPort = -1;

    /*
     * LDAP Type for parsing Status of user.
     * Accept two value "OTHER" or "AD"
     */
    public static String ldapType = "OTHER";

    /*
     * Value for comparing LDAP attribute value to determine the
     * Disable flag. Only necessary when ldapType has value "OTHER"
     */
    public static String statusFlag = "";

    private static final String CUSTOM_FIELDS_REGREX = "User Info [0-9]{1,2}";


    /**
     * Parse the parameters and configuration file
     * @param parameters
     * @return
     */
    public static boolean getConfigInfor(String[] parameters) {
        // Show error when no parameters are provided.
        if (parameters == null || parameters.length == 0) {
            logger.error("Configuration error. No parameters are provided.");
            return false;
        }

        List<String> params = new ArrayList<String>(Arrays.asList(parameters));
        ListIterator<String> iterator = params.listIterator();
        while(iterator.hasNext()) {
            String param = iterator.next();

            // Parse import and export param
            if ("-import".equals(param)) {
                iterator.remove();
                isImport = true;
            }

            if ("-export".equals(param)) {
                iterator.remove();
                isExport = true;
            }
        }

        // Set import and export if not declare
        if (!isImport && !isExport) {
            logger.error("Missing specified -import or -export parameters");
            return false;
        }

        // To run program, at least 1 parameters must provided
        //  + connection information
        if (params.size() < 1) {
            logger.error("Missing configuration for establishing connection.");
            return false;
        }

        // Read connection configuration
        if (!readConnectionConfig(params.get(0))) {
            logger.error("Error occurs when reading connection configuration.");
            return false;
        }

        if (isExport) {
            if (ldapUrl.isEmpty() || ldapLogin.isEmpty()) {
                logger.error("Missing configuration for establishing connection to Ldap.");
                return false;
            }

            if (params.size() < 2) {
                logger.error("Missing user mapping information.");
                return false;
            }

            if (!readUserMappingConfig(params.get(1))) {
                logger.error("Error occurs when reading user mapping configuration.");
                return false;
            }

            if (params.size() > 2 && !readOrgMappingConfig(params.get(2))) {
                logger.warn("Error occurs when reading organization info.");
            }
        }

        return true;
    }

    /**
     * Read mapping information between LDAP attribute and Cybozu user fields
     * @param userMapFilePath
     * @return
     */
    private static boolean readUserMappingConfig(String userMapFilePath) {
        Map<String, String> keyMap = readKeyMap(userMapFilePath);
        if (keyMap == null) {
            return false;
        }

        // Add default user field name with correct order
        usersInfoKeyMap.put("Login Name", "");
        usersInfoKeyMap.put("Display Name", "");
        usersInfoKeyMap.put("New Login Name", "");
        usersInfoKeyMap.put("Password", "");
        usersInfoKeyMap.put("Surname", "");
        usersInfoKeyMap.put("Given Name", "");
        usersInfoKeyMap.put("Phonetic Surname", "");
        usersInfoKeyMap.put("Phonetic Given Name", "");
        usersInfoKeyMap.put("Localized Name", "");
        usersInfoKeyMap.put("Language for Localized Name", "");
        usersInfoKeyMap.put("E-mail Address", "");
        usersInfoKeyMap.put("Status", "");
        usersInfoKeyMap.put("Language", "");
        usersInfoKeyMap.put("Time Zone", "");
        usersInfoKeyMap.put("Phone", "");
        usersInfoKeyMap.put("Extension", "");
        usersInfoKeyMap.put("Mobile Phone", "");
        usersInfoKeyMap.put("URL", "");
        usersInfoKeyMap.put("Employee ID", "");
        usersInfoKeyMap.put("Hire Date", "");
        usersInfoKeyMap.put("Birthday", "");
        usersInfoKeyMap.put("About Me", "");
        usersInfoKeyMap.put("Display Order", "");
        usersInfoKeyMap.put("Skype Name", "");
        usersInfoKeyMap.put("To Be Deleted", "");

        // Add all custom fields
        List<String> customFields = new ArrayList<String>();
        for (Map.Entry<String, String> entry : keyMap.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();

            if (usersInfoKeyMap.containsKey(key)) {
                usersInfoKeyMap.put(key, value);
            } else if (key.matches(CUSTOM_FIELDS_REGREX)) {
                customFields.add(key);
            }
        }

        // Checking require fields
        // Login Name
        String loginName = usersInfoKeyMap.get("Login Name");
        if (loginName.isEmpty() || "*".equals(loginName)) {
            logger.error("Mapping field for Login Name must not be empty or value equals '*'.");
            return false;
        }

        // Display Name
        String displayName = usersInfoKeyMap.get("Display Name");
        if (displayName.isEmpty() || "*".equals(displayName)) {
            logger.error("Mapping field for Display Name must not be empty or value equals '*'.");
            return false;
        }

        // New Login Name
        String newLoginName = usersInfoKeyMap.get("New Login Name");
        if (newLoginName.isEmpty() || "*".equals(newLoginName)) {
            logger.error("Mapping field for New Login Name must not be empty or value equals '*'.");
            return false;
        }

        // Sort the custom fields base on last digit
        Collections.sort(customFields, new Comparator<String>() {
            @Override
            public int compare(String fieldNameOne, String fieldNameTwo) {
                int fieldNameOneOrder = Integer.parseInt(fieldNameOne.replaceAll("User Info ", ""));
                int fieldNameTwoOrder = Integer.parseInt(fieldNameTwo.replaceAll("User Info ", ""));

                return fieldNameOneOrder - fieldNameTwoOrder;
            }
        });

        // Add sorted custom fields to end or map
        for (String customField : customFields) {
            usersInfoKeyMap.put(customField, keyMap.get(customField));
        }

        return true;
    }

    /**
     * Read Department Code and Job Title Code
     * @param filePath
     * @return
     */
    private static boolean readOrgMappingConfig(String filePath) {
        Map<String, String> keyMap = readKeyMap(filePath);
        if (keyMap == null) {
            return false;
        }

        // Accept only two fields: Department and job title
        orgInfoKeyMap.put("Department Code", keyMap.get("Department Code"));
        orgInfoKeyMap.put("Job Title Code", keyMap.get("Job Title Code"));

        return true;
    }

    /**
     * Parse connection information and other options.
     * @param filePath
     * @return
     */
    private static boolean readConnectionConfig(String filePath) {
        Map<String, String> keyMap = readKeyMap(filePath);
        if (keyMap == null) {
            return false;
        }

        for (Map.Entry<String, String> entry : keyMap.entrySet()) {
            switch (entry.getKey()) {
            // Ldap
            case "Ldap Url":
                ldapUrl = entry.getValue();
                break;
            case "Ldap Account":
                ldapLogin = entry.getValue();
                break;
            case "Ldap Password":
                ldapPass = entry.getValue();
                break;
            case "User Dn":
                userDn = entry.getValue();
                break;
            case "Ldap Filter":
                ldapFilter = entry.getValue();
                break;
            // Cybozu
            case "Cybozu Domain":
                cybozuDomain = entry.getValue();
                break;
            case "Cybozu Account":
                cybozuAccount = entry.getValue();
                break;
            case "Cybozu Password":
                cybozuPassword = entry.getValue();
                break;
            // proxy
            case "Proxy Host":
                proxyHost = entry.getValue();
                break;
            case "Proxy Port":
                String port = entry.getValue();
                // Valid port value: 0 -> 65535
                if (!port.matches("[0-9]{1,5}")) {
                    logger.warn("Invalid proxy port: " + port + ". This setting will be ignored.");
                    break;
                }

                int portNumber = Integer.parseInt(port);
                if (portNumber > 65535) {
                    logger.warn("Proxy port out of range");
                    break;
                }

                proxyPort = portNumber;
                break;
            // Other
            case "Variable":
                    if ("true".equals(entry.getValue())) {
                        variable = "true";
                    } else {
                        variable = "false";
                    }
                    break;
            case "Ldap Type":
                if ("AD".equals(entry.getValue())) {
                    ldapType = "AD";
                } else {
                    ldapType = "OTHER";
                }
                break;
            case "Status Flag":
                statusFlag = entry.getValue();
                break;
            case "Default Service Code":
                defaultServiceCode = parseServiceCode(entry.getValue());
                break;
            default:
                break;
            }
        }

        return true;
    }

    /**
     * Parse the mapping infor from a file
     * @param filePath
     * @return
     */
    private static Map<String, String> readKeyMap(String filePath) {
        File file = new File(filePath);

        if (!file.exists()) {
            return null;
        }

        Map<String, String> keyMap = new HashMap<String, String>();
        BufferedReader br = null; 

        try {
            br = new BufferedReader(new InputStreamReader(new FileInputStream(file), StandardCharsets.UTF_8));
            String line;

            while ((line = br.readLine()) != null) {
                line = line.trim();
                // Ignore empty line or comment
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }

                String fieldsMap[] = line.split("=", 2);
                if (fieldsMap.length != 2) {
                    logger.info("Ignore invalid config: " + line);
                    continue;
                }

                String key = fieldsMap[0].trim();
                String value = fieldsMap[1].trim();

                // If key is missing, ignore it.
                if (key == null || key.isEmpty()) {
                    continue;
                }

                // If key is duplicate, ignore the later
                if (keyMap.containsKey(key)) {
                    logger.warn("The key \""+ key + "\" has already been defined with value \"" + keyMap.get(key) + "\"");
                    logger.warn("The new value \""+ value + "\" will be ignored.");
                    continue;
                }

                // Set the default value
                if (value == null) {
                    value = "";
                }

                keyMap.put(key, value);
            }
        } catch (IOException e) {
            logger.error(e.getMessage());
        } finally {
            if (br != null) {
                try {
                    br.close();
                } catch (IOException e) {
                    logger.error(e.getMessage());
                }
            }
        }

        return keyMap;
    }

    /**
     * Parse service code
     * @param serviceCodes
     * @return
     */
    private static String parseServiceCode(String serviceCodes) {
        if (serviceCodes == null || serviceCodes.isEmpty()) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        String[] servicesCode = serviceCodes.split(",");

        for (String code : servicesCode) {
            code = code.trim();
            switch (code) {
                case "ki":
                case "gr":
                case "of":
                case "mw":
                case "sa":
                    sb.append("\"" + code + "\"").append(",");
                    break;
                default:
                    break;
            }
        }

        if (sb.length() > 0) {
            sb.setLength(sb.length() - 1);
        }

        return sb.toString();
    }
}
