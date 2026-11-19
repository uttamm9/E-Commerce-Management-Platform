/**
 * RFC 4180 compliant CSV generator utility
 * Properly handles quotation marks, commas, and line breaks in data cells
 */

/**
 * Format headers and data rows into an RFC 4180 compliant CSV string.
 * @param {Array<string>} headers - Column titles
 * @param {Array<Array<any>>} rows - 2D matrix of row cells
 * @returns {string} - CSV formatted string
 */
const formatCSV = (headers = [], rows = []) => {
  const escapeCell = (cell) => {
    if (cell === null || cell === undefined) {
      return '';
    }
    const str = String(cell);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map((row) => row.map(escapeCell).join(','));

  return [headerLine, ...rowLines].join('\r\n');
};

module.exports = {
  formatCSV,
};
