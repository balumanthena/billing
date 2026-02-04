
export function amountToWords(amount: number): string {
    const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const convertLessThanOneThousand = (n: number): string => {
        if (n === 0) return "";
        if (n < 10) return units[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "");
        return units[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertLessThanOneThousand(n % 100) : "");
    };

    if (amount === 0) return "Zero Rupees Only";

    const parts = amount.toString().split(".");
    let integerPart = parseInt(parts[0]);
    const decimalPart = parts.length > 1 ? parseInt(parts[1].substring(0, 2)) : 0;

    let words = "";

    // Indian Numbering System
    // Crores
    if (integerPart >= 10000000) {
        words += convertLessThanOneThousand(Math.floor(integerPart / 10000000)) + " Crore ";
        integerPart %= 10000000;
    }
    // Lakhs
    if (integerPart >= 100000) {
        words += convertLessThanOneThousand(Math.floor(integerPart / 100000)) + " Lakh ";
        integerPart %= 100000;
    }
    // Thousands
    if (integerPart >= 1000) {
        words += convertLessThanOneThousand(Math.floor(integerPart / 1000)) + " Thousand ";
        integerPart %= 1000;
    }

    if (integerPart > 0) {
        words += convertLessThanOneThousand(integerPart);
    }

    words += " Rupees";

    if (decimalPart > 0) {
        words += " and " + convertLessThanOneThousand(decimalPart) + " Paise";
    }

    return words.trim() + " Only";
}
