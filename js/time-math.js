'use strict';

/**
 * Formats hour, min into string HH:MM
 */
function hourMinToHourFormatted(hours, minutes)
{
    const paddingHour = hours < 10 ?  '0' : '';
    const paddingMin = minutes < 10 ?  '0' : '';
    return paddingHour + hours +
           ':' +
           paddingMin + minutes;
}

/**
 * Determines if a time string holds a negative value
 */
function isNegative(str)
{
    return str[0] === '-';
}

/**
 * Converts hour to min.
 * Hours must be formated as HH:MM
 */
function hourToMinutes(time)
{
    const st = time.split(':');
    const isNeg = isNegative(time);
    st[0] = isNeg ? st[0].substr(1) : st[0];

    let min = Number(st[1]) + (Number(st[0]) * 60);
    if (isNeg)
    {
        min = min * -1;
    }
    return min;
}

/**
 * Formats a given amount of minutes into string HH:MM
 */
function minutesToHourFormatted(min)
{
    const signStr = min < 0 ? '-' : '';
    if (min < 0)
    {
        min = Math.abs(min);
    }
    const hours = Math.floor(min / 60);
    const minutes = Math.floor(min - (hours * 60));
    return signStr + hourMinToHourFormatted(hours, minutes);
}

/**
 * Subtracts time first from second (t2 - t1)
 * Time should be formated as HH:MM
 */
function subtractTime(t1, t2)
{
    const diffMin = hourToMinutes(t2) - hourToMinutes(t1);
    return minutesToHourFormatted(diffMin);
}

/**
 * Multiplies t * n
 * Time should be formated as HH:MM
 */
function multiplyTime(t, n)
{
    let totalMin = hourToMinutes(t);
    totalMin = totalMin * n;
    return minutesToHourFormatted(totalMin);
}

/**
 * Sums time first to second (t1 + t2)
 * Time should be formated as HH:MM
 */
function sumTime(t1, t2)
{
    const sumMin = hourToMinutes(t2) + hourToMinutes(t1);
    return minutesToHourFormatted(sumMin);
}

/**
 * Validates that a string is a valid time, following the format of HH:MM
 * @returns true if it's valid
 */
function validateTime(time)
{
    const re = new RegExp('^-?(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$');
    return re.test(time);
}

/**
 * Get a difference between two dates.
 * date1, or date2 should be javascript Date instance.
 * @return Number
 */
function diffDays(date1, date2)
{
    const diffTime = date2 - date1;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export {
    hourMinToHourFormatted,
    isNegative,
    multiplyTime,
    minutesToHourFormatted,
    subtractTime,
    sumTime,
    validateTime,
    hourToMinutes,
    diffDays
};
