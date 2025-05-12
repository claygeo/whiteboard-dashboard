import React, { useState, useRef, useEffect } from 'react';
import FocusTrap from 'focus-trap-react';
import { supabase } from './supabaseClient';

// Function to generate time options from 6:00 AM to 9:45 PM in 15-minute intervals
const generateTimeOptions = () => {
  const times = [];
  const startHour = 6;
  const endHour = 21;

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === endHour && minute > 45) break;

      const period = hour < 12 || hour === 24 ? 'AM' : 'PM';
      let displayHour = hour % 12;
      if (displayHour === 0) displayHour = 12;
      const displayMinute = minute.toString().padStart(2, '0');
      const time12Hour = `${displayHour}:${displayMinute} ${period}`;
      times.push({ value: time12Hour, label: time12Hour });
    }
  }
  return times;
};

// Function to normalize time format to HH:MM AM/PM
const normalizeTimeFormat = (time) => {
  if (!time) return '';
  if (/^[0-1]?[0-9]:[0-5][0-9] (AM|PM)$/.test(time)) {
    const [timePart, period] = time.split(' ');
    let [hours, minutes] = timePart.split(':');
    hours = parseInt(hours, 10);
    hours = hours.toString().padStart(2, '0');
    return `${hours}:${minutes} ${period}`;
  }
  if (/^[0-2][0-9]:[0-5][0-9](:[0-5][0-9])?$/.test(time)) {
    const timeWithoutSeconds = time.substring(0, 5);
    const [hours, minutes] = timeWithoutSeconds.split(':');
    const hoursInt = parseInt(hours, 10);
    const period = hoursInt >= 12 ? 'PM' : 'AM';
    const hours12 = hoursInt % 12 || 12;
    return `${hours12}:${minutes} ${period}`;
  }
  return '';
};

// Function to convert HH:MM AM/PM to 24-hour format for comparison
const to24HourFormat = (time12Hour) => {
  const [timePart, period] = time12Hour.split(' ');
  let [hours, minutes] = timePart.split(':');
  hours = parseInt(hours, 10);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

const BatchNumberUpdate = ({ row, onClose, onUpdate }) => {
  const [productStatus, setProductStatus] = useState(row.product_status || '');
  const [startTime, setStartTime] = useState(normalizeTimeFormat(row.start_time) || '');
  const [endTime, setEndTime] = useState(normalizeTimeFormat(row.end_time) || '');
  const [employeeCount, setEmployeeCount] = useState(row.employee_count != null ? Math.floor(row.employee_count).toString() : '');
  const [actualUnits, setActualUnits] = useState(row.actual_units || '');
  const [isClosing, setIsClosing] = useState(false);
  const [errors, setErrors] = useState({});
  const popupRef = useRef(null);

  const timeOptions = generateTimeOptions();

  const getEndTimeOptions = () => {
    if (!startTime) return timeOptions;

    const startTime24 = to24HourFormat(startTime);
    const startDate = new Date(`1970-01-01T${startTime24}:00`);
    const oneHourLater = new Date(startDate.getTime() + 60 * 60 * 1000);

    return timeOptions.filter(option => {
      const endTime24 = to24HourFormat(option.value);
      const endDate = new Date(`1970-01-01T${endTime24}:00`);

      const timeDiff = (endDate - startDate) / (1000 * 60);
      return timeDiff > 0 && timeDiff <= 60;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!productStatus) newErrors.productStatus = 'Product Status is required';
    if (!startTime) newErrors.startTime = 'Start Time is required';
    if (!endTime) newErrors.endTime = 'End Time is required';
    if (!employeeCount) newErrors.employeeCount = 'Employee Count is required';
    if (!actualUnits || parseInt(actualUnits) < 0) newErrors.actualUnits = 'Valid Actual Units is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      await onUpdate({
        id: row.id,
        product_status: productStatus,
        start_time: startTime || null,
        end_time: endTime || null,
        employee_count: employeeCount ? parseInt(employeeCount) : null,
        actual_units: parseInt(actualUnits) || 0,
        product: row.product
      });
      setIsClosing(true);
    } catch (error) {
      console.error('Error submitting update:', error);
      setErrors({ submit: 'Failed to submit. Please try again.' });
    }
  };

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  const handleStartTimeChange = (e) => {
    const newStartTime = e.target.value;
    setStartTime(newStartTime);
    setEndTime('');
    setErrors(prev => ({ ...prev, startTime: null }));
  };

  return (
    <FocusTrap>
      <div
        className={`batch-update-container ${isClosing ? 'fade-out' : ''}`}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
        }}
        onAnimationEnd={handleAnimationEnd}
        ref={popupRef}
        role="dialog"
        aria-labelledby="batch-update-title"
      >
        <div className="popup-header">
          <img src="/assets/curaleaf.png" alt="Curaleaf Logo" className="curaleaf-logo" />
          <h3 id="batch-update-title">Batch Number Update</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Batch Number:</label>
            <input type="text" value={row.batch_number || 'N/A'} readOnly />
          </div>
          <div className="form-group">
            <label>Line:</label>
            <input type="text" value={row.line || 'N/A'} readOnly />
          </div>
          <div className="form-group">
            <label>Product:</label>
            <input type="text" value={row.product || 'N/A'} readOnly />
          </div>
          <div className="form-group">
            <label>Product Status:</label>
            <select
              value={productStatus}
              onChange={(e) => {
                setProductStatus(e.target.value);
                setErrors(prev => ({ ...prev, productStatus: null }));
              }}
            >
              <option value="">Select Status</option>
              <option value="Finished Goods">Finished Goods</option>
              <option value="Machine Down">Machine Down</option>
              <option value="WIP">WIP</option>
            </select>
            {errors.productStatus && <span className="error">{errors.productStatus}</span>}
          </div>
          <div className="form-group">
            <label>Start Time:</label>
            <select
              value={startTime}
              onChange={handleStartTimeChange}
            >
              <option value="">Select Start Time</option>
              {timeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.startTime && <span className="error">{errors.startTime}</span>}
          </div>
          <div className="form-group">
            <label>End Time:</label>
            <select
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value);
                setErrors(prev => ({ ...prev, endTime: null }));
              }}
              disabled={!startTime}
            >
              <option value="">Select End Time</option>
              {getEndTimeOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.endTime && <span className="error">{errors.endTime}</span>}
          </div>
          <div className="form-group">
            <label>Employee Count:</label>
            <select
              value={employeeCount}
              onChange={(e) => {
                setEmployeeCount(e.target.value);
                setErrors(prev => ({ ...prev, employeeCount: null }));
              }}
            >
              <option value="">Select Count</option>
              {[...Array(5).keys()].map(i => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            {errors.employeeCount && <span className="error">{errors.employeeCount}</span>}
          </div>
          <div className="form-group">
            <label>Actual Units Packed:</label>
            <input
              type="number"
              value={actualUnits}
              onChange={(e) => {
                setActualUnits(e.target.value);
                setErrors(prev => ({ ...prev, actualUnits: null }));
              }}
              min="0"
            />
            {errors.actualUnits && <span className="error">{errors.actualUnits}</span>}
          </div>
          {errors.submit && <span className="error">{errors.submit}</span>}
          <div className="form-group buttons">
            <button type="submit">Submit</button>
            <button type="button" onClick={handleClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </FocusTrap>
  );
};

export default BatchNumberUpdate;