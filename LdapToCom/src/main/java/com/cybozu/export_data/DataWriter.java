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

package com.cybozu.export_data;

import java.io.BufferedWriter;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;

import org.apache.log4j.Logger;

/**
 * This class is use for writing data to file
 */
public class DataWriter {
    private static Logger logger = Logger.getLogger(DataExporter.class);

    protected String fileName;

    private FileOutputStream fo;
    private OutputStreamWriter ow;
    private BufferedWriter bw;

    public DataWriter(String fileName) {
        this.fileName = fileName;
    }

    private void init() throws IOException {
        fo = new FileOutputStream(this.fileName);
        ow = new OutputStreamWriter(fo, StandardCharsets.UTF_8);
        bw = new BufferedWriter(ow);
    }

    public void writeData(String rowData) throws IOException {
        if (rowData == null || rowData.isEmpty()) {
            return;
        }

        if (bw == null) {
            init();
        }

        bw.write(rowData + "\n");
    }

    public void close() {
        try {
            if (bw != null) {
                bw.close();
            }

            if (ow != null) {
                ow.close();
            }

            if (fo != null) {
                fo.close();
            }
        } catch (IOException e) {
            logger.error(e);
        }
    }
}
