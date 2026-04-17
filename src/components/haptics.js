/* global AFRAME */

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

/**
 * Haptics component for A-Frame.
 */
AFRAME.registerComponent('haptics', {
  schema: {
    actuatorIndex: {default: 0},
    dur: {default: 100},
    enabled: {default: true},
    events: {type: 'array'},
    eventsFrom: {type: 'string'},
    force: {default: 1}
  },

  multiple: true,

  init: function () {
    var data = this.data;
    var i;
    var self = this;

    this.callPulse = function () { self.pulse(); };

    var doInit = function () {
      // aframe-haptics-component 1.6.3 with
      // workaround to get the correct gamepad when controller reconnect, this has been fixed in recent aframe version with
      // those two changes
      // aframe 1.7.0 https://github.com/aframevr/aframe/commit/fd9043482554384ca4932cb9b5ac7e00f3c21074
      // and
      // aframe 1.8.0 https://github.com/aframevr/aframe/pull/5804
      // Read fresh inputSources directly from the xrSession to avoid the
      // system's potentially stale 500ms-polled controller list.
      var xrSession = self.el.sceneEl.xrSession;
      var controllers = xrSession && xrSession.inputSources;
      if (!controllers || !controllers.length) { return; }
      var data = self.el.components['tracked-controls-webxr'].data;
      var controller = AFRAME.utils.trackedControls.findMatchingControllerWebXR(
        controllers, data.id, data.hand, data.index,
        data.iterateControllerProfiles, data.handTrackingEnabled);
      if (!controller) { return; }
      self.el.components['tracked-controls-webxr'].controller = controller;
      self.el.components['tracked-controls'].controller = controller;
      self.gamepad = controller.gamepad || controller;
      if (!self.gamepad || !self.gamepad.hapticActuators ||
          !self.gamepad.hapticActuators.length) { return; }
      self.addEventListeners();
    };

    // There may exist a tracked-controls when this component is initialized
    if (this.el.components['tracked-controls'] && this.el.components['tracked-controls'].controller) {
      doInit();
    } else {
      this.el.addEventListener('controllerconnected', function init () {
        doInit();
      });
    }
  },

  remove: function () {
    this.removeEventListeners();
  },

  pulse: function (force, dur) {
    var actuator;
    var data = this.data;
    if (!data.enabled || !this.gamepad || !this.gamepad.hapticActuators) { return; }
    actuator = this.gamepad.hapticActuators[data.actuatorIndex];
    actuator.pulse(force || data.force, dur || data.dur);
  },

  addEventListeners: function () {
    var data = this.data;
    var i;
    var listenTarget;

    listenTarget = data.eventsFrom ? document.querySelector(data.eventsFrom) : this.el;
    for (i = 0; i < data.events.length; i++) {
      listenTarget.addEventListener(data.events[i], this.callPulse);
    }
  },

  removeEventListeners: function () {
    var data = this.data;
    var i;
    var listenTarget;

    listenTarget = data.eventsFrom ? document.querySelector(data.eventsFrom) : this.el;
    for (i = 0; i < data.events.length; i++) {
      listenTarget.removeEventListener(data.events[i], this.callPulse);
    }
  }
});
