import React, { useState } from 'react';

   // Function to normalize time format to HH:MM AM/PM
   const normalizeTimeFormat = (time) => {
     if (!time) return 'N/A';
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
     return 'N/A';
   };

   // Function to format ISO date to MM/DD/YYYY, HH:MM:SS AM/PM
   const formatDateTime = (isoDate) => {
     if (!isoDate) return 'N/A';
     const date = new Date(isoDate);
     return date.toLocaleString('en-US', {
       month: '2-digit',
       day: '2-digit',
       year: 'numeric',
       hour: '2-digit',
       minute: '2-digit',
       second: '2-digit',
       hour12: true
     });
   };

   const DataTable = ({ tableData, onRowDoubleClick, renderPagination }) => {
     const [searchQuery, setSearchQuery] = useState('');
     const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
     const [filterConfig, setFilterConfig] = useState({});

     const data = Array.isArray(tableData) ? tableData : [];

     const searchedData = data.filter(item => {
       if (!searchQuery) return true;
       const searchText = searchQuery.toLowerCase();
       return (
         (item.ubi_no?.toLowerCase() || '').includes(searchText) ||
         (formatDateTime(item.created_at).toLowerCase() || '').includes(searchText) ||
         (item.line?.toLowerCase() || '').includes(searchText) ||
         (item.product?.toLowerCase() || '').includes(searchText) ||
         (item.packing_format?.toLowerCase() || '').includes(searchText) ||
         (item.line_lead?.toLowerCase() || '').includes(searchText) ||
         (item.batch_number?.toLowerCase() || '').includes(searchText) ||
         (normalizeTimeFormat(item.start_time)?.toLowerCase() || '').includes(searchText) ||
         (normalizeTimeFormat(item.end_time)?.toLowerCase() || '').includes(searchText) ||
         (item.employee_count?.toString() || '').includes(searchText) ||
         (item.product_status?.toLowerCase() || '').includes(searchText) ||
         (item.actual_units?.toString() || '').includes(searchText) ||
         (item.target_units?.toString() || '').includes(searchText)
       );
     });

     const filteredData = searchedData.filter(item => {
       return Object.keys(filterConfig).every(key => {
         if (!filterConfig[key]) return true;
         const value =
           key === 'start_time' || key === 'end_time'
             ? normalizeTimeFormat(item[key])
             : key === 'created_at'
             ? formatDateTime(item[key])
             : item[key];
         const filterText = filterConfig[key].toLowerCase();
         if (key === 'created_at') {
           return formatDateTime(item.created_at).toLowerCase().includes(filterText);
         }
         return (value?.toString().toLowerCase() || '').includes(filterText);
       });
     });

     const sortedData = [...filteredData].sort((a, b) => {
       const aValue =
         sortConfig.key === 'start_time' || sortConfig.key === 'end_time'
           ? normalizeTimeFormat(a[sortConfig.key])
           : sortConfig.key === 'created_at'
           ? a[sortConfig.key]
           : a[sortConfig.key];
       const bValue =
         sortConfig.key === 'start_time' || sortConfig.key === 'end_time'
           ? normalizeTimeFormat(b[sortConfig.key])
           : sortConfig.key === 'created_at'
           ? b[sortConfig.key]
           : b[sortConfig.key];

       if (sortConfig.key === 'created_at') {
         const dateComparison =
           sortConfig.direction === 'asc'
             ? new Date(aValue) - new Date(bValue)
             : new Date(bValue) - new Date(aValue);
         if (dateComparison !== 0) return dateComparison;
         // Secondary sort by id DESC when created_at is equal
         return sortConfig.direction === 'asc'
           ? a.id - b.id
           : b.id - a.id;
       }

       const aString = aValue?.toString().toLowerCase() || '';
       const bString = bValue?.toString().toLowerCase() || '';
       if (sortConfig.direction === 'asc') {
         return aString.localeCompare(bString);
       }
       return bString.localeCompare(aString);
     });

     const handleSort = (key) => {
       setSortConfig(prevConfig => ({
         key,
         direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
       }));
     };

     const handleFilterChange = (key, value) => {
       setFilterConfig(prevConfig => ({
         ...prevConfig,
         [key]: value,
       }));
     };

     // Safely render pagination
     const paginationContent = typeof renderPagination === 'function' ? renderPagination() : null;

     return (
       <div className="table-container">
         <input
           type="text"
           className="search-input"
           placeholder="Search table (Ctrl+F functionality)..."
           value={searchQuery}
           onChange={(e) => setSearchQuery(e.target.value)}
         />
         <table className="batches-table">
           <thead>
             <tr>
               <th>
                 UBI No.
                 <div className="filter-sort">
                   <input
                     type="text"
                     placeholder="Filter..."
                     value={filterConfig.ubi_no || ''}
                     onChange={(e) => handleFilterChange('ubi_no', e.target.value)}
                   />
                   <button onClick={() => handleSort('ubi_no')}>
                     {sortConfig.key === 'ubi_no' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                   </button>
                 </div>
               </th>
               <th>
                 Created At
                 <div className="filter-sort">
                   <input
                     type="text"
                     placeholder="Filter..."
                     value={filterConfig.created_at || ''}
                     onChange={(e) => handleFilterChange('created_at', e.target.value)}
                   />
                   <button onClick={() => handleSort('created_at')}>
                     {sortConfig.key === 'created_at' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                   </button>
                 </div>
               </th>
               <th>
                 Line
                 <div className="filter-sort">
                   <input
                     type="text"
                     placeholder="Filter..."
                     value={filterConfig.line || ''}
                     onChange={(e) => handleFilterChange('line', e.target.value)}
                   />
                   <button onClick={() => handleSort('line')}>
                     {sortConfig.key === 'line' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                   </button>
                 </div>
               </th>
               <th>
                 Product
                 <div className="filter-sort">
                   <input
                     type="text"
                     placeholder="Filter..."
                     value={filterConfig.product || ''}
                     onChange={(e) => handleFilterChange('product', e.target.value)}
                   />
                   <button onClick={() => handleSort('product')}>
                     {sortConfig.key === 'product' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                   </button>
                 </div>
               </th>
               <th>
                 Packing Format
                 <div className="filter-sort">
                   <input
                     type="text"
                     placeholder="Filter..."
                     value={filterConfig.packing_format || ''}
                     onChange={(e) => handleFilterChange('packing_format', e.target.value)}
                   />
                   <button onClick={() => handleSort('packing_format')}>
                     {sortConfig.key === 'packing_format' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                   </button>
                 </div>
               </th>
               <th>
                 Line Lead
                 <div className="filter-sort">
                   <input
                     type="text"
                     placeholder="Filter..."
                     value={filterConfig.line_lead || ''}
                     onChange={(e) => handleFilterChange('line_lead', e.target.value)}
                   />
                   <button onClick={() => handleSort('line_lead')}>
                     {sortConfig.key === 'line_lead' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                   </button>
                 </div>
               </th>
               <th>
                 Batch Number
                 <div className="filter-sort">
                   <input
                     type="text"
                     placeholder="Filter..."
                     value={filterConfig.batch_number || ''}
                     onChange={(e) => handleFilterChange('batch_number', e.target.value)}
                   />
                   <button onClick={() => handleSort('batch_number')}>
                     {sortConfig.key === 'batch_number' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                   </button>
                 </div>
               </th>
               <th>
                 Start Time
                 <div className="filter-sort">
                   <input
                     type="text"
                     placeholder="Filter..."
                     value={filterConfig.start_time || ''}
                     onChange={(e) => handleFilterChange('start_time', e.target.value)}
                   />
                   <button onClick={() => handleSort('start_time')}>
                     {sortConfig.key === 'start_time' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                   </button>
                 </div>
               </th>
               <th>
                 End Time
                 <div className="filter-sort">
                   <input
                     type="text"
                     placeholder="Filter..."
                     value={filterConfig.end_time || ''}
                     onChange={(e) => handleFilterChange('end_time', e.target.value)}
                   />
                   <button onClick={() => handleSort('end_time')}>
                     {sortConfig.key === 'end_time' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                   </button>
                 </div>
               </th>
               <th>
                 Employee Count
                 <div className="filter-sort">
                   <input
                     type="text"
                     placeholder="Filter..."
                     value={filterConfig.employee_count || ''}
                     onChange={(e) => handleFilterChange('employee_count', e.target.value)}
                   />
                   <button onClick={() => handleSort('employee_count')}>
                     {sortConfig.key === 'employee_count' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                   </button>
                 </div>
               </th>
               <th>
                 Product Status
                 <div className="filter-sort">
                   <input
                     type="text"
                     placeholder="Filter..."
                     value={filterConfig.product_status || ''}
                     onChange={(e) => handleFilterChange('product_status', e.target.value)}
                   />
                   <button onClick={() => handleSort('product_status')}>
                     {sortConfig.key === 'product_status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                   </button>
                 </div>
               </th>
               <th>
                 Actual Units
                 <div className="filter-sort">
                   <input
                     type="text"
                     placeholder="Filter..."
                     value={filterConfig.actual_units || ''}
                     onChange={(e) => handleFilterChange('actual_units', e.target.value)}
                   />
                   <button onClick={() => handleSort('actual_units')}>
                     {sortConfig.key === 'actual_units' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                   </button>
                 </div>
               </th>
               <th>
                 Target Units
                 <div className="filter-sort">
                   <input
                     type="text"
                     placeholder="Filter..."
                     value={filterConfig.target_units || ''}
                     onChange={(e) => handleFilterChange('target_units', e.target.value)}
                   />
                   <button onClick={() => handleSort('target_units')}>
                     {sortConfig.key === 'target_units' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                   </button>
                 </div>
               </th>
             </tr>
           </thead>
           <tbody>
             {sortedData.map(row => (
               <tr key={row.id} onDoubleClick={() => onRowDoubleClick(row)}>
                 <td>{row.ubi_no}</td>
                 <td>{formatDateTime(row.created_at)}</td>
                 <td>{row.line}</td>
                 <td>{row.product}</td>
                 <td>{row.packing_format}</td>
                 <td>{row.line_lead}</td>
                 <td>{row.batch_number}</td>
                 <td>{normalizeTimeFormat(row.start_time)}</td>
                 <td>{normalizeTimeFormat(row.end_time)}</td>
                 <td>{row.employee_count || 'N/A'}</td>
                 <td>{row.product_status}</td>
                 <td>{row.actual_units}</td>
                 <td>{row.target_units?.toFixed(2) || 'N/A'}</td>
               </tr>
             ))}
           </tbody>
         </table>
         {paginationContent}
       </div>
     );
   };

   export default DataTable;