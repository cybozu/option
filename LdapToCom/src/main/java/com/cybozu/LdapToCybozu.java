/**
 * Copyright 2018 Cybozu

 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.cybozu;

import org.apache.log4j.Logger;

import com.cybozu.export_data.DataExporter;
import com.cybozu.import_data.DataImporter;

/**
 * The program is use for synchronization user's data from a LDAP service
 * to Cybozu domain. The program using csv format to export data then upload
 * to Cybozu service. The configuration is defined in text files.
 */
public class LdapToCybozu {
    private static Logger logger = Logger.getLogger(LdapToCybozu.class);

    public static void main(String[] args) throws Exception {
        // Read parameters and configuration
        if (!Configuration.getConfigInfor(args)) {
            System.exit(1);
        }

        // Export data from LDAP to csv files.
        if (Configuration.isExport) {
            DataExporter exporter = new DataExporter();
            if(!exporter.exportDataToCSV()) {
                System.exit(1);
            }
        }

        // Import data from csv files to Cybozu domain.
        if (Configuration.isImport) {
            if (Configuration.cybozuDomain.isEmpty() || Configuration.cybozuAccount.isEmpty()) {
                logger.error("Missing configuration for establishing connection to Cybozu.");
                System.exit(1);
            }

            DataImporter importer = new DataImporter();
            if (!importer.importDataToCybozu()) {
                 System.exit(1);
            }
        }

        System.exit(0);
    }
}