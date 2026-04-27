const axios = require('axios');

async function testDelete() {
    try {
        // Get all sales
        const res = await axios.get('http://127.0.0.1:5000/api/sales');
        const sales = res.data;
        if (sales.length === 0) {
            console.log('No sales to delete');
            return;
        }
        const saleId = sales[0]._id;
        console.log('Deleting sale:', saleId);
        const delRes = await axios.delete(`http://127.0.0.1:5000/api/sales/${saleId}`);
        console.log('Delete result:', delRes.data);
    } catch (err) {
        console.error('Delete failed:', err.response?.data || err.message);
    }
}

testDelete();
