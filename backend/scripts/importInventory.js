const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Product = require('../models/Product');

const inventory = [
    // PEPSI KARACHI
    { name: 'Pepsi Jumbo Karachi', customerProductName: 'Pepsi Jumbo', piecesPerCarton: 6, costPricePerCarton: 800, category: 'Pepsi Karachi' },
    { name: 'Pepsi 1.5 ltr Karachi', customerProductName: 'Pepsi 1.5 ltr', piecesPerCarton: 6, costPricePerCarton: 980, category: 'Pepsi Karachi' },
    { name: 'Pepsi 1 ltr Karachi', customerProductName: 'Pepsi 1 ltr', piecesPerCarton: 12, costPricePerCarton: 750, category: 'Pepsi Karachi' },
    { name: 'Pepsi 500 ml Karachi', customerProductName: 'Pepsi 500 ml', piecesPerCarton: 12, costPricePerCarton: 1060, category: 'Pepsi Karachi' },
    { name: 'Pepsi 345 ml Karachi', customerProductName: 'Pepsi 345 ml', piecesPerCarton: 12, costPricePerCarton: 745, category: 'Pepsi Karachi' },

    // PEPSI SUKKUR
    { name: 'Pepsi Jumbo Sukkur', customerProductName: 'Pepsi Jumbo', piecesPerCarton: 6, costPricePerCarton: 750, category: 'Pepsi Sukkur' },
    { name: 'Sting 500 ml Sukkur', customerProductName: 'Sting 500 ml', piecesPerCarton: 12, costPricePerCarton: 1160, category: 'Sting' },
    { name: 'Sting 300 ml Sukkur', customerProductName: 'Sting 300 ml', piecesPerCarton: 12, costPricePerCarton: 805, category: 'Sting' },

    // OTHERS
    { name: 'Smily juice 200 ml', customerProductName: 'Smily juice 200 ml', piecesPerCarton: 24, costPricePerCarton: 495, category: 'Juice' },
    { name: 'Slice Ltr', customerProductName: 'Slice Ltr', piecesPerCarton: 12, costPricePerCarton: 910, category: 'Slice' },

    // PAKOLA
    { name: 'Pakola Water 500 ml', customerProductName: 'Pakola Water 500 ml', piecesPerCarton: 12, costPricePerCarton: 325, category: 'Pakola' },
    { name: 'Pakola Water 1.5 ltr', customerProductName: 'Pakola Water 1.5 ltr', piecesPerCarton: 6, costPricePerCarton: 325, category: 'Pakola' },
    { name: 'Pakola 500 ml', customerProductName: 'Pakola 500 ml', piecesPerCarton: 12, costPricePerCarton: 845, category: 'Pakola' },
    { name: 'Pakola 1.5 ltr', customerProductName: 'Pakola 1.5 ltr', piecesPerCarton: 6, costPricePerCarton: 845, category: 'Pakola' },
    { name: 'Pakola 300 ml', customerProductName: 'Pakola 300 ml', piecesPerCarton: 12, costPricePerCarton: 545, category: 'Pakola' },

    // COLA NEXT
    { name: 'Cola Next Jumbo', customerProductName: 'Cola Next Jumbo', piecesPerCarton: 6, costPricePerCarton: 715, category: 'Cola Next' },
    { name: 'Cola Next 1.5 ltr', customerProductName: 'Cola Next 1.5 ltr', piecesPerCarton: 6, costPricePerCarton: 705, category: 'Cola Next' },
    { name: 'Cola Next 1 ltr', customerProductName: 'Cola Next 1 ltr', piecesPerCarton: 12, costPricePerCarton: 605, category: 'Cola Next' },
    { name: 'Cola Next 500 ml', customerProductName: 'Cola Next 500 ml', piecesPerCarton: 12, costPricePerCarton: 770, category: 'Cola Next' },
    { name: 'Cola Next 300 ml', customerProductName: 'Cola Next 300 ml', piecesPerCarton: 12, costPricePerCarton: 570, category: 'Cola Next' },
];

async function importInventory() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        for (const item of inventory) {
            const costPerPiece = item.costPricePerCarton / item.piecesPerCarton;
            const newItem = new Product({
                ...item,
                costPricePerPiece: costPerPiece,
                pricePerCarton: item.costPricePerCarton + 50, // Default markup
                pricePerPiece: costPerPiece + 5,
                stockInPieces: 0
            });
            await newItem.save();
            console.log(`Imported: ${item.name}`);
        }

        console.log('Inventory import complete.');
        process.exit(0);
    } catch (error) {
        console.error('Import failed:', error);
        process.exit(1);
    }
}

importInventory();
