(function(GRNAPI, GAPI, $) {
  'use strict';

  if (GRNAPI === null) {
    return;
  }

  const configs = {
    google: {
      clientId: '',
      accounts: [
      ]}
  };

  let gcalendarAPI;
  const grnScheduleService = {
    setting: {
      lang: 'en',
      i18n: {},
      google: configs.google
    },
    lang: {
      en: {
        message: {
          button: {
            registerCalendar: 'Register video conferencing'
          },
          label: {
            joinVideo: 'Click here to join video conferencing:'
          },
          error: {
            'E1001': 'Fail to login into google.',
            'E1002': 'Can not register google calendar.Please login with correct google account.',
            'E1003': 'Fail to register google calendar.',
            'E1004': 'Fail to register video conference.',
            'E1005': 'Fail to save video conference url into Garoon.',
            'E1006': 'Current user is denied to access Google calendar.Please check Current user\'s access scopes.'
          }
        }
      },
      ja: {
        message: {
          button: {
            registerCalendar: 'ビデオ会議登録'
          },
          label: {
            joinVideo: 'リンクをクリックしてビデオ会議に参加します。'
          },
          error: {
            'E1001': 'Googleへのログインに失敗しました。',
            'E1002': 'このアカウントはGoogle Calendarに登録することができません。正しいGoogleアカウントでログインしてください。',
            'E1003': 'Google Calendarの登録に失敗しました。',
            'E1004': 'ビデオ会議の登録に失敗しました。',
            'E1005': 'Garoonへのビデオ会議のURLの保存に失敗しました。',
            'E1006': 'ユーザーにGoogle Calendarへのアクセス権限が与えられていません。ユーザーのアクセススコープをチェックしてください。'
          }
        }
      },
    },
    data: {
      appointment: {}
    },
    controls: {
      container: null,
      registerBtn: null,
      conference: {
        container: null,
        link: null,
      },
      conferenceLinkContainer: null,
      conferenceLink: null,
      template: {
        container: '<div class="google-conferencing-container margin_b10_grn_kit"></div>',
        registerBtn: '<button class="customization-btn google-conferencing-btn button_normal_sub_grn_kit"></button>',
        conference: '<div class="conferencing-link-container"><span class="label font_normal_grn_kit"></span><br/><span><a class="link font_normal_grn_kit" target="_blank" itemprop="autolink"></a></span></div>'
      },
      init: function() {
        this.container = $(this.template.container);
        this.registerBtn = $(this.template.registerBtn);
        this.conference.container = $(this.template.conference);
        this.container.append(this.registerBtn).append(this.conference.container);
      }
    },
    createControls: function() {
      const headerSpaceElement = GRNAPI.schedule.event.getHeaderSpaceElement();

      this.controls.init();
      this.controls.registerBtn.text(this.setting.i18n.message.button.registerCalendar);
      this.controls.conference.container.find('.label').text(this.setting.i18n.message.label.joinVideo);
      this.controls.conference.link = this.controls.conference.container.find('.link');
      const hangoutUrl = this.data.appointment.additionalItemValue;
      this.controls.conference.link.attr('href', hangoutUrl).text(hangoutUrl);

      if (this.hasHangoutUrl()) {
        this.controls.registerBtn.hide();
        this.controls.conference.container.show();
      } else {
        this.controls.registerBtn.show();
        this.controls.registerBtn.click(this.handleRegisterBtnCLick);
        this.controls.conference.container.hide();
      }

      this.controls.container.appendTo(headerSpaceElement);
    },
    init: function() {
      const self = this;

      GRNAPI.events.on('schedule.event.create.show', function(event) {
        const appointment = event.event;
        if (appointment.eventType === 'REGULAR' && appointment.additionalItems.item.value !== '') {
          appointment.additionalItems.item.value = '';
        }
        return event;
      });

      GRNAPI.events.on('schedule.event.detail.show', function(event) {
        const appointment = event.event;
        if (appointment.eventType !== 'REGULAR') {
          return;
        }
        self.initAppointmentData(appointment);
        self.createControls();
        if (!self.hasHangoutUrl()) {
          gcalendarAPI.init();
        }
      });
    },
    initAppointmentData: function(appointment) {
      this.setting.lang = GRNAPI.base.user.getLoginUser().language || 'en';
      this.setting.i18n = this.setting.lang in this.lang ? this.lang[this.setting.lang] : this.lang.ja;
      this.data.appointment.eventId = appointment.id;
      this.data.appointment.eventType = appointment.eventType;
      this.data.appointment.additionalItemValue = appointment.additionalItems.item.value;
      if (appointment.eventMenu === '') {
        this.data.appointment.title = appointment.subject;
      } else {
        this.data.appointment.title = appointment.eventMenu + ':' + appointment.subject;
      }
      this.data.appointment.start = appointment.start;
      this.data.appointment.end = appointment.end;
      if (!this.data.appointment.end || typeof (this.data.appointment.end) === 'undefined') {
        const startDt = this.data.appointment.start.dateTime.toString();
        const endDt = startDt.slice(0, 11) + '23:59:59' + startDt.slice(19, 6);
        const endObject = {};
        endObject.dateTime = endDt;
        endObject.timeZone = this.data.appointment.start.timeZone;
        this.data.appointment.end = endObject;
      }
    },
    hasHangoutUrl: function() {
      return !(this.data.appointment.additionalItemValue === '');
    },
    showErrorMsg: function(msg, additionalMsg) {
      const hasAdditionalMsg = additionalMsg && additionalMsg !== '';
      const alertMsg = hasAdditionalMsg ? msg + '(' + additionalMsg + ')' : msg;
      alert(alertMsg);
    },
    isAllowedGoogleAccount: function(gAccountStr) {
      const accountList = this.setting.google.accounts;
      if (accountList.length === 0) {
        return true;
      }
      for (let i = 0; i < accountList.length; i++) {
        if (gAccountStr === accountList[i]) {
          return true;
        }
      }
      return false;
    },
    handleRegisterBtnCLick: function(el) {
      const isSignedIn = GAPI.auth2.getAuthInstance().isSignedIn.get();
      if (isSignedIn === false) {
        GAPI.auth2.getAuthInstance().signIn().then(
          function(successResopnse) {
            grnScheduleService.updateSigninStatus();
          },
          function(failResopnse) {
            grnScheduleService.showErrorMsg(grnScheduleService.setting.i18n.message.error.E1001);
          });
        return;
      }

      grnScheduleService.updateSigninStatus();
    },
    updateSigninStatus: function() {
      const isSignedIn = GAPI.auth2.getAuthInstance().isSignedIn.get();
      if (isSignedIn && grnScheduleService.isValidUserProfile()) {
        gcalendarAPI.createGoogleCalendar(this.data.appointment);
      }
    },
    isValidUserProfile: function() {
      const googleUser = GAPI.auth2.getAuthInstance().currentUser.get();
      if (googleUser.getId() === null) {
        grnScheduleService.showErrorMsg(grnScheduleService.setting.i18n.message.error.E1001);
        return false;
      }

      const profile = googleUser.getBasicProfile();
      const email = profile.getEmail();
      const isAllowedGoogleAccount = grnScheduleService.isAllowedGoogleAccount(email);
      if (!isAllowedGoogleAccount) {
        grnScheduleService.showErrorMsg(grnScheduleService.setting.i18n.message.error.E1002);
        googleUser.disconnect();
        return false;
      }

      const hasGrantedCalendarScope = googleUser.hasGrantedScopes(gcalendarAPI.CONST.SCOPES);
      if (!hasGrantedCalendarScope) {
        grnScheduleService.showErrorMsg(grnScheduleService.setting.i18n.message.error.E1006);
        googleUser.disconnect();
        return false;
      }
      return true;
    },
    registerHangoutUrl: function(hangoutUrl) {
      grnScheduleService.data.appointment.additionalItemValue = hangoutUrl;

      const token = GRNAPI.base.request.getRequestToken();
      const body = {
        '__REQUEST_TOKEN__': token,
        'additionalItems': {
          'item': {
            'value': hangoutUrl
          }
        }
      };

      $.ajax({
        url: '/g/api/v1/schedule/events/' + grnScheduleService.data.appointment.eventId,
        data: JSON.stringify(body),
        type: 'PATCH',
        beforeSend: function(request) {
          request.setRequestHeader('Content-Type', 'application/json');
          request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        },
        success: function(xhr, textStatus, jqXHR) {
          grnScheduleService.controls.conference.link.attr('href', hangoutUrl).text(hangoutUrl);
          grnScheduleService.controls.conference.container.show();
          grnScheduleService.controls.registerBtn.hide();
        },
        error: function(jqXHR, textStatus, errorThrown) {
          grnScheduleService.showErrorMsg(grnScheduleService.setting.i18n.message.error.E1005);
        }
      });
    }
  };

  gcalendarAPI = {
    CONST: {
      CLIENT_ID: grnScheduleService.setting.google.clientId,
      DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
      SCOPES: 'https://www.googleapis.com/auth/calendar'
    },
    init: function() {
      GAPI.load('client:auth2', function(e) {
        return GAPI.client.init({
          discoveryDocs: gcalendarAPI.CONST.DISCOVERY_DOCS,
          clientId: gcalendarAPI.CONST.CLIENT_ID,
          scope: gcalendarAPI.CONST.SCOPES
        });
      });
    },
    createGoogleCalendar: function(grnAppointmentData) {
      const event = {
        // Title of the event.
        'summary': grnAppointmentData.title,
        // Geographic location of the event as free-form text. Optional.
        'location': '',
        // Description of the event. Optional.
        'description': '',
        'start': grnAppointmentData.start,
        'end': grnAppointmentData.end,
        'recurrence': [
          'RRULE:FREQ=DAILY;COUNT=1'
        ]
      };
      const request = GAPI.client.calendar.events.insert({
        'calendarId': 'primary',
        'resource': event
      });

      request.execute(function(gcalendarEvent) {
        if (typeof (gcalendarEvent.error) !== 'undefined') {
          grnScheduleService.showErrorMsg(grnScheduleService.setting.i18n.message.error.E1003, gcalendarEvent.error.message);
          return;
        }
        if (typeof (gcalendarEvent.hangoutLink) !== 'undefined') {
          grnScheduleService.registerHangoutUrl(gcalendarEvent.hangoutLink);
          return;
        }

        gcalendarAPI.createGoogleHangoutMeeting(gcalendarEvent, null);
      });
    },
    createGoogleHangoutMeeting: function(gcalendarEvent, requestId) {
      let eventRequestId = requestId;
      if (eventRequestId == null) {
        const googleUser = GAPI.auth2.getAuthInstance().currentUser.get();
        let googleUserId = '';
        if (googleUser.getId() != null) {
          googleUserId = googleUser.getId();
        }
        eventRequestId = googleUserId + '#' + (new Date()).getTime();
      }

      const eventPatch = {
        conferenceData: {
          createRequest: {requestId: eventRequestId}
        }
      };
      GAPI.client.calendar.events.patch({
        calendarId: 'primary',
        eventId: gcalendarEvent.id,
        resource: eventPatch,
        sendNotifications: true,
        conferenceDataVersion: 1
      }).execute(function(ghangoutMeetingEvent) {
        const statusCode = ghangoutMeetingEvent.conferenceData.createRequest.status.statusCode;
        switch (statusCode) {
          case 'success':
            grnScheduleService.registerHangoutUrl(ghangoutMeetingEvent.hangoutLink);
            break;
          case 'pending':
            gcalendarAPI.createGoogleHangoutMeeting(gcalendarEvent, requestId);
            break;
          case 'failure':
            grnScheduleService.showErrorMsg(grnScheduleService.setting.i18n.message.error.E1004);
            break;
        }
      });
    }
  };

  grnScheduleService.init();
}(window.garoon || null, window.gapi, window.jQuery));