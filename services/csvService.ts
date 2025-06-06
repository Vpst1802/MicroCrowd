
export interface CSVParseResult {
  data: Record<string, string>[];
  errors: { message: string; rowIndex?: number }[];
  headers: string[];
}

export function parseCSV(csvText: string): CSVParseResult {
  const result: CSVParseResult = {
    data: [],
    errors: [],
    headers: [],
  };

  if (!csvText.trim()) {
    result.errors.push({ message: "CSV content is empty." });
    return result;
  }

  const lines = csvText.trim().split(/\r\n|\n|\r/); // Handles different line endings

  if (lines.length === 0) {
    result.errors.push({ message: "CSV content has no lines." });
    return result;
  }

  // Basic header extraction: split by comma, trim whitespace
  result.headers = lines[0].split(',').map(header => header.trim());

  if (result.headers.length === 0 || result.headers.every(h => !h)) {
    result.errors.push({ message: "CSV headers are missing or empty." });
    return result;
  }
  
  if (lines.length < 2) {
    result.errors.push({ message: "CSV has headers but no data rows." });
    // Still return headers if they exist
    return result;
  }


  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    // This is a very basic CSV value parser. It doesn't handle commas inside quotes.
    // For robust parsing, a library would be needed.
    const values = line.split(','); 

    if (values.length !== result.headers.length) {
      result.errors.push({
        message: `Row ${i + 1}: Number of columns (${values.length}) does not match number of headers (${result.headers.length}). This row will be skipped.`,
        rowIndex: i + 1,
      });
      continue;
    }

    const rowObject: Record<string, string> = {};
    result.headers.forEach((header, index) => {
      rowObject[header] = values[index].trim();
    });
    result.data.push(rowObject);
  }
  
  if (result.data.length === 0 && result.errors.length === 0 && lines.length > 1) {
     result.errors.push({ message: "No data rows could be successfully parsed." });
  }


  return result;
}
