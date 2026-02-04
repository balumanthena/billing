
import { calculateInvoice } from './lib/invoice-calculator';

const mockItems = [
    {
        id: '1',
        item_id: '1',
        description: 'Test Item',
        sac_code: '123',
        quantity: 1,
        unit_price: 100, // Price
        tax_rate: 18
    }
];

console.log('--- Test 1: Exclusive Mode (Standard) ---');
const exclusiveResult = calculateInvoice(mockItems, '10', '10', 'exclusive'); // Intra-state
console.log('Exclusive Result:', JSON.stringify(exclusiveResult, null, 2));
// Expect: Taxable 100, Tax 18 (9+9), Total 118, Grand Total 118.

console.log('\n--- Test 2: Inclusive Mode ---');
const inclusiveResult = calculateInvoice(mockItems, '10', '10', 'inclusive'); // Intra-state
console.log('Inclusive Result:', JSON.stringify(inclusiveResult, null, 2));
// Expect: Total 100. Taxable = 100/1.18 = 84.75. Tax = 15.25. (7.63+7.62).
// Check grand total is close to 100.

console.log('\n--- Test 3: Inter-state Inclusive ---');
const interInclusive = calculateInvoice(mockItems, '10', '20', 'inclusive'); // Inter-state
console.log('Inter-Inclusive Result:', JSON.stringify(interInclusive, null, 2));
// Expect IGST 15.25.
