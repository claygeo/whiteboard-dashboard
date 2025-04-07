import React, { useState, useEffect } from 'react';
import DataTable from './DataTable';
import BatchNumberUpdate from './BatchNumberUpdate';
import '../styles/Dashboard.css';

const Dashboard = ({ onLogout }) => {
    const [ubiNo, setUbiNo] = useState('');
    const [batchNumber, setBatchNumber] = useState('');
    const [product, setProduct] = useState('');
    const [packingFormat, setPackingFormat] = useState('');
    const [products, setProducts] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [totalRows, setTotalRows] = useState(0); // Store the total row count
    const [showBatchUpdate, setShowBatchUpdate] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [pageInput, setPageInput] = useState(currentPage);

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

    const allFieldsFilled = ubiNo && batchNumber && product && packingFormat;

    const fetchTableData = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/batch-details?page=${currentPage}&rowsPerPage=${rowsPerPage}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch table data: ${response.statusText} (${response.status})`);
            }
            const { data, totalRows } = await response.json();
            console.log('Fetched table data:', data, 'Total rows:', totalRows);
            setTableData(Array.isArray(data) ? data : []);
            setTotalRows(totalRows || 0);
        } catch (error) {
            console.error('Error fetching table data:', error);
            alert('Failed to fetch table data. Ensure the server is running on port 5000.');
            setTableData([]);
            setTotalRows(0);
        }
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/products');
                if (!response.ok) {
                    throw new Error(`Failed to fetch products: ${response.statusText} (${response.status})`);
                }
                const data = await response.json();
                console.log('Fetched products:', data);
                setProducts(data);
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
    }, [currentPage, rowsPerPage]); // Re-fetch when page or rowsPerPage changes

    const handleSubmit = async () => {
        if (!allFieldsFilled) {
            alert('Please fill in all fields.');
            return;
        }

        const newData = {
            ubi_no: ubiNo,
            date: new Date().toISOString(),
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
            target_units: 0
        };

        try {
            const response = await fetch('http://localhost:5000/api/batch-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newData)
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to submit batch details: ${errorText} (${response.status})`);
            }
            const result = await response.json();
            console.log('POST response:', result);
            await fetchTableData();
            handleClearFields();
            setCurrentPage(1);
            setPageInput(1);
        } catch (error) {
            console.error('Error submitting batch details:', error);
            alert(`Failed to submit batch details: ${error.message}`);
        }
    };

    const handleClearFields = () => {
        setUbiNo('');
        setBatchNumber('');
        setProduct('');
        setPackingFormat('');
    };

    const handleRowDoubleClick = (row) => {
        console.log('Selected row for update:', row);
        setSelectedRow(row);
        setShowBatchUpdate(true);
    };

    const handleBatchUpdate = async (updatedData) => {
        console.log('Updating batch with data:', updatedData);
        try {
            const id = parseInt(updatedData.id);
            if (isNaN(id)) {
                throw new Error('Invalid batch ID');
            }

            const response = await fetch(`http://localhost:5000/api/batch-details/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_status: updatedData.product_status || null,
                    start_time: updatedData.start_time || null,
                    end_time: updatedData.end_time || null,
                    employee_count: updatedData.employee_count ? parseInt(updatedData.employee_count) : null,
                    actual_units: updatedData.actual_units ? parseInt(updatedData.actual_units) : 0,
                    target_units: updatedData.target_units ? parseInt(updatedData.target_units) : 0
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update batch details: ${errorText} (${response.status})`);
            }

            const responseData = await response.json();
            console.log('Update response:', responseData);
            await fetchTableData();
            setShowBatchUpdate(false);
            setCurrentPage(1);
            setPageInput(1);
        } catch (error) {
            console.error('Error updating batch details:', error);
            alert(`Failed to update batch details: ${error.message}`);
        }
    };

    const handleBatchDelete = async () => {
        await fetchTableData();
        setCurrentPage(1);
        setPageInput(1);
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
            <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
            >
                First
            </button>
            <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
            >
                Previous
            </button>
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
            <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                Next
            </button>
            <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
            >
                Last
            </button>
            <select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
            >
                <option value="10">10 rows</option>
                <option value="50">50 rows</option>
                <option value="100">100 rows</option>
                <option value="250">250 rows</option>
                <option value="500">500 rows</option>
                <option value="1000">1000 rows</option>
            </select>
        </div>
    );

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
                        <label className="form-label">UBI No.:</label>
                        <input type="text" value={ubiNo} onChange={(e) => setUbiNo(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Batch Number:</label>
                        <input type="text" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Product:</label>
                        <select value={product} onChange={(e) => setProduct(e.target.value)}>
                            <option value="">Select Product</option>
                            {products.map(p => (
                                <option key={p.id} value={p.product_name}>{p.product_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Packing Format:</label>
                        <select value={packingFormat} onChange={(e) => setPackingFormat(e.target.value)}>
                            <option value="">Select Packing Format</option>
                            <option value="Table Top - Parastaltic">Table Top - Parastaltic</option>
                            <option value="Table Top - Tablet Counter">Table Top - Tablet Counter</option>
                            <option value="Table Top - Scale">Table Top - Scale</option>
                            <option value="Table Top - Briq">Table Top - Briq</option>
                            <option value="Table Top - Disposable">Table Top - Disposable</option>
                            <option value="Xylem - 510 Vape">Xylem - 510 Vape</option>
                            <option value="Nexus">Nexus</option>
                            <option value="Table Top">Table Top</option>
                        </select>
                    </div>
                </div>
            </div>
            <DataTable
                onRowDoubleClick={handleRowDoubleClick}
                tableData={tableData}
                currentPage={currentPage}
                rowsPerPage={rowsPerPage}
                renderPagination={renderPagination}
            />
            <div className="pagination-bottom">
                {renderPagination()}
            </div>
            {showBatchUpdate && (
                <BatchNumberUpdate
                    row={selectedRow}
                    onClose={() => setShowBatchUpdate(false)}
                    onUpdate={handleBatchUpdate}
                    onDelete={handleBatchDelete}
                />
            )}
        </div>
    );
};

export default Dashboard;