import clock from "clock";
import document from "document";
import { HeartRateSensor } from "heart-rate";
import { display } from "display";
import { me } from "appbit";
import { today } from "user-activity";

// Update the clock every second
clock.granularity = "seconds";

let hourHand = document.getElementById("hours");
let minHand = document.getElementById("mins");
let secHand = document.getElementById("secs");

// Returns an angle (0-360) for the current hour in the day, including minutes
function hoursToAngle(hours, minutes) {
  let hourAngle = (360 / 12) * hours;
  let minAngle = (360 / 12 / 60) * minutes;
  return hourAngle + minAngle;
}

// Returns an angle (0-360) for minutes
function minutesToAngle(minutes) {
  return (360 / 60) * minutes;
}

// Returns an angle (0-360) for seconds
function secondsToAngle(seconds) {
  return (360 / 60) * seconds;
}

// Rotate the hands every tick
function updateClock() {
  let today = new Date();
  let hours = today.getHours() % 12;
  let mins = today.getMinutes();
  let secs = today.getSeconds();

  hourHand.groupTransform.rotate.angle = hoursToAngle(hours, mins);
  minHand.groupTransform.rotate.angle = minutesToAngle(mins);
  secHand.groupTransform.rotate.angle = secondsToAngle(secs);
  updateSteps();
  requestAnimationFrame(updateClock);
}

// Update the clock every tick event
clock.ontick = () => updateClock();

// Steps Stuff

let steps = document.getElementById("steps-today");

function updateSteps(){
  if (me.permissions.granted("access_activity")){
    steps.text = today.local.steps;
  }
}

// Cool HRM Stuff - https://github.com/KiezelPay/Fitbit_Realistic_HRM

var hrImage = document.getElementById("hrImage");
var hrIcon = document.getElementById("hrIcon");
var hrText = document.getElementById("hrText");

var hrm = null;
var lastMeasuredHR = 0;
var timeOfLastMeasuredHR = 0;
var lastHRMReading = 0;
var hrmActive = false;
var hrTimer = null;

function getHRMReading() {
  let timeToNextReading = 1000;   //check every second even when no HR is detected
  
  let now = new Date().getTime();
  let hr = hrm.heartRate;
  if (hrm.timestamp === lastHRMReading || !hr) {
    if (now - timeOfLastMeasuredHR >= 3000) {
      //more then 3 seconds no new HR reading, watch probably off wrist
      if (hrmActive) {
        //show as not active
        hrmActive = false;
        setHRIconColor();
        showHRMValue("--");
      }
    }
    else {
      //no new reading, but less then 3 seconds ago we still had a valid reading, so keep animating at same speed
      timeToNextReading = 60000/lastMeasuredHR;
    }
  } else {
    //new reading
    if (!hrmActive) {
      hrmActive = true;
      setHRIconColor();
    }

    //store last measured to use when we get no new readings next time
    timeOfLastMeasuredHR = now;
    lastMeasuredHR = hr;
    showHRMValue(lastMeasuredHR);
    timeToNextReading = 60000/lastMeasuredHR;
  }
  lastHRMReading = hrm.timestamp;
  
  //animate when active
  if (hrmActive) {
    hrImage.animate("enable");
  }
  
  //set next reading timeout depending on HR
  if (hrTimer) {
    clearTimeout(hrTimer);
    hrTimer = null;
  }
  hrTimer = setTimeout(getHRMReading, timeToNextReading);
}

function setHRIconColor() {
  if (hrmActive) {
    hrIcon.style.fill = "white";
  }
  else {
    hrImage.animate("disable");
    hrIcon.style.fill = "dimgrey";
  }
}

function showHRMValue(newHRMValue) {
  hrText.text = newHRMValue;
}

function startHRMeasurements() {
  if (hrm) {
    if (hrmActive) {
      timeOfLastMeasuredHR = new Date().getTime();    //make sure the icon doesn't show as gray after the screen was off a long time
    }
    hrm.start();
    getHRMReading();
  }
}

function stopHRMeasurements() {
  if (hrTimer) {
    clearTimeout(hrTimer);
    hrTimer = null;
  }
  if (hrm) {
    hrm.stop();
  }
}

function initialize() {
  hrText.text = '--';
  if (me.permissions.granted("access_heart_rate")) {
    hrm = new HeartRateSensor();
    if (display.on) {
      //already start measurements
      startHRMeasurements();
    }
  }

  //react on display on/off
  display.onchange = function() {
    if (display.on) {
      startHRMeasurements();
    } else {
      stopHRMeasurements();
    }
  }
}

initialize();
