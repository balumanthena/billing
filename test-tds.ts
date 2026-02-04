
import { calculateInvoice } from './lib/invoice-calculator';

const mockItems = [
    {
        id: '1',
        item_id: '1',
        description: 'Consulting Service',
        sac_code: '998311',
        quantity: 1,
        unit_price: 10000,
        tax_rate: 18
    }
];

console.log('--- Test 1: Exclusive + TDS 10% ---');
const res1 = calculateInvoice(mockItems, '10', '10', 'exclusive', 10);
console.log('Results:', JSON.stringify(res1, null, 2));
// Expect:
// Taxable: 10000
// GST: 1800
// Grand Total: 11800
// TDS (10% on 10000): 1000
// Net Receivable: 10800

console.log('\n--- Test 2: Inclusive + TDS 10% ---');
// Total is 11800 inclusive
// Taxable = 10000
// GST = 1800
// TDS = 10% of 10000 = 1000
// Net Receivable = 10800
const res2 = calculateInvoice(mockItems, '10', '10', 'inclusive', 10); // Note: here input price is unit_price, so result will be based on math.
// Actually my mock has unit_price 10000. 
// If Inclusive: Taxable = 10000 / 1.18 = 8474.58
// GST = 1525.42
// Grand Total = 10000
// TDS = 10% of 8474.58 = 847.46
// Net Receivable = 10000 - 847.46 = 9152.54
console.log('Results Inclusive:', JSON.stringify(res2, null, 2));
