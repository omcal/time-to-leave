'use strict';

const { ipcRenderer } = require('electron');

import { validateTime } from './time-math.js';
import { isValidTheme } from '../renderer/themes.js';
import { getLanguagesCodes } from '../src/configs/app.config.js';

// Lazy loaded modules
let fs = null;
function getFs()
{
    if (fs === null)
    {
        fs = require('fs');
    }
    return fs;
}

function isValidLocale(locale)
{
    return getLanguagesCodes().indexOf(locale) !== -1;
}

const defaultPreferences = {
    'count-today': false,
    'close-to-tray': true,
    'minimize-to-tray': true,
    'hide-non-working-days': false,
    'hours-per-day': '08:00',
    'enable-prefill-break-time': false,
    'break-time-interval': '00:30',
    'notification': true,
    'repetition': true,
    'notifications-interval': '5',
    'start-at-login': false,
    'theme': 'system-default',
    'overall-balance-start-date': '2019-01-01',
    'update-remind-me-after': '2019-01-01',
    'working-days-monday': true,
    'working-days-tuesday': true,
    'working-days-wednesday': true,
    'working-days-thursday': true,
    'working-days-friday': true,
    'working-days-saturday': false,
    'working-days-sunday': false,
    'view': 'month',
    'language': 'en'
};

// Handle Boolean Inputs
const booleanInputs = [
    'count-today',
    'close-to-tray',
    'minimize-to-tray',
    'hide-non-working-days',
    'enable-prefill-break-time',
    'notification',
    'repetition',
    'start-at-login',
    'working-days-monday',
    'working-days-tuesday',
    'working-days-wednesday',
    'working-days-thursday',
    'working-days-friday',
    'working-days-saturday',
    'working-days-sunday',
];

const timeInputs = [
    'notifications-interval',
    'hours-per-day',
    'break-time-interval',
];

const isNotBoolean = (val) => typeof val !== 'boolean';
const isNotificationInterval = (val) => !Number.isNaN(Number(val)) && isNotBoolean(val) && val >= 1 && val <= 30;

/*
 * Returns the preference file path, considering the userData path
 */
function getPreferencesFilePath()
{
    const path = require('path');
    const electron = require('electron');
    const userDataPath = (electron.app || electron.remote.app).getPath('userData');
    return path.join(userDataPath, 'preferences.json');
}

function getPreferencesFilePathPromise()
{
    return new Promise((resolve) =>
    {
        ipcRenderer.invoke('USER_DATA_PATH').then(userDataPath =>
        {
            const path = require('path');
            resolve(path.join(userDataPath, 'preferences.json'));
        });
    });
}

/*
 * Saves preferences to file, returns an error on failure.
 */
function savePreferences(preferencesOptions, filePath = getPreferencesFilePath())
{
    try
    {
        getFs().writeFileSync(filePath, JSON.stringify(preferencesOptions));
    }
    catch (err)
    {
        return new Error(err);
    }
    return true;
}

/**
 * Loads preference from file.
 * @return {Object}
 */
function readPreferences(filePath = getPreferencesFilePath())
{
    let preferences;
    try
    {
        preferences = JSON.parse(getFs().readFileSync(filePath));
    }
    catch (err)
    {
        preferences = {};
    }
    return preferences ? preferences : {};
}

function getDerivedPrefsFromLoadedPrefs(loadedPreferences)
{
    const derivedPreferences = {};
    Object.keys(defaultPreferences).forEach(function(key)
    {
        derivedPreferences[key] = (typeof loadedPreferences[key] !== 'undefined') ? loadedPreferences[key] : defaultPreferences[key];
    });

    return derivedPreferences;
}

/*
 * initializes users preferences if it is not already exists
 * or any keys of existing preferences is invalid
 */
function initPreferencesFileIfNotExistsOrInvalid(filePath = getPreferencesFilePath())
{
    if (!getFs().existsSync(filePath))
    {
        savePreferences(defaultPreferences);
        return;
    }

    let shouldSaveDerivedPrefs = false;
    const loadedPrefs = readPreferences(filePath);
    const derivedPrefs = getDerivedPrefsFromLoadedPrefs(loadedPrefs);
    const loadedPref = Object.keys(loadedPrefs).sort();
    const derivedPrefsKeys = Object.keys(derivedPrefs).sort();

    // Validate keys
    if (JSON.stringify(loadedPref) !== JSON.stringify(derivedPrefsKeys))
    {
        shouldSaveDerivedPrefs = true;
    }

    // Validate the values
    for (const key of derivedPrefsKeys)
    {
        const value = derivedPrefs[key];

        if (isNotBoolean(value) && booleanInputs.includes(key))
        {
            derivedPrefs[key] = defaultPreferences[key];
            shouldSaveDerivedPrefs = true;
        }

        if (timeInputs.includes(key))
        {
            // Set default preference value if notification or time interval is not valid
            if ((key === 'notifications-interval' && !isNotificationInterval(value)) || !validateTime(value))
            {
                derivedPrefs[key] = defaultPreferences[key];
                shouldSaveDerivedPrefs = true;
            }
        }

        const inputEnum = {
            'theme': () => shouldSaveDerivedPrefs |= !isValidTheme,
            'view': () => shouldSaveDerivedPrefs |= !(value === 'month' || value === 'day'),
            'language': () => shouldSaveDerivedPrefs |= isValidLocale
        };
        if (key in inputEnum) inputEnum[key]();
    }

    if (shouldSaveDerivedPrefs)
    {
        savePreferences(derivedPrefs, filePath);
    }

}

/**
 * Returns the user preferences.
 * @return {{string: any}} Associative array of user settings
 */
function getLoadedOrDerivedUserPreferences()
{
    initPreferencesFileIfNotExistsOrInvalid();
    return readPreferences();
}

function getUserPreferencesPromise()
{
    return new Promise((resolve) =>
    {
        getPreferencesFilePathPromise().then((filePath) =>
        {
            initPreferencesFileIfNotExistsOrInvalid(filePath);
            resolve(readPreferences(filePath));
        });
    });
}

/*
 * Returns true if the notification is enabled in preferences.
 */
function notificationIsEnabled()
{
    const preferences = getLoadedOrDerivedUserPreferences();
    return preferences['notification'];
}

/*
 * Returns true if we should display week day.
 */
function showWeekDay(weekDay, preferences = undefined)
{
    if (preferences === undefined)
    {
        preferences = getLoadedOrDerivedUserPreferences();
    }
    switch (weekDay)
    {
    case 0: return preferences['working-days-sunday'];
    case 1: return preferences['working-days-monday'];
    case 2: return preferences['working-days-tuesday'];
    case 3: return preferences['working-days-wednesday'];
    case 4: return preferences['working-days-thursday'];
    case 5: return preferences['working-days-friday'];
    case 6: return preferences['working-days-saturday'];
    }
}

/*
 * Returns true if we should display day.
 * @note: The month should be 0-based (i.e.: 0 is Jan, 11 is Dec).
 */
function showDay(year, month, day, preferences = undefined)
{
    const currentDay = new Date(year, month, day), weekDay = currentDay.getDay();
    return showWeekDay(weekDay, preferences);
}

function switchCalendarView()
{
    const preferences = getLoadedOrDerivedUserPreferences();
    if (preferences['view'] === 'month')
    {
        preferences['view'] = 'day';
    }
    else
    {
        preferences['view'] = 'month';
    }
    savePreferences(preferences);

    return preferences;
}

function getDefaultWidthHeight()
{
    const preferences = getLoadedOrDerivedUserPreferences();
    if (preferences['view'] === 'month')
    {
        return { width: 1010, height: 800 };
    }
    else
    {
        return { width: 500, height: 500 };
    }
}


/*
 * Returns the value of language in preferences.
 */
function getUserLanguage()
{
    const preferences = getLoadedOrDerivedUserPreferences();
    return preferences['language'];
}

/*
 * Returns the value of notification-interval in preferences.
 */
function getNotificationsInterval()
{
    const preferences = getLoadedOrDerivedUserPreferences();
    return preferences['notifications-interval'];
}

/*
 * Returns true if repetition is enabled in preferences.
 */
function repetitionIsEnabled()
{
    const preferences = getLoadedOrDerivedUserPreferences();
    return preferences['repetition'];
}

/*
 * Resets the preferences to their default value.
 */
function resetPreferences()
{
    savePreferences(defaultPreferences);
}

export {
    defaultPreferences,
    getDefaultWidthHeight,
    getLoadedOrDerivedUserPreferences as getUserPreferences,
    getUserPreferencesPromise,
    getUserLanguage,
    getNotificationsInterval,
    getPreferencesFilePath,
    savePreferences,
    showDay,
    switchCalendarView,
    isNotBoolean,
    isNotificationInterval,
    notificationIsEnabled,
    repetitionIsEnabled,
    resetPreferences
};
