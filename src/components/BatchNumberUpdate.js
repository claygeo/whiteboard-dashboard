import React, { useState, useRef, useEffect } from 'react';

// Function to generate time options from 6:00 AM to 9:45 PM in 15-minute intervals
const generateTimeOptions = () => {
    const times = [];
    const startHour = 6; // 6:00 AM
    const endHour = 21; // 9:00 PM (21:00 in 24-hour format)
    
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

const BatchNumberUpdate = ({ row, onClose, onUpdate, onDelete }) => {
    const [productStatus, setProductStatus] = useState(row.product_status || '');
    const [startTime, setStartTime] = useState(normalizeTimeFormat(row.start_time) || '');
    const [endTime, setEndTime] = useState(normalizeTimeFormat(row.end_time) || '');
    const [employeeCount, setEmployeeCount] = useState(row.employee_count || '');
    const [actualUnits, setActualUnits] = useState(row.actual_units || '');
    const [targetUnits, setTargetUnits] = useState(row.target_units || '');
    const [isClosing, setIsClosing] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 }); // For dragging
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const popupRef = useRef(null);

    const timeOptions = generateTimeOptions();

    const getEndTimeOptions = () => {
        if (!startTime) return timeOptions;

        const startTime24 = to24HourFormat(startTime);
        const [startHours, startMinutes] = startTime24.split(':').map(Number);
        const startDate = new Date(`1970-01-01T${startTime24}:00`);

        console.log(`Start Time (24h): ${startTime24}, Start Date: ${startDate}`);

        return timeOptions.filter(option => {
            const endTime24 = to24HourFormat(option.value);
            const [endHours, endMinutes] = endTime24.split(':').map(Number);
            const endDate = new Date(`1970-01-01T${endTime24}:00`);

            const timeDiff = (endDate - startDate) / (1000 * 60);
            console.log(`End Time Option: ${option.value}, 24h: ${endTime24}, End Date: ${endDate}, Time Diff: ${timeDiff}`);

            return timeDiff >= 15;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate({
            id: row.id,
            product_status: productStatus,
            start_time: startTime || null,
            end_time: endTime || null,
            employee_count: employeeCount ? parseInt(employeeCount) : null,
            actual_units: parseInt(actualUnits) || 0,
            target_units: parseInt(targetUnits) || 0
        });
        setIsClosing(true);
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this batch?')) {
            try {
                const response = await fetch(`http://localhost:5000/api/batch-details/${row.id}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (!response.ok) {
                    throw new Error('Failed to delete batch');
                }
                onDelete(row.id);
                setIsClosing(true);
            } catch (error) {
                console.error('Error deleting batch:', error);
                alert('Failed to delete batch. Please try again.');
            }
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

        if (newStartTime && endTime) {
            const startTime24 = to24HourFormat(newStartTime);
            const endTime24 = to24HourFormat(endTime);
            const startDate = new Date(`1970-01-01T${startTime24}:00`);
            const endDate = new Date(`1970-01-01T${endTime24}:00`);

            const timeDiff = (endDate - startDate) / (1000 * 60);
            if (timeDiff < 15) {
                setEndTime('');
            }
        }
    };

    // Dragging functionality
    const handleMouseDown = (e) => {
        setIsDragging(true);
        const rect = popupRef.current.getBoundingClientRect();
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            const newX = e.clientX - dragStart.x;
            const newY = e.clientY - dragStart.y;
            setPosition({ x: newX, y: newY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart]);

    return (
        <div
            className={`batch-update-container ${isClosing ? 'fade-out' : ''}`}
            style={{
                top: '50%',
                left: '50%',
                marginLeft: `${position.x}px`, // Offset for dragging
                marginTop: `${position.y}px`  // Offset for dragging
            }}
            onAnimationEnd={handleAnimationEnd}
            ref={popupRef}
        >
            <div className="popup-header" onMouseDown={handleMouseDown}>
                <img src="/assets/curaleaf.png" alt="Curaleaf Logo" className="curaleaf-logo" />
                <h3>Batch Number Update</h3>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Batch Number:</label>
                    <input
                        type="text"
                        value={row.batch_number || 'N/A'}
                        readOnly
                    />
                </div>
                <div className="form-group">
                    <label>Line:</label>
                    <input
                        type="text"
                        value={row.line || 'N/A'}
                        readOnly
                    />
                </div>
                <div className="form-group">
                    <label>Product:</label>
                    <input
                        type="text"
                        value={row.product || 'N/A'}
                        readOnly
                    />
                </div>
                <div className="form-group">
                    <label>Product Status:</label>
                    <select
                        value={productStatus}
                        onChange={(e) => setProductStatus(e.target.value)}
                    >
                        <option value="">Select Status</option>
                        <option value="Finished Goods">Finished Goods</option>
                        <option value="Machine Down">Machine Down</option>
                        <option value="WIP">WIP</option>
                    </select>
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
                </div>
                <div className="form-group">
                    <label>End Time:</label>
                    <select
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        disabled={!startTime}
                    >
                        <option value="">Select End Time</option>
                        {getEndTimeOptions().map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Employee Count:</label>
                    <select
                        value={employeeCount}
                        onChange={(e) => setEmployeeCount(e.target.value)}
                    >
                        <option value="">Select Count</option>
                        {[...Array(5).keys()].map(i => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Actual Units Packed:</label>
                    <input
                        type="number"
                        value={actualUnits}
                        onChange={(e) => setActualUnits(e.target.value)}
                        min="0"
                    />
                </div>
                <div className="form-group">
                    <label>Target Units:</label>
                    <input
                        type="number"
                        value={targetUnits}
                        onChange={(e) => setTargetUnits(e.target.value)}
                        min="0"
                    />
                </div>
                <div className="form-group buttons">
                    <button type="submit">Submit</button>
                    <button type="button" onClick={handleDelete} className="delete-button">Delete</button>
                    <button type="button" onClick={handleClose}>Cancel</button>
                </div>
            </form>
        </div>
    );
};

export default BatchNumberUpdate;