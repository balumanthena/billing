
export function toWords(amount: number): string {
    const a = [
        '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
    ];
    const b = [
        '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
    ];

    const num = parseFloat(amount.toString());
    if (isNaN(num)) return '';
    if (num === 0) return 'Zero Rupees Only';

    const n = ('000000000' + num.toFixed(2)).slice(-12).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';

    let str = '';
    // Crore
    str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
    // Lakh
    str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
    // Thousand
    str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
    // Hundred
    str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';

    // Tens & Ones
    if (Number(n[5]) !== 0) {
        str += 'and ';
        str += (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]);
    }

    return str.trim() + ' Rupees Only';
}

const n = '000000000' // just to keep compiler happy with the regex context if needed, but the logic above seems correct for millions/billions simplification for India format? 
// actually Indian format is 2,2,3 for Crore, Lakh, Thousand. 
// Standard regex: ^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$ is 2+2+2+1+2 = 9 digits. 
// Max 99 Crore. Sufficient.

// Let's refine the helper to be simpler and exported securely.

export function numberToIndianRupees(num: number): string {
    if (!num) return 'Zero Rupees Only'

    // Split integer and decimal
    const parts = num.toString().split('.')
    let integerPart = parseInt(parts[0])
    const decimalPart = parts[1] ? parseInt(parts[1].substring(0, 2)) : 0

    const single = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
    const double = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    function convertGroup(n: number): string {
        if (n === 0) return ""
        if (n < 10) return single[n]
        if (n < 20) return double[n - 10]
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + single[n % 10] : "")
        if (n < 1000) return single[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convertGroup(n % 100) : "")
        return ""
    }

    let words = ""

    // Crores
    const crore = Math.floor(integerPart / 10000000)
    integerPart %= 10000000
    if (crore > 0) words += convertGroup(crore) + " Crore "

    // Lakhs
    const lakh = Math.floor(integerPart / 100000)
    integerPart %= 100000
    if (lakh > 0) words += convertGroup(lakh) + " Lakh "

    // Thousands
    const thousand = Math.floor(integerPart / 1000)
    integerPart %= 1000
    if (thousand > 0) words += convertGroup(thousand) + " Thousand "

    // Hundreds & units
    if (integerPart > 0) words += convertGroup(integerPart)

    if (words === "") words = "Zero"

    if (decimalPart > 0) {
        // Paire logic if needed, but standard is usually "Rupees ... and X Pasie" or just rounded.
        // User asked for "Rupees Only".
        // Let's stick to integer rupees for simplicity unless mandatory? 
        // User example: "Two Lakh Thirty Six Thousand Rupees Only". No paise.
        // We will ignore paise for the "Only" suffix.
    }

    return words.trim() + " Rupees Only"
}
