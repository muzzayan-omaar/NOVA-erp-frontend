// Reads messy real-world product files (Excel CSVs, Tally reports, semicolon
// files, UTF-16 text) and turns them into clean rows. No dependencies, and it
// never changes data: it only reads and reports what it found.

/* ------------------------------ fields ------------------------------ */

// `ambiguous` synonyms are words that mean different things in different
// reports (Tally's "Rate" can be a cost or a selling rate). We still suggest
// them, but flag them so a person confirms instead of us guessing silently.
export const FIELD_DEFS = [
  {
    key: "name", label: "Product name", required: true,
    synonyms: ["name", "productname", "product", "item", "itemname", "stockitem", "stockitemname", "particulars", "itemdescription", "goods", "article", "productdescription"],
    ambiguous: [],
  },
  {
    key: "sku", label: "SKU / item code", required: false,
    synonyms: ["sku", "itemcode", "productcode", "partno", "partnumber", "stockcode", "itemno", "code"],
    ambiguous: ["code"],
  },
  {
    key: "barcode", label: "Barcode", required: false,
    synonyms: ["barcode", "barcodeno", "barcodenumber", "ean", "upc", "gtin"],
    ambiguous: [],
  },
  {
    key: "buyingPrice", label: "Buying / cost price", required: false,
    synonyms: ["buyingprice", "costprice", "cost", "purchaseprice", "purchaserate", "buyprice", "unitcost", "buyingcost", "costrate", "rate"],
    ambiguous: ["rate"],
  },
  {
    key: "sellingPrice", label: "Selling price", required: false,
    synonyms: ["sellingprice", "saleprice", "salesprice", "salerate", "retailprice", "sellprice", "unitprice", "mrp", "price"],
    ambiguous: ["price"],
  },
  {
    key: "stockQuantity", label: "Quantity on hand", required: false,
    synonyms: ["quantity", "qty", "stockonhand", "onhand", "openingstock", "openingqty", "openingquantity", "closingstock", "closingqty", "closingquantity", "qtyonhand", "stockqty", "stock", "balance"],
    ambiguous: ["stock", "balance"],
  },
  {
    key: "unitType", label: "Unit (pcs, kg…)", required: false,
    synonyms: ["unit", "uom", "unitofmeasure", "units", "baseunit", "measure", "unittype", "per"],
    ambiguous: ["per"],
  },
  {
    key: "category", label: "Category / group", required: false,
    synonyms: ["category", "stockgroup", "itemgroup", "productgroup", "group", "department", "class"],
    ambiguous: ["group", "class"],
  },
];

const normalizeHeader = (h) =>
  String(h ?? "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "") // "Selling Price (UGX)" -> "selling price"
    .replace(/[^a-z0-9]/g, "");

/* ----------------------------- decoding ----------------------------- */

export const decodeFileBuffer = (buffer) => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let encoding = "utf-8";
  let offset = 0;

  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    encoding = "utf-16le";
    offset = 2;
  } else if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    encoding = "utf-16be";
    offset = 2;
  } else if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    offset = 3;
  } else {
    // UTF-16 with no byte-order mark: plain text then has a zero in every other byte.
    const n = Math.min(bytes.length, 2000);
    let zerosEven = 0;
    let zerosOdd = 0;
    for (let i = 0; i < n; i++) if (bytes[i] === 0) (i % 2 === 0 ? zerosEven++ : zerosOdd++);
    if (n > 8 && zerosOdd > n * 0.3 && zerosEven < n * 0.05) encoding = "utf-16le";
    else if (n > 8 && zerosEven > n * 0.3 && zerosOdd < n * 0.05) encoding = "utf-16be";
  }

  const body = bytes.subarray(offset);
  try {
    return { text: new TextDecoder(encoding, { fatal: true }).decode(body), encoding: encoding === "utf-8" ? (offset ? "utf-8 (with BOM)" : "utf-8") : encoding };
  } catch {
    // Not valid UTF-8: old Windows/Excel files are usually windows-1252.
    return { text: new TextDecoder("windows-1252").decode(body), encoding: "windows-1252" };
  }
};

/* ----------------------------- parsing ------------------------------ */

const DELIMITERS = [",", ";", "\t", "|"];
export const DELIMITER_NAMES = { ",": "comma", ";": "semicolon", "\t": "tab", "|": "pipe" };

const countOutsideQuotes = (line, delimiter) => {
  let count = 0;
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === delimiter && !inQuotes) count++;
  }
  return count;
};

export const detectDelimiter = (text) => {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim() !== "").slice(0, 40);
  let best = ",";
  let bestScore = -1;

  for (const d of DELIMITERS) {
    const counts = lines.map((l) => countOutsideQuotes(l, d)).filter((c) => c > 0);
    if (counts.length < 2) continue;
    const freq = {};
    counts.forEach((c) => (freq[c] = (freq[c] || 0) + 1));
    const [modeCount, modeLines] = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
    // Reward a separator that splits many lines the same way, into several columns.
    const score = modeLines * Math.min(Number(modeCount), 12);
    if (score > bestScore) {
      best = d;
      bestScore = score;
    }
  }
  return best;
};

// Handles quoted cells, "" for a literal quote, and line breaks inside quotes.
export const parseDelimited = (text, delimiter) => {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQuotes = false;
      } else cell += ch;
      continue;
    }

    if (ch === '"') inQuotes = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.map((r) => r.map((c) => c.trim()));
};

/* ------------------------- header detection ------------------------- */

const SYNONYM_LOOKUP = (() => {
  const map = new Map();
  for (const f of FIELD_DEFS) for (const s of f.synonyms) if (!map.has(s)) map.set(s, f.key);
  return map;
})();

// Real exports often have a title, company name and date range above the
// headers. The header row is the one that looks most like column labels.
export const detectHeaderRow = (rows) => {
  let bestIndex = -1;
  let bestScore = 0;

  rows.slice(0, 40).forEach((row, i) => {
    const score = row.reduce((s, cell) => s + (SYNONYM_LOOKUP.has(normalizeHeader(cell)) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  });
  if (bestScore >= 2) return { index: bestIndex, recognised: true };

  // No recognisable labels: take the first wide row that is mostly text.
  const fallback = rows.findIndex(
    (row) => row.filter((c) => c !== "").length >= 2 && row.filter((c) => c !== "" && Number.isNaN(Number(c.replace(/,/g, "")))).length >= Math.ceil(row.filter((c) => c !== "").length / 2)
  );
  return { index: Math.max(fallback, 0), recognised: false };
};

export const suggestMapping = (headers) => {
  const candidates = [];
  headers.forEach((h, index) => {
    const norm = normalizeHeader(h);
    const field = SYNONYM_LOOKUP.get(norm);
    if (!field) return;
    const def = FIELD_DEFS.find((f) => f.key === field);
    candidates.push({ field, index, confident: !def.ambiguous.includes(norm) });
  });

  // One column per field, one field per column. Confident matches win.
  candidates.sort((a, b) => Number(b.confident) - Number(a.confident));
  const mapping = {};
  const usedColumns = new Set();
  for (const c of candidates) {
    if (mapping[c.field] !== undefined || usedColumns.has(c.index)) continue;
    mapping[c.field] = { index: c.index, confident: c.confident };
    usedColumns.add(c.index);
  }
  return mapping;
};

/* ------------------------------ numbers ----------------------------- */

const INVISIBLE_SPACES = /[\u00a0\u2007\u202f\u2009\s]/g;

// Returns { value, ok, empty, drCr }. ok=false means "this isn't a number we
// can read safely": the caller shows a warning rather than guessing.
export const parseNumber = (raw) => {
  if (raw === null || raw === undefined) return { value: null, ok: true, empty: true };
  let s = String(raw).replace(/\u2212/g, "-").trim();
  if (s === "" || s === "-" || /^n\/?a$/i.test(s)) return { value: null, ok: true, empty: true };

  let negative = false;
  let drCr = null;

  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/\b(dr|cr)\.?\s*$/i, (m) => {
    drCr = m.trim().slice(0, 2).toLowerCase();
    return "";
  });
  s = s.replace(/[\s/=]+$/g, ""); // "1,500 /="
  s = s.replace(/^[^\d\-+.,]+/, ""); // leading currency: UGX, USh, $, Sh
  s = s.replace(INVISIBLE_SPACES, "");
  if (s.endsWith("-")) {
    negative = !negative;
    s = s.slice(0, -1);
  }
  if (s.startsWith("-")) {
    negative = !negative;
    s = s.slice(1);
  }
  s = s.replace(/^\+/, "");

  if (!/^[\d.,]+$/.test(s) || !/\d/.test(s)) return { value: null, ok: false, empty: false };

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    const decimalIsComma = s.lastIndexOf(",") > s.lastIndexOf(".");
    s = decimalIsComma ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (hasComma) {
    const looksThousands = /^\d{1,3}(,\d{3})+$/.test(s) && !/^0,/.test(s);
    if (looksThousands) s = s.replace(/,/g, "");
    else if (/^\d+,\d{1,3}$/.test(s) && (s.split(",").length === 2)) s = s.replace(",", ".");
    else return { value: null, ok: false, empty: false };
  } else if (hasDot) {
    // 1.234.567 is thousands; a single dot is a decimal point.
    if ((s.match(/\./g) || []).length > 1) {
      if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
      else return { value: null, ok: false, empty: false };
    }
  }

  const value = Number(s);
  if (!Number.isFinite(value)) return { value: null, ok: false, empty: false };
  return { value: negative ? -value : value, ok: true, empty: false, drCr };
};

// "120 Nos" -> { qty: 120, unit: "Nos" }. "2 Box 3 Nos" is a compound
// quantity that needs a conversion we won't guess, so it's reported.
export const splitQuantityUnit = (raw) => {
  const s = String(raw ?? "").trim();
  if (s === "") return { qty: null, unit: null, ok: true, empty: true };

  const pairs = [...s.matchAll(/(-?[\d.,]+)\s*([A-Za-z][A-Za-z.]*)?/g)].filter((m) => /\d/.test(m[1]));
  if (pairs.length > 1) return { qty: null, unit: null, ok: false, compound: true, empty: false };

  const m = s.match(/^\s*([\d.,\-()]+)\s*([A-Za-z][A-Za-z.]*)?\s*$/);
  if (!m) {
    const n = parseNumber(s);
    return { qty: n.value, unit: null, ok: n.ok, empty: n.empty };
  }
  const n = parseNumber(m[1]);
  return { qty: n.value, unit: m[2] ? m[2].replace(/\.$/, "") : null, ok: n.ok, empty: false };
};

const UNIT_ALIASES = {
  nos: "pcs", no: "pcs", pcs: "pcs", pc: "pcs", piece: "pcs", pieces: "pcs", each: "pcs", unit: "pcs", units: "pcs",
  kg: "kg", kgs: "kg", kilo: "kg", kilogram: "kg", kilograms: "kg",
  l: "l", ltr: "l", ltrs: "l", lt: "l", litre: "l", litres: "l", liter: "l", liters: "l",
  m: "m", mtr: "m", mtrs: "m", meter: "m", meters: "m", metre: "m", metres: "m",
  box: "box", boxes: "box", bag: "bag", bags: "bag",
};
export const normalizeUnit = (raw) => {
  if (!raw) return null;
  const key = String(raw).trim().toLowerCase().replace(/\.$/, "");
  return UNIT_ALIASES[key] || key;
};

/* ----------------------- applying a mapping ------------------------- */

const TOTAL_ROW = /^\s*(grand\s*)?total\b/i;

// Turns raw cells into clean product rows plus plain-English issues.
export const applyMapping = (dataRows, mapping, firstDataRowNumber = 2) => {
  const cell = (row, field) => (mapping[field] ? row[mapping[field].index] ?? "" : "");
  const out = [];
  let skippedTotals = 0;

  dataRows.forEach((row, i) => {
    const rowNumber = firstDataRowNumber + i;
    const issues = [];
    const name = String(cell(row, "name")).trim();

    if (TOTAL_ROW.test(name)) {
      skippedTotals++;
      return;
    }

    const price = (field, label) => {
      const n = parseNumber(cell(row, field));
      if (!n.ok) issues.push({ level: "error", field, message: `${label} "${cell(row, field)}" isn't a number we can read` });
      else if (n.value !== null && n.value < 0) issues.push({ level: "error", field, message: `${label} is negative` });
      return n.value;
    };

    const buyingPrice = price("buyingPrice", "Buying price");
    const sellingPrice = price("sellingPrice", "Selling price");

    // Quantity may carry its unit ("120 Nos").
    const q = splitQuantityUnit(cell(row, "stockQuantity"));
    let stockQuantity = q.qty;
    if (q.compound) issues.push({ level: "error", field: "stockQuantity", message: `Quantity "${cell(row, "stockQuantity")}" mixes two units, so we can't convert it safely` });
    else if (!q.ok) issues.push({ level: "error", field: "stockQuantity", message: `Quantity "${cell(row, "stockQuantity")}" isn't a number we can read` });
    else if (stockQuantity !== null && stockQuantity < 0) issues.push({ level: "warning", field: "stockQuantity", message: "Quantity is negative" });

    const unitCell = String(cell(row, "unitType")).trim();
    const unitType = normalizeUnit(unitCell || q.unit) || null;

    if (!name) issues.push({ level: "error", field: "name", message: "No product name" });
    if (name && sellingPrice === null) issues.push({ level: "warning", field: "sellingPrice", message: "No selling price. It would be imported switched off until you set one" });

    out.push({
      rowNumber,
      name,
      sku: String(cell(row, "sku")).trim() || null,
      barcode: String(cell(row, "barcode")).trim() || null,
      buyingPrice,
      sellingPrice,
      stockQuantity,
      unitType,
      category: String(cell(row, "category")).trim() || null,
      issues,
    });
  });

  return { rows: out, skippedTotals };
};

/* ---------------------------- the analyzer -------------------------- */

export const analyzeCsvBuffer = (buffer) => {
  const { text, encoding } = decodeFileBuffer(buffer);
  const delimiter = detectDelimiter(text);
  const rows = parseDelimited(text, delimiter);
  const warnings = [];

  if (rows.length === 0 || rows.every((r) => r.every((c) => c === ""))) {
    return { empty: true, encoding, delimiter, warnings: ["The file is empty."], headers: [], dataRows: [], mapping: {} };
  }

  const { index: headerIndex, recognised } = detectHeaderRow(rows);
  const headers = rows[headerIndex] || [];
  const dataRows = rows.slice(headerIndex + 1).filter((r) => r.some((c) => c !== ""));
  const mapping = suggestMapping(headers);

  if (headerIndex > 0) warnings.push(`Ignored ${headerIndex} title row${headerIndex === 1 ? "" : "s"} above the column headings (row ${headerIndex + 1}).`);
  if (!recognised) warnings.push("We couldn't recognise the column headings, so please check each column below.");
  if (delimiter !== ",") warnings.push(`This file separates columns with a ${DELIMITER_NAMES[delimiter]}, not a comma. That's fine, we read it.`);
  if (encoding.startsWith("utf-16") || encoding === "windows-1252") warnings.push(`This file uses ${encoding} text encoding. We converted it, so names should read correctly. Check any accented characters.`);

  const width = headers.length;
  const ragged = dataRows.filter((r) => r.length !== width).length;
  if (ragged > 0) warnings.push(`${ragged} row${ragged === 1 ? " has" : "s have"} a different number of columns from the headings. Check them in the preview.`);

  const seen = new Map();
  headers.forEach((h, i) => {
    const k = normalizeHeader(h);
    if (k && seen.has(k)) warnings.push(`Two columns are both called "${h}" (columns ${seen.get(k) + 1} and ${i + 1}).`);
    else if (k) seen.set(k, i);
  });

  if (dataRows.length === 0) warnings.push("We found the headings but no product rows beneath them.");

  return {
    empty: false,
    encoding,
    delimiter,
    delimiterName: DELIMITER_NAMES[delimiter],
    headerRow: headerIndex + 1,
    headers,
    dataRows,
    rowCount: dataRows.length,
    mapping,
    warnings,
  };
};

/* ----------------------------- the template ------------------------- */

export const TEMPLATE_HEADERS = ["Product Name", "SKU", "Barcode", "Buying Price", "Selling Price", "Quantity", "Unit", "Category"];

export const buildTemplateCsv = () =>
  "\uFEFF" +
  [
    TEMPLATE_HEADERS.join(","),
    'Cement 50kg,CEM-50,6001234567890,32000,36000,120,bag,Building',
    'Hammer,HAM-01,,8000,12000,25,pcs,Tools',
  ].join("\r\n") +
  "\r\n";