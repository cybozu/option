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

package com.cybozu.import_data;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintStream;
import java.net.InetSocketAddress;
import java.net.Proxy;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import javax.net.ssl.HttpsURLConnection;

import org.apache.log4j.Logger;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonParser;
import com.google.gson.reflect.TypeToken;

/**
 * This class responsible for establish connection to Cybozu service.
 */
public class Connection {
    private static final Logger logger = Logger.getLogger(Connection.class);

    /*
     * Base connection object.
     */
    private HttpsURLConnection httpsConn;

    /*
     * Random string to mark boundary of file when uploading.
     */
    private final String FILE_BOUNDARY = "boundary_aj8gksdnsdfakj342fs3dt3stk8g6j32";

    /*
     * Username/Password authentication header
     */
    private final String AUTH_HEADER = "X-Cybozu-Authorization";

    /*
     * Rest api version
     */
    private final String API_VERSION = "v1/";

    /*
     * Rest api version for csv.
     */
    private final String API_CSV = API_VERSION + "csv/";

    /*
     * Cybozu domain
     */
    private String domain;

    /*
     * Username/Password authentication header value.
     */
    private String auth;

    /*
     * File key is given by Cybozu domain after uploading.
     */
    private String fileKey = null;

    /*
     * Result id when using check result api.
     */
    private String resultId = null;

    /*
     * Net work proxy
     */
    private Proxy proxy;

    /*
     * Json Parser
     */
    private static final Gson gson = new Gson();
    private static final JsonParser jsonParser = new JsonParser();

    /**
     * Init connection
     * @param domain
     * @param login
     * @param password
     */
    public Connection(String domain, String login, String password) {
        // Encode username/password using BASE64 for authetication
        this.auth = Base64.getEncoder().encodeToString((login + ":" + password).getBytes());

        if (domain.contains("https")) {
            this.domain = domain + "/";
        } else {
            this.domain = "https://" + domain + "/";
        }
    }

    /**
     * Upload file to Cybozu service
     * @param file
     * @return
     * @throws Exception
     */
    public Map<String, String> uploadFile(File file) throws Exception {
        return request("FILE", file, null);
    }

    /**
     * Add users data.
     * The csv data must be successfully uploaded to Cybozu domain
     * by using uploadFile method before using this one.
     * @param variable
     * @return
     * @throws Exception
     */
    public Map<String, String> addUsers(String variable) throws Exception {
        return request("USER", null, variable);
    }

    /**
     * Add user Department and Job Title.
     * The csv data must be successfully uploaded to Cybozu domain
     * by using uploadFile method before using this one.
     * @return
     * @throws Exception
     */
    public Map<String, String> addUserOrg() throws Exception {
        return request("ORG", null, null);
    }

    /**
     * Add user's services.
     * The csv data must be successfully uploaded to Cybozu domain
     * by using uploadFile method before using this one.
     * @return
     * @throws Exception
     */
    public Map<String, String> addServices() throws Exception {
        return request("SERVICE", null, null);
    }

    /**
     * Check result of methods addUsers, addUserOrg, addServices
     * @return
     * @throws Exception
     */
    public Map<String, String> getResult() throws Exception {
        return request("RESULT", null, null);
    }

    /**
     * Setup the proxy.
     * 
     * @param host
     * @param port
     */
    public void setProxy(String host, int port) {
        this.proxy = new Proxy(Proxy.Type.HTTP, new InetSocketAddress(host, port));
    }

    /**
     * Base function for sending HTTP request.
     * @param command
     * @param outFile
     * @param variable
     * @return
     * @throws Exception
     */
    private Map<String, String> request(String command, File outFile, String variable) throws Exception {
        String response = null;
        InputStream input = null;

        String jsonCom;
        String jsonApi = this.domain + API_CSV;
        String ContentType = "application/json";
        String method = "POST";
        String body = null;

        Map<String, String> resMap = new HashMap<String, String>();

        // Init a stream to send file data
        if (command.equals("FILE")) {
            input = new FileInputStream(outFile.getAbsolutePath());
        }

        switch (command) {
        // sending user data
        case "USER":
            jsonCom = "user.json";
            body = "{\"fileKey\":\"" + fileKey + "\","
                    + "\"variableCustomItemLength\":\"" + variable + "\"}";
            break;
        // sending department and job title data
        case "ORG":
            jsonCom = "userOrganizations.json";
            body = "{\"fileKey\":\"" + fileKey + "\"}";
            break;
        // sending services data
        case "SERVICE":
            jsonCom = "userServices.json";
            body = "{\"fileKey\":\"" + fileKey + "\"}";
            break;
        // checking result
        case "RESULT":
            jsonCom = "result.json?id=" + resultId;
            method = "GET";
            break;
        // uploading file
        case "FILE":
            jsonCom = "file.json";
            jsonApi = this.domain + API_VERSION;
            ContentType = "multipart/form-data;boundary=" + FILE_BOUNDARY;
            break;
        // set default is sending user data
        default:
            jsonCom = "user.json";
            break;
        }

        URL url;
        try {
            // Init connection and setup proxy
            url = new URL(jsonApi + jsonCom);
            if (this.proxy == null) {
                httpsConn = (HttpsURLConnection)url.openConnection();
            } else {
                httpsConn = (HttpsURLConnection)url.openConnection(this.proxy);
            }
            // Set timeout
            httpsConn.setConnectTimeout(30000);

            // Set authentication
            httpsConn.addRequestProperty(AUTH_HEADER, auth);

            // Set method
            httpsConn.setRequestMethod(method);

            // Check result doesn't require complex setup, just send it.
            if (command.equals("RESULT")) {
                httpsConn.connect();
            // Other method need setup stream to send data.
            } else {
                httpsConn.setDoInput(true);
                httpsConn.setDoOutput(true);
                httpsConn.setUseCaches(false);
                httpsConn.setRequestProperty("Connection", "Keep-Alive");
                httpsConn.setRequestProperty("Content-Type", ContentType);
                httpsConn.connect();

                // Get HTTP stream to send data
                OutputStream os = httpsConn.getOutputStream();
                PrintStream ps = new PrintStream(os);

                // Uploading file
                if (command.equals("FILE")) {
                    // Write below string to mark begin of multi-part request
                    ps.print("--" + FILE_BOUNDARY + "\r\n");

                    // Specify data format and file name
                    ps.print("Content-Disposition: form-data; name=\"file\"; filename=\"" + outFile + "\"\r\n");
                    ps.print("Content-Type: text/csv" + "\r\n\r\n");

                    // Write file data to HTTP stream via buffer
                    byte[] buffer = new byte[8192];
                    int n = 0;
                    while ((n = input.read(buffer)) != -1) {
                        os.write(buffer, 0, n);
                    }

                    // Write below string to mark end of multi-part request.
                    ps.print("\r\n--" + FILE_BOUNDARY + "--\r\n");

                    // Close file
                    input.close();
                }

                // Write json data
                ps.print(body);

                // Close HTTP stream
                ps.close();
                os.close();
            }

            // Receive Response
            int statusCode = httpsConn.getResponseCode();
            // Failure
            if (statusCode != 200) {
                // parse json to Map object
                resMap = jsonToMap(response);
                if (resMap == null) {
                    resMap = new HashMap<String, String>();
                }
                resMap.put("status", String.valueOf(statusCode));
                return resMap;
            }

            // Success
            InputStream is = httpsConn.getInputStream();
            response = streamToString(is);
            is.close();

            // Store the result
            switch (command) {
                // Get file key then store to use for addUser, addOrd and addService
                case "FILE":
                    // clear old file key
                    fileKey = null;

                    // get the new one
                    fileKey = jsonToString(response, "fileKey");

                    break;
                case "USER":
                case "ORG":
                case "SERVICE":
                    // clear old result
                    resultId = null;

                    // update new one
                    resultId = jsonToString(response, "id");

                    break;
               default:
                   break;
            }
        } catch (Exception e) {
            logger.error(e.getMessage());
            throw e;
        }

        resMap = jsonToMap(response);
        resMap.put("status", String.valueOf(httpsConn.getResponseCode()));
        return resMap;

    }

    /**
     * Pare json object to string
     * @param json
     * @param val
     * @return
     * @throws Exception
     */
    private String jsonToString(String json, String val) throws Exception {
        JsonElement root = jsonParser.parse(json);
        if (root.isJsonObject()) {
            return root.getAsJsonObject().get(val).getAsString();
        }

        return "";
    }

    /**
     * Parse Map object to json
     * @param map
     * @return
     */
    public String mapToJson(Map<String, String> map) {
        return gson.toJson(map);
    }

    /**
     * Parse json object to Map
     * @param json
     * @return
     * @throws Exception
     */
    private Map<String, String> jsonToMap(String json) throws Exception {
        return gson.fromJson(json, new TypeToken<Map<String, String>>(){}.getType());
    }

    /**
     * Parse input stream to String
     * @param is
     * @return
     * @throws Exception
     */
    private String streamToString(InputStream is) throws Exception {
        StringBuilder sb = new StringBuilder();

        // setup charset utf-8 for parsing chinese and japanese characters.
        BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
        int line;
        char[] b = new char[1024];
        try {
            while ((line = reader.read(b)) >= 0) {
                sb.append(b, 0, line);
            }
        } catch (Exception e) {
            logger.error(e.getMessage());
        } finally {
            reader.close();
        }

        return sb.toString();
    }
}