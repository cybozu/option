/**
 * Copyright 2017 Cybozu
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

package com.cybozu.export_data;

import java.io.IOException;
import java.util.Hashtable;

import javax.naming.Context;
import javax.naming.NamingEnumeration;
import javax.naming.NamingException;
import javax.naming.directory.Attributes;
import javax.naming.directory.SearchControls;
import javax.naming.directory.SearchResult;
import javax.naming.ldap.Control;
import javax.naming.ldap.InitialLdapContext;
import javax.naming.ldap.PagedResultsControl;
import javax.naming.ldap.PagedResultsResponseControl;

import org.apache.log4j.Logger;

import com.cybozu.Configuration;
import com.cybozu.export_data.parser.DataParser;
import com.cybozu.export_data.parser.OrgDataParser;
import com.cybozu.export_data.parser.ServiceDataParser;
import com.cybozu.export_data.parser.UserDataParser;

/**
 * This class is responsible for export data from LDAP to csv files.
 * There are 3 operations:
 *  1) Export user data
 *  2) Export Departments and Job Titles which user belongs to.
 *  3) Export services which user has access right.
 */
public class DataExporter {
    private static Logger logger = Logger.getLogger(DataExporter.class);

    /**
     * Set url and authentication for LDAP connection.
     * @return
     */
    private Hashtable<String, String> createConnectionEnv() {
        Hashtable<String, String> env = new Hashtable<String, String>();
        env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");
        env.put(Context.PROVIDER_URL, Configuration.ldapUrl);

        // Set up LDAP authentication base on username and password
        env.put(Context.SECURITY_AUTHENTICATION, "simple");
        env.put(Context.SECURITY_PRINCIPAL, Configuration.ldapLogin);
        env.put(Context.SECURITY_CREDENTIALS, Configuration.ldapPass);

        // Support for jre 10.0.2
        System.setProperty("com.sun.jndi.ldap.object.disableEndpointIdentification", "true");

        return env;
    }

    /**
     * Export Data
     * @return
     */
    public boolean exportDataToCSV() {
        // Set path to folder which contains users in LDAP service.
        String base = Configuration.userDn;
        // Set filter
        String filter = Configuration.ldapFilter;
        SearchControls searchControls = new SearchControls();
        searchControls.setSearchScope(SearchControls.SUBTREE_SCOPE);

        // Init parser objects for each operation 
        DataParser userDataParser = new UserDataParser();
        DataParser orgDataParser = new OrgDataParser();
        DataParser serviceDataParser = new ServiceDataParser();

        // Init file writer for writing csv data
        DataWriter userDataWriter = new DataWriter(Configuration.USER_DATA_FILE_NAME);
        DataWriter orgDataWriter = new DataWriter(Configuration.ORG_DATA_FILE_NAME);
        DataWriter serviceDataWriter = new DataWriter(Configuration.SERVICE_DATA_FILE_NAME);

        InitialLdapContext context = null;
        boolean result = false;
        try {
            context = new InitialLdapContext(createConnectionEnv(), null);

            // Send a sample request with to check LDAP has user data
            context.setRequestControls(new Control[]{
                    new PagedResultsControl(1, Control.NONCRITICAL) });
            NamingEnumeration<SearchResult> users = context.search(base, filter, searchControls);

            if (users == null || !users.hasMore()) {
                logger.info("Not found information of users on ldaps server");
                context.close();
                return false;
            }

            logger.info("Begin making csv files");
            byte[] cookie = null;
            // Because Java limit number users for each request so must send multiple requests
            // if the number of users too large.
            do {
                // Send request to get 1000 users
                context.setRequestControls(new Control[]{
                        new PagedResultsControl(Configuration.PAGE_SIZE, cookie, Control.CRITICAL)});

                users = context.search(base, filter, searchControls);

                int count = 0;
                // Get information of each user
                while (users != null && users.hasMore()) {
                    count++;

                    Attributes attributes = users.next().getAttributes();
                    if (attributes == null) {
                        continue;
                    }

                    // Write the information to csv files
                    userDataWriter.writeData(userDataParser.parseDataToCSV(attributes));
                    orgDataWriter.writeData(orgDataParser.parseDataToCSV(attributes));
                    serviceDataWriter.writeData(serviceDataParser.parseDataToCSV(attributes));
                }

                // Checking if there is remaining users on Ldap.
                Control[] controls = context.getResponseControls();
                for (Control control : controls) {
                    if (control instanceof PagedResultsResponseControl) {
                        logger.info("Writing " + count + " user's information to csv file");

                        PagedResultsResponseControl prrc = (PagedResultsResponseControl) control;
                        cookie = prrc.getCookie();

                        break;
                    }
                }
            } while (cookie != null);

            result = true;
            logger.info("Making csv files successfully"); 
        } catch (NamingException | IOException e) {
            logger.error("Error when exporting data: " + e.getMessage());
            result = false;
        } finally {
            if (context != null) {
                try {
                    context.close();
                } catch (NamingException e) {
                    logger.error("Error when closing the Ldap connection: " + e.getMessage());
                }
            }

            userDataWriter.close();
            orgDataWriter.close();
            serviceDataWriter.close();
        }

        return result;
    }
}