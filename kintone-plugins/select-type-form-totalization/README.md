# Plugin Select type form totalization
First of all, this plug-in sample assumes that user freely modifies the source code and creates a plug-in.

## Descriptions
* Plugin to compute the selection fields in the kintone application.
```
Selection fields:
* Drop-down
* Multi-choice
* Radio Button
* Check box
```
```
Calculations:
* Count the values specified based on the selected values of the selected fields.
* Sum the selected values of the selection fields.
* Calculate the average of the selected values of the selection fields.
```
* Support Japanese and English (In case the user's language is Chinese, this plugin will be displayed in English).

## How to get plugin 
* Step 1: Clone the repository
```
$ cd your-working-directory
$ git clone https://github.com/cybozu/option.git
```
* Step 2: Build the plug-in package
Please use [@kintone/plugin-packer](https://www.npmjs.com/package/@kintone/plugin-packer). It requires [Node.js](https://nodejs.org/en/).

## Install Plug-in
* Using a select-type-form-totalization.plugin.zip which was created above to install the plug-in.
* Please read the guide to install plug-in in [English](https://help.cybozu.com/en/k/admin/plugin.html) or [Japanese](https://help.cybozu.com/ja/k/admin/plugin.html).

## Usage

### Form setting screen
*  Adding the Radio Button field, Check box field, Multi-choice field, Drop-down field, Number field into the form
![overview image](./readmeImage/formSetting.PNG?raw=true)
### Plugin Setting screen
* Setting the values config
![overview image](./readmeImage/pluginSetting.PNG?raw=true)
### Create record Screen
* Creating a record
![overview image](./readmeImage/setting_ssr.PNG?raw=true)
* Following the setting in Row 1, the value of Item-1 is the total "yes" of the selected values in Item-2.
* Following the setting in Row 2, the value of Item-4 is the average of the selected values of Item-5.
* Following the setting in Row 3, the value of Item-3 is the sum of the selected values of Item-5.

## License
MIT License

## Copyright
Copyright(c) Cybozu, Inc.
