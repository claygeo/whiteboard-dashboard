import React, { useState, useEffect, useCallback, useRef } from 'react';
import DataTable from './DataTable';
import BatchNumberUpdate from './BatchNumberUpdate';
import ProductSelector from './ProductSelector'; // Fixed import
import { supabase } from './supabaseClient';
import { format, toZonedTime } from 'date-fns-tz';
import '../styles/Dashboard.css';

// Function to round a number to a specified number of significant digits
const roundToSignificantDigits = (num, digits) => {
  if (num === 0) return 0;
  const magnitude = Math.floor(Math.log10(Math.abs(num))) + 1;
  const scale = digits - magnitude;
  const factor = Math.pow(10, scale);
  return Math.round(num * factor) / factor;
};

// Convert HH:MM AM/PM to 24-hour format
const to24HourFormat = (time12Hour) => {
  if (!time12Hour) return '00:00';
  const [timePart, period] = time12Hour.split(' ');
  let [hours, minutes] = timePart.split(':');
  hours = parseInt(hours, 10);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

// Function to calculate takt-time metrics
const calculateTaktMetrics = async (data) => {
  try {
    console.log('Calculating takt metrics for data:', data);

    if (!data.product) {
      console.error('Missing product name in data');
      return {
        total_time: 0,
        takt_time: 0,
        running_takt: 0,
        target_units: 0,
        target_delta: 0,
        delta_percentage: 0,
      };
    }

    const normalizedProduct = data.product.trim();

    const { data: productData, error: productError } = await supabase
      .from('product_master_list')
      .select('current_takt')
      .eq('product_name', normalizedProduct)
      .single();

    if (productError || !productData) {
      console.error(`Product "${normalizedProduct}" not found in product_master_list.`, productError);
      return {
        total_time: 0,
        takt_time: 0,
        running_takt: 0,
        target_units: 0,
        target_delta: 0,
        delta_percentage: 0,
      };
    }
    const takt_time = productData.current_takt || 0;
    console.log('Fetched takt_time:', takt_time);

    const employeeCount = data.employee_count != null ? Math.floor(Number(data.employee_count)) : null;
    if (employeeCount == null || isNaN(employeeCount) || employeeCount < 1) {
      console.error('Invalid employee_count:', data.employee_count);
      return {
        total_time: 0,
        takt_time: 0,
        running_takt: 0,
        target_units: 0,
        target_delta: 0,
        delta_percentage: 0,
      };
    }

    const { data: employeeData, error: employeeError } = await supabase
      .from('employee_pace')
      .select('percentage')
      .eq('employees', employeeCount)
      .single();

    if (employeeError || !employeeData) {
      console.error('Error fetching employee pace:', employeeError, 'Employee count:', employeeCount);
      return {
        total_time: 0,
        takt_time: 0,
        running_takt: 0,
        target_units: 0,
        target_delta: 0,
        delta_percentage: 0,
      };
    }
    let employee_percentage = employeeData.percentage || 1;
    if (employee_percentage > 5) {
      employee_percentage = employee_percentage / 100;
    }
    if (employee_percentage < 0.5 || employee_percentage > 2.0) {
      console.warn(`Employee percentage out of expected range (0.5–2.0): ${employee_percentage}, defaulting to 1`);
      employee_percentage = 1;
    }
    console.log('Fetched employee_percentage:', employee_percentage);

    let total_time = 0;
    if (data.start_time && data.end_time) {
      const start = to24HourFormat(data.start_time);
      const end = to24HourFormat(data.end_time);
      const startDate = new Date(`1970-01-01T${start}:00`);
      const endDate = new Date(`1970-01-01T${end}:00`);
      total_time = ((endDate - startDate) / 1000) % (24 * 3600);
      if (total_time < 0) total_time += 24 * 3600;
    }
    console.log('Calculated total_time:', total_time);

    const running_takt = takt_time ? takt_time * employee_percentage : 0;
    console.log('Calculated running_takt:', running_takt);

    let target_units = data.product_status === 'WIP' ? 0 : running_takt ? (total_time / running_takt) : 0;
    target_units = running_takt ? Math.round(roundToSignificantDigits(target_units, 3)) : 0;
    console.log('Calculated target_units:', target_units);

    const target_delta = data.actual_units && target_units != null ? data.actual_units - target_units : 0;
    console.log('Calculated target_delta:', target_delta);

    const delta_percentage = target_units ? data.actual_units / target_units : 0;
    console.log('Calculated delta_percentage:', delta_percentage);

    return {
      total_time,
      takt_time,
      running_takt,
      target_units,
      target_delta,
      delta_percentage,
    };
  } catch (error) {
    console.error('Error calculating takt metrics:', error, 'Input data:', data);
    return {
      total_time: 0,
      takt_time: 0,
      running_takt: 0,
      target_units: 0,
      target_delta: 0,
      delta_percentage: 0,
    };
  }
};

const Dashboard = ({ onLogout }) => {
  const [batchNumber, setBatchNumber] = useState('');
  const [product, setProduct] = useState('');
  const [packingFormat, setPackingFormat] = useState('');
  const [products, setProducts] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [showBatchUpdate, setShowBatchUpdate] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(250);
  const [pageInput, setPageInput] = useState(currentPage);
  const batchNumberInputRef = useRef(null);

  const line = localStorage.getItem('line') || '';
  const lineLead = localStorage.getItem('lineLead') || '';
  const currentDate = new Date().toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const allFieldsFilled = batchNumber && product && packingFormat;

  const fetchTableData = useCallback(async () => {
    try {
      const from = (currentPage - 1) * rowsPerPage;
      const to = from + rowsPerPage - 1;

      const { data, error, count } = await supabase
        .from('batch_data')
        .select('*, is_locked, line_status', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch table data: ${error.message}`);
      }

      setTableData(Array.isArray(data) ? data : []);
      setTotalRows(count || 0);
    } catch (error) {
      console.error('Error fetching table data:', error);
      alert('Failed to fetch table data. Check your Supabase connection.');
      setTableData([]);
      setTotalRows(0);
    }
  }, [currentPage, rowsPerPage]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('product_master_list')
          .select('id, product_name')
          .order('product_name', { ascending: true });

        if (error) {
          throw new Error(`Failed to fetch products: ${error.message}`);
        }

        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        alert('Failed to fetch products. Using fallback data.');
        setProducts([
          { id: 1, product_name: 'Mega Dose X Bites' },
          { id: 2, product_name: 'SEL Rosin Concentrate' },
          { id: 3, product_name: 'Plant Precision FL Relieve Gel' }
        ]);
      }
    };

    fetchProducts();
    fetchTableData();
    focusElement(batchNumberInputRef);
  }, [fetchTableData]);

  const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000;
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!showBatchUpdate && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
        fetchTableData();
      }
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchTableData, showBatchUpdate]);

  const handleSubmit = async () => {
    if (!allFieldsFilled) {
      alert('Please fill in all fields.');
      return;
    }

    const now = new Date();
    const estTime = toZonedTime(now, 'America/New_York');
    const submissionTime = format(estTime, 'hh:mm a');
    const estHour = estTime.getHours();
    let shift;
    if (estHour >= 6 && estHour < 14) {
      shift = 'Morning';
    } else if (estHour >= 14 && estHour < 22) {
      shift = 'Afternoon';
    } else {
      shift = 'Evening';
    }
    const effectiveDate = format(estTime, 'yyyy-MM-dd');

    const newData = {
      created_at: now.toISOString(),
      date: now.toISOString(),
      line,
      product,
      packing_format: packingFormat,
      line_lead: lineLead,
      batch_number: batchNumber,
      start_time: null,
      end_time: null,
      employee_count: 0,
      product_status: 'Unfinished',
      actual_units: 0,
      target_units: 0,
      total_time: 0,
      takt_time: 0,
      running_takt: 0,
      target_delta: 0,
      delta_percentage: 0,
      submission_time: submissionTime,
      shift: shift,
      effective_date: effectiveDate,
      is_locked: false,
      line_status: 'Open'
    };

    try {
      const { error } = await supabase
        .from('batch_data')
        .insert([newData]);

      if (error) {
        throw new Error(`Failed to submit batch details: ${error.message}`);
      }

      setCurrentPage(1);
      setPageInput(1);
      await fetchTableData();
      handleClearFields();
    } catch (error) {
      console.error('Error submitting batch details:', error);
      alert(`Failed to submit batch details: ${error.message}`);
    }
  };

  const handleClearFields = () => {
    setBatchNumber('');
    setProduct('');
    setPackingFormat('');
    focusElement(batchNumberInputRef);
  };

  const handleRowDoubleClick = (row) => {
    setSelectedRow(row);
    setShowBatchUpdate(true);
  };

  const handleBatchUpdate = async (updatedData) => {
    try {
      const id = parseInt(updatedData.id);
      if (isNaN(id)) {
        throw new Error('Invalid batch ID');
      }

      const calculations = await calculateTaktMetrics({
        product_status: updatedData.product_status,
        start_time: updatedData.start_time,
        end_time: updatedData.end_time,
        employee_count: updatedData.employee_count,
        actual_units: updatedData.actual_units,
        product: updatedData.product
      });

      const { error } = await supabase
        .from('batch_data')
        .update({
          product_status: updatedData.product_status || null,
          start_time: updatedData.start_time || null,
          end_time: updatedData.end_time || null,
          employee_count: updatedData.employee_count ? parseInt(updatedData.employee_count) : null,
          actual_units: updatedData.actual_units ? parseInt(updatedData.actual_units) : 0,
          product: updatedData.product,
          total_time: calculations.total_time,
          takt_time: calculations.takt_time,
          running_takt: calculations.running_takt,
          target_units: calculations.target_units,
          target_delta: calculations.target_delta,
          delta_percentage: calculations.delta_percentage,
          is_locked: true,
          line_status: 'Closed'
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to update batch details: ${error.message}`);
      }

      setCurrentPage(1);
      setPageInput(1);
      await fetchTableData();
      setShowBatchUpdate(false);
    } catch (error) {
      console.error('Error updating batch details:', error);
      alert(`Failed to update batch details: ${error.message}`);
    }
  };

  const handleBatchDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this batch?')) {
      try {
        const { error } = await supabase
          .from('batch_data')
          .delete()
          .eq('id', id)
          .eq('is_locked', false);

        if (error) {
          throw new Error(`Failed to delete batch: ${error.message}`);
        }

        setCurrentPage(1);
        setPageInput(1);
        await fetchTableData();
        focusElement(batchNumberInputRef);
        window.electronAPI.focusWindow();
      } catch (error) {
        console.error('Error deleting batch:', error);
        alert(`Failed to delete batch: ${error.message}`);
      }
    }
  };

  const totalPages = Math.ceil(totalRows / rowsPerPage);

  const handleRowsPerPageChange = (e) => {
    const newRowsPerPage = parseInt(e.target.value);
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
    setPageInput(1);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setPageInput(page);
    }
  };

  const handlePageInputChange = (e) => {
    const value = e.target.value;
    setPageInput(value);
  };

  const handlePageJump = () => {
    const page = parseInt(pageInput);
    if (!isNaN(page)) {
      goToPage(page);
    } else {
      setPageInput(currentPage);
    }
  };

  const renderPagination = () => (
    <div className="pagination">
      <button onClick={() => goToPage(1)} disabled={currentPage === 1}>First</button>
      <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
      <span>
        Page
        <input
          type="number"
          value={pageInput}
          onChange={handlePageInputChange}
          onBlur={handlePageJump}
          onKeyPress={(e) => e.key === 'Enter' && handlePageJump()}
          min="1"
          max={totalPages}
        />
        of {totalPages}
      </span>
      <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
      <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>Last</button>
      <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
        <option value="250">250 rows</option>
        <option value="500">500 rows</option>
        <option value="1000">1000 rows</option>
      </select>
    </div>
  );

  const focusElement = (ref) => {
    if (ref.current) {
      ref.current.focus();
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <button onClick={onLogout} className="logout-button">Logout</button>
      </div>
      <div className="batch-details">
        <div className="batch-details-header">
          <img src="/assets/curaleaf.png" alt="Curaleaf Logo" className="curaleaf-logo" />
          <div className="buttons">
            <button onClick={handleClearFields}>Clear Fields</button>
            <button
              onClick={handleSubmit}
              className={allFieldsFilled ? 'submit-button active' : 'submit-button'}
            >
              Submit
            </button>
          </div>
        </div>
        <h3 className="batch-details-title">Batch Details</h3>
        <div className="batch-details-content">
          <div className="form-group">
            <label className="form-label">Date:</label>
            <input type="text" value={currentDate} readOnly />
          </div>
          <div className="form-group">
            <label className="form-label">Line:</label>
            <input type="text" value={line} readOnly />
          </div>
          <div className="form-group">
            <label className="form-label">Line Lead:</label>
            <input type="text" value={lineLead} readOnly />
          </div>
          <div className="form-group">
            <label className="form-label">Batch Number:</label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              ref={batchNumberInputRef}
              id="batchNumberInput"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Product:</label>
            <div className="product-selector-container">
              <ProductSelector
                products={products}
                value={product}
                onChange={setProduct}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Packing Format:</label>
            <select value={packingFormat} onChange={(e) => setPackingFormat(e.target.value)}>
              <option value="">Select Packing Format</option>
              <option value="Knock-Box">Knock-Box</option>
              <option value="Nexus">Nexus</option>
              <option value="Pre-Roller">Pre-Roller</option>
              <option value="Table Top">Table Top</option>
              <option value="Table Top - Briq">Table Top - Briq</option>
              <option value="Table Top - Capsule Counter">Table Top - Capsule Counter</option>
              <option value="Table Top - Disposable">Table Top - Disposable</option>
              <option value="Table Top - Gel">Table Top - Gel</option>
              <option value="Table Top - Go No Go Scale">Table Top - Go No Go Scale</option>
              <option value="Table Top - Parastaltic">Table Top - Parastaltic</option>
              <option value="Table Top - Scale">Table Top - Scale</option>
              <option value="Table Top - Syringe">Table Top - Syringe</option>
              <option value="Table Top - Tablet Counter">Table Top - Tablet Counter</option>
              <option value="Xylem - 510 Vape">Xylem - 510 Vape</option>
              <option value="Xylem - Jupiter Vape">Xylem - Jupiter Vape</option>
            </select>
          </div>
        </div>
      </div>
      <DataTable
        onRowDoubleClick={handleRowDoubleClick}
        tableData={tableData}
        renderPagination={renderPagination}
        onDelete={handleBatchDelete}
      />
      <div className="pagination-bottom">{renderPagination()}</div>
      {showBatchUpdate && (
        <BatchNumberUpdate
          row={selectedRow}
          onClose={() => setShowBatchUpdate(false)}
          onUpdate={handleBatchUpdate}
        />
      )}
    </div>
  );
};

export default Dashboard;