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

package com.cybozu.import_data;

import java.io.File;
import java.util.Map;

import org.apache.log4j.Logger;

import com.cybozu.Configuration;
import com.cybozu.LdapToCybozu;

public class DataImporter {
    private static Logger logger = Logger.getLogger(LdapToCybozu.class);

    private Connection connection = null;
    private static final int CHECK_RESULT_TIME_OUT = 5000;

    /**
     * Import the users form csv files to cybozu domain.
     * @throws Exception
     */
    public boolean importDataToCybozu() throws Exception {
      logger.info("Begin uploading information to Cybozu domain");

      if (connect() == null) {
          return false;
      }

      if (!checkFileExist(Configuration.USER_DATA_FILE_NAME)) {
          logger.error("User data csv file is not found");
          return false;
      }

      if (!importUserData()) {
          return false;
      }

      if (checkFileExist(Configuration.SERVICE_DATA_FILE_NAME)) {
          if (!importServiceData()) {
              return false;
          }
      }

      if (checkFileExist(Configuration.ORG_DATA_FILE_NAME)) {
          if (!importOrgData()) {
              return false;
          }
      }

      return true;
    }

    private Connection connect() {
        try {
            connection = new Connection(Configuration.cybozuDomain, Configuration.cybozuAccount, Configuration.cybozuPassword);
            if (!Configuration.proxyHost.isEmpty() && Configuration.proxyPort != -1) {
                connection.setProxy(Configuration.proxyHost, Configuration.proxyPort);
            }
        } catch (Exception e) {
            logger.error(e.getMessage());
            return null;
        }

        return connection;
    }

    private boolean importUserData() {
        File userDataFile = getFile(Configuration.USER_DATA_FILE_NAME);
        if (userDataFile == null) {
            return false;
        }

        logger.info("Begin uploading user data");
        try {
            Map<String, String> resultMap = connection.uploadFile(userDataFile);

            if (Integer.parseInt(resultMap.get("status")) == 200) {
                logger.debug("Upload user data csv file sucessfully with result: " + connection.mapToJson(resultMap));
            } else {
                logger.error("Upload user data csv file failed with result: " + connection.mapToJson(resultMap));
                return false;
            }

            resultMap = connection.addUsers(Configuration.variable);
            if (Integer.parseInt(resultMap.get("status")) == 200) {
                logger.debug("Add users data sucessfully with result: " + connection.mapToJson(resultMap));
            } else {
                logger.error("Add users data failed with result:" + connection.mapToJson(resultMap));
                return false;
            }

            Map<String, String> result = checkResult();
            if (result != null) {
                logger.error("Add users data failed with result: " + connection.mapToJson(result));
                return false;
            }
        } catch (Exception e) {
            logger.error("Error when importing data: " + e.getMessage());
            return false;
        }

        logger.info("Add user data successfully");
        return true;
    }

    private boolean importOrgData() {
        File orgDataFile = getFile(Configuration.ORG_DATA_FILE_NAME);
        if (orgDataFile == null) {
            return false;
        }

        logger.info("Begin uploading organization data");
        try {
            Map<String, String> resultMap = connection.uploadFile(orgDataFile);

            if (Integer.parseInt(resultMap.get("status")) == 200) {
                logger.debug("Upload org data file successfully.");
            } else {
                logger.error("Upload org data file failed with result: " + connection.mapToJson(resultMap));
                return false;
            }

            resultMap = connection.addUserOrg();
            if (Integer.parseInt(resultMap.get("status")) == 200) {
                logger.debug("Add department code and job title successfully");
            } else {
                logger.error("Add department code and job title failed with result: " + connection.mapToJson(resultMap));
                return false;
            }

            Map<String, String> result = checkResult();
            if (result != null) {
                logger.error("Add org data failed with result: " + connection.mapToJson(result));
                return false;
            }
        } catch (Exception e) {
            logger.error("Error when importing data: " + e.getMessage());
            return false;
        }

        logger.info("Uploading organization data succesfully");
        return true;
    }

    private boolean importServiceData() {
        File servicesDataFile = getFile(Configuration.SERVICE_DATA_FILE_NAME);
        if (servicesDataFile == null) {
            return false;
        }

        logger.info("Begin uploading services data");
        try {
            Map<String, String> resultMap = connection.uploadFile(servicesDataFile);

            if (Integer.parseInt(resultMap.get("status")) == 200) {
                logger.debug("Upload service data file sucessfully");
            } else {
                logger.error("Upload service data file failed with result: " + connection.mapToJson(resultMap));
                return false;
            }

            resultMap = connection.addServices();
            if (Integer.parseInt(resultMap.get("status")) == 200) {
                logger.debug("Add services for imported users successfully");
            } else {
                logger.error("Add services for imported users failed with result: " + connection.mapToJson(resultMap));
                return false;
            }

            Map<String, String> result = checkResult();
            if (result != null) {
                logger.error("Add services data failed with result: " + connection.mapToJson(result));
                return false;
            }
        } catch (Exception e) {
            logger.error("Error when importing data: " + e.getMessage());
            return false;
        }

        logger.info("Uploading services data succesfully");
        return true;
    }

    private Map<String, String> checkResult() {
        String done = "false";

        try {
            while(true) {
                logger.debug("Send checking result");
                Map<String, String> resultMap = connection.getResult();
                done = resultMap.get("done");

                if ("true".equals(done)) {
                    if ("true".equals(resultMap.get("success"))) {
                        logger.debug("Process success");
                        return null;
                    } else {
                        logger.debug("Process failed");
                        return resultMap;
                    }
                } else {
                    logger.debug("Process not done");
                }

                Thread.sleep(CHECK_RESULT_TIME_OUT);
            }
        } catch (Exception e) {
            logger.error(e.getMessage());
            return null;
        }
    }

    private boolean checkFileExist(final String name) {
        File file = new File("./" + name);

        if (file.exists()) {
            return true;
        }

        return false;
    }

    private File getFile(final String name) {
        File file = new File("./" + name);

        if (file.isDirectory()) {
            logger.error("Filepath \""+ name + "\" is directory");
            return null;
        }

        if (!file.canRead()) {
            logger.error("Unable read data of \"" + name + "\"");
            return null;
        }

        return file;
    }
}