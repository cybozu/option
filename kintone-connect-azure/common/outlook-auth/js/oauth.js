/* global Msal */
(function() {
    'use strict';

    var KAC = window.kintoneAzureConnect;

    var azureOauth = {

        userAgentApplication: null,

        getUserInfo: function() {
            return this.userAgentApplication.getUser();
        },

        init: function() {
            this.userAgentApplication = new Msal.UserAgentApplication(KAC.azure.clientId, null, function(
                errorDes, token, error, tokenType) {});
            return this.userAgentApplication.getUser();
        },

        signIn: function() {
            var self = this;
            return self.userAgentApplication.loginPopup(KAC.azure.access);
        },

        signOut: function() {
            var self = this;
            self.userAgentApplication.logout();
        },

        callGraphApi: function() {
            var self = this;
            return self.userAgentApplication.acquireTokenSilent(KAC.azure.graphApiScorp);
        }
    };

    window.azureOauth = azureOauth || {};
}());
