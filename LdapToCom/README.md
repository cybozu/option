# LdapToCybozu
Synchronize user data from a LDAP service to Cybozu service.

## Usage
Synchronize user data from a LDAP service to Cybozu service. The user data include:
+ Private information of user such as username, password, email, language...
+ Organization which user belongs to.
+ Cybozu services which user has access right.

The program is able to run in two operations:
+ Export data from LDAP to CSV files.
+ Import data from CSV file to Cybozu service.

## How To Build
### Requirement
+ JRE 1.8, 1.10.

### Command
```bash
$ mvn install
```

## How To Run
### Requirement
+ JRE 1.8, 1.10.
+ Internet connection.

### Command
```bash
$ java -jar ./target/LdapToCybozu-jar-with-dependencies.jar connection.cfg user-map.cfg org-map.cfg -import -export
```

### Parameters
+ All configuration files must be encoded in **UTF-8**.
+ Support English, Japanese and Chinese characters.

| Name           | Required           | Description                                                                                   |
|----------------|:------------------:|-----------------------------------------------------------------------------------------------|
| connection.cfg | :heavy_check_mark: | Path of file contains domain, username, password information of both LDAP and Cybozu services |
| user-map.cfg   | :x:                | Path of file contains mapping fields of user.                                                 |
| org-map.cfg    | :x:                | Path of file contains mapping fields of group/department.                                     |
| -import        | :x:                | Omit step get data from LDAP server. Only import data from CSV files to Cybozu service        |
| -export        | :x:                | Only get data from LDAP server. Omit step import data.                                        |


:heavy_exclamation_mark: If neither **-import** nor **-export** parameter are not specified, program will not run.

:heavy_exclamation_mark: If both **-import** and **-export** parameters are specified, the operation order will be export → import. If export operation failed, import operation will not run.

### Return value
| Value | Description |
|-------|-------------|
| 0     | Success     |
| 1     | Failed      |

### Connection To LDAPs Server
LDAPs server requires certificate for establishing secure connection. Prepare below steps before starting program.

#### Get LDAPs Certificate
+ In Linux/Mac environment, run below command in terminal to connect to LDAPs server. After that, copy everything between "-----BEGIN CERTIFICATE-----" and "-----END CERTIFICATE-----" (including these delimiters) and paste it in a new text file named ldapserver.pem
+ In Window, use a Linux simulator like Git-bash or MingGW.

```bash
$ openssl s_client -connect ldap_host:636
```

:information_source: 636 is default port of LDAPs service. This number may be different based on setting of LDAPs server.

#### Import Certificate To JVM
+ Because this tool is developed by Java and run on JVM, the LDAPs certificate must be imported to JVM.
+ The file contains all Java certificates is name **cacerts**. Normally, it locates in %JAVA_HOME%\lib\security folder.
+ Run below command to import LDAPs certificate.

```bash
$ cd %JAVA_HOME%\bin
$ keytool.exe -import -alias ldaps -file ldapserver.pem -keystore ..\lib\security\cacerts
```
:heavy_exclamation_mark: This action may need computer's admin right to modify **cacerts** file.

## Configuration
+ This program needs information about connection, mapping fields to run properly.
+ Because there are a lot of required config info, the configuration are put in text files.
+ The format for each row will be "key=value".
+ The detail configuration fields are described as below.

### Connection config file
+ Contains information about connection to services with some addition options.
+ These options are put in a text file. The location of this file will be passed as first parameter when starting tool.

#### LDAP config fields
+ Required when **-export** param is specified.

| Name          | Description                                                                                                                      |
|---------------|----------------------------------------------------------------------------------------------------------------------------------|
| Ldap Url      | Server's url. The value has format ldap://host:port. <li>LDAP has default port is **389**.<li>LDAPs has default port is **636**. |
| Ldap Account  | Account name.                                                                                                                    |
| Ldap Password | Password                                                                                                                         |
| User Dn       | Path to folder contains users.                                                                                                   |
| Ldap Filter   | Filter for getting users. The syntax based on **RFC2254**.                                                                       |

#### Cybozu config fields
+ Required when **-import** param is specified.

| Name            | Description                  |
|-----------------|------------------------------|
| Cybozu Domain   | Cybozu domain.               |
| Cybozu Account  | Cybozu account.              |
| Cybozu Password | Password for cybozu account. |

#### Proxy
+ Required when the program run after proxy or firewall.

| Name       | Description     |
|------------|-----------------|
| Proxy Host | Url of proxy.   |
| Proxy Port | Port of proxy.  |

#### Other config fields
+ Optional

| Name            | Description                  |
|-----------------|------------------------------|
| Variable | If true, the import will succeeds event if the customization item value is excess or deficiency.<br>Default value is **false**. |
| Ldap Type | Define the type of LDAP service. This setting affects the field value Status of user in CSV data file.<br>There are two options:<li>**AD**: Microsoft Directory service<li>**OTHER**: Other LDAP service type.<br>Default type is **OTHER**. |
| Status Flag | Only necessary when **Ldap Type** has value **OTHER**. If **Ldap Type** has value **AD**, this setting will be ignored.<br>Define the value which will be compared to Ldap attribute to determine the value of **Status** field.<li>If the value equals the LDAP attribute value → **Status** flag has value **disabled**.<li>Otherwise, the value is **enabled**.<br>Default value is empty string. |
| Default Service Code | Set default Cybozu service for user.<br>There are 5 options<li>**ki**: kintone<li>**gr**: garoon<li>**of**: office<li>**mw**: mailwise<li>**sa**: secure access<br>Multiple values can be declared with comma as separator. |

#### Example
```
# LDAP configuration
# Ldap Url=ldaps://localhost:636
Ldap Url=ldap://localhost:389
# Ldap Account=cn=admin,dc=example,dc=com
Ldap Account=admin@example.com
Ldap Password=1234
User Dn=ou=People,dc=example,dc=com
Ldap Filter=(objectclass=user)

# Cybozu configuration
Cybozu Domain=https://example.kintone.com
Cybozu Account=admin
Cybozu Password=1234

# Proxy
Proxy Host=10.224.8.152
Proxy Port=8080

# Status value
# Ldap Type=AD
Ldap Type=OTHER
Status Flag=514

# Service code
Default Service Code=ki,gr,of,mw,sa

# Other
Variable=true
```
### User mapping fields file

Contains mapping information of user between LDAP and Cybozu services.
+ If key is missing, the config row will be omitted.
+ If value is missing, '*' character will be added in row data in CSV files.

#### Default fields

+ The keys are same as header row in the User Template file.
+ If field name are not specified, it value will be '*' character.
+ Required fields must be declared and their value must not be empty or '*'.

| Number | Name                        | Required           |
|:------:|:----------------------------|:------------------:|
| 1      | Login Name                  | :heavy_check_mark: |
| 2	     | Display Name                | :heavy_check_mark: |
| 3	     | New Login Name              | :heavy_check_mark: |
| 4      | Password                    | :x:                |
| 5      | Surname                     | :x:                |
| 6      | Given Name                  | :x:                |
| 7      | Phonetic Surname            | :x:                |
| 8      | Phonetic Given Name         | :x:                |
| 9      | Localized Name              | :x:                |
| 10     | Language for Localized Name | :x:                |
| 11     | E-mail Address              | :x:                |
| 12     | Status                      | :x:                |
| 13     | Language                    | :x:                |
| 14     | Time Zone                   | :x:                |
| 15     | Phone                       | :x:                |
| 16     | Extension                   | :x:                |
| 17     | Mobile Phone                | :x:                |
| 18     | URL                         | :x:                |
| 19     | Employee ID                 | :x:                |
| 20     | Hire Date                   | :x:                |
| 21     | Birthday                    | :x:                |
| 22     | About Me                    | :x:                |
| 23     | Display Order               | :x:                |
| 24     | Skype Name                  | :x:                |
| 25     | To Be Deleted               | :x:                |

#### Custom fields
+ All customized fields must be declared in configuration file.
+ The customized field is declared by key '**User Info [index]**'.

:information_source: To get **Groups and Roles Template**, go to **User & System Administration** → **User Administration** → **Bulk Actions** → **Export To File**. Choose **Contents to Export** with value **Users** then click **Export**.

#### Example
```
# Required fields
Login Name=sAMAccountName
Display Name=displayName
New Login Name=sAMAccountName

Password=password

Surname=sn

Given Name=givenName

Phonetic Surname=msDS-PhoneticLastName

Phonetic Given Name=msDS-PhoneticFirstName

E-mail Address=mail

Status=userAccountControl

Hire Date=

To Be Deleted=

URL=wWWHomePage

About Me=description

Mobile Phone=mobile

# Postal Code custom field
User Info 1=postalCode
```

### Organization data
+ Contains mapping information organization which user belongs to between LDAP and Cybozu services.
+ Accepts below fields
    1. Department Code
    2. Job Title Code
+ If key or value is missing, the config row will be omitted.
+ If value is '*' character, the config row will be omitted.

#### Example
```
Department Code=department

Job Title Code=title
```

:information_source: To get **Groups and Roles Template**, go to **User & System Administration** → **User Administration** → **Bulk Actions** → **Export To File**. Choose **Contents to Export** with value **Membership** then click **Export**.