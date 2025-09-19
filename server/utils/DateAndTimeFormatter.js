// utils/DateAndTimeFormatter.js
import { format, fromZonedTime, toZonedTime } from 'date-fns-tz';

class DateAndTimeFormatter {
  /**
   * Convert local time to UTC
   * @param {Date} date - Local date object
   * @param {string} timeZone - IANA timezone string (e.g., 'Asia/Manila')
   * @returns {Date} UTC date object
   */
  static toUTC(date, timeZone = 'Asia/Manila') {
    return fromZonedTime(date, timeZone);
  }

  /**
   * Convert UTC to specific timezone
   * @param {Date} utcDate - UTC date object
   * @param {string} timeZone - IANA timezone string
   * @returns {Date} Zoned date object
   */
  static fromUTC(utcDate, timeZone = 'Asia/Manila') {
    return toZonedTime(utcDate, timeZone);
  }

  /**
   * Format date in specific timezone
   * @param {Date} date - Date object
   * @param {string} formatString - Date format pattern
   * @param {string} timeZone - IANA timezone string
   * @returns {string} Formatted date string
   */
  static formatInTimeZone(date, formatString, timeZone = 'Asia/Manila') {
    return format(date, formatString, { timeZone });
  }

  /**
   * Get current time in specific timezone
   * @param {string} timeZone - IANA timezone string
   * @returns {Date} Current time in specified timezone
   */
  static nowInTimeZone(timeZone = 'Asia/Manila') {
    return toZonedTime(new Date(), timeZone);
  }

  /**
   * Convert between timezones
   * @param {Date} date - Source date
   * @param {string} fromTimeZone - Source timezone
   * @param {string} toTimeZone - Target timezone
   * @returns {Date} Date in target timezone
   */
  static convertTimeZone(date, fromTimeZone, toTimeZone) {
    const utcDate = fromZonedTime(date, fromTimeZone);
    return toZonedTime(utcDate, toTimeZone);
  }

  /**
   * Get start of day in specific timezone (returns UTC date)
   * @param {Date} date - Date object
   * @param {string} timeZone - IANA timezone string
   * @returns {Date} Start of day in UTC
   */
  static startOfDayInTimeZone(date = new Date(), timeZone = 'Asia/Manila') {
    // Get current time in Manila
    const manilaTime = toZonedTime(date, timeZone);
    
    // Set to start of day in Manila
    manilaTime.setHours(0, 0, 0, 0);
    
    // Convert back to UTC for database storage
    return fromZonedTime(manilaTime, timeZone);
  }

  /**
   * Check if two dates are the same day in specific timezone
   * @param {Date} date1 - First date
   * @param {Date} date2 - Second date
   * @param {string} timeZone - IANA timezone string
   * @returns {boolean} True if same day
   */
  static isSameDayInTimeZone(date1, date2, timeZone = 'Asia/Manila') {
    const zonedDate1 = toZonedTime(date1, timeZone);
    const zonedDate2 = toZonedTime(date2, timeZone);
    
    return zonedDate1.getFullYear() === zonedDate2.getFullYear() &&
           zonedDate1.getMonth() === zonedDate2.getMonth() &&
           zonedDate1.getDate() === zonedDate2.getDate();
  }

  /**
   * Check if a stored queue date is for today in Manila timezone
   * @param {Date} storedQueueDate - UTC date from database
   * @param {string} timeZone - IANA timezone string
   * @returns {boolean} True if the queue date is for today
   */
  static isQueueDateToday(storedQueueDate, timeZone = 'Asia/Manila') {
    const todayStartUTC = this.startOfDayInTimeZone(new Date(), timeZone);
    return storedQueueDate.getTime() === todayStartUTC.getTime();
  }
}

// Common format patterns
export const FORMATS = {
  ISO: "yyyy-MM-dd'T'HH:mm:ssXXX",
  DISPLAY: 'MMMM dd, yyyy hh:mm a',
  DATE_ONLY: 'yyyy-MM-dd',
  TIME_ONLY: 'HH:mm:ss',
  FULL: 'EEEE, MMMM dd, yyyy hh:mm:ss a XXX'
};

export default DateAndTimeFormatter;