/**
 * Excel report generator for Locked Meals.
 *
 * Why Excel over PDF? The PDF approach (html2canvas + jspdf) rasterizes the
 * DOM into images — files are large (megabytes) and text gets blurry. A real
 * Excel file with proper styling is sharper, smaller, prints cleanly, and
 * Bangla works natively without custom font embedding. It's also easier for
 * the admin to edit/share if needed.
 */

import ExcelJS from "exceljs";
import { formatDatePretty } from "./utils";

export interface ExcelFlatRow {
  flatName: string;
  breakfast: number;
  lunch: number;
  dinner: number;
}

export interface ExcelBuildingSection {
  buildingName: string;
  rows: ExcelFlatRow[];
  totals: { breakfast: number; lunch: number; dinner: number };
}

export interface ExcelGrandTotals {
  breakfast: number;
  lunch: number;
  dinner: number;
  totalMoney: number;
  totalUsers: number;
}

/* ---------- color palette (ARGB hex with FF alpha prefix) ---------- */
const C = {
  brandGreen: "FF0A8B5C",
  brandGreenDark: "FF076640",
  brandGreenLight: "FFE8F5EE",
  buildingBanner: "FFB44132",
  buildingBannerLight: "FFFCEDEB",
  totalLabel: "FF1A6FC9",
  totalRowBg: "FFEEF4FB",
  border: "FF94A3B8",
  borderLight: "FFCBD5E1",
  rowAlt: "FFFAFBFC",
  white: "FFFFFFFF",
  text: "FF1F2937",
  textMuted: "FF6B7280",
  headerBg: "FFF1F5F9",
};

// Use a font that ships with Windows and has both Latin + Bangla glyphs.
// Excel will fall back gracefully if missing on the user's machine.
const FONT_NAME = "Nirmala UI";

/* ---------- small style helpers ---------- */
const allBorders = (color = C.borderLight): Partial<ExcelJS.Borders> => ({
  top: { style: "thin", color: { argb: color } },
  bottom: { style: "thin", color: { argb: color } },
  left: { style: "thin", color: { argb: color } },
  right: { style: "thin", color: { argb: color } },
});

const fillSolid = (argb: string): ExcelJS.Fill => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb },
});

/**
 * Build & download the locked meals report as an .xlsx file.
 */
export async function downloadLockedMealsExcel(params: {
  date: string; // YYYY-MM-DD
  buildings: ExcelBuildingSection[];
  grandTotals: ExcelGrandTotals;
}) {
  const { date, buildings, grandTotals } = params;
  const prettyDate = formatDatePretty(date);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Niribili Home";
  wb.created = new Date();

  const ws = wb.addWorksheet("Meal Report", {
    pageSetup: {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.5,
        right: 0.5,
        top: 0.5,
        bottom: 0.5,
        header: 0.3,
        footer: 0.3,
      },
      horizontalCentered: true,
    },
  });

  // Column widths — sized so the table fits cleanly on A4 portrait
  ws.columns = [
    { width: 4 }, // A — left margin / building label spillover
    { width: 18 }, // B — Flat name
    { width: 16 }, // C — Breakfast
    { width: 14 }, // D — Lunch
    { width: 14 }, // E — Dinner
    { width: 14 }, // F — Total
  ];

  let row = 1;

  /* ============== TITLE BANNER ============== */
  ws.mergeCells(`A${row}:F${row}`);
  const title = ws.getCell(`A${row}`);
  title.value = "নিরিবিলি হোম  •  Niribili Home";
  title.font = {
    name: FONT_NAME,
    size: 20,
    bold: true,
    color: { argb: C.white },
  };
  title.fill = fillSolid(C.brandGreen);
  title.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(row).height = 36;
  row++;

  /* ============== SUBTITLE ============== */
  ws.mergeCells(`A${row}:F${row}`);
  const subtitle = ws.getCell(`A${row}`);
  subtitle.value = "লক করা মিল রিপোর্ট  •  Locked Meals Report";
  subtitle.font = {
    name: FONT_NAME,
    size: 12,
    color: { argb: C.text },
  };
  subtitle.fill = fillSolid(C.brandGreenLight);
  subtitle.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(row).height = 22;
  row++;

  /* ============== DATE ============== */
  ws.mergeCells(`A${row}:F${row}`);
  const dateCell = ws.getCell(`A${row}`);
  dateCell.value = `Report Date:  ${prettyDate}`;
  dateCell.font = {
    name: FONT_NAME,
    size: 11,
    italic: true,
    color: { argb: C.textMuted },
  };
  dateCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(row).height = 20;
  row++;

  // Spacer row
  ws.getRow(row).height = 8;
  row++;

  /* ============== COLUMN HEADERS ============== */
  const headerRow = row;
  const headers = [
    "",
    "Flat No",
    "সকাল",
    "দুপুর",
    "রাত",
    "মোট",
  ];
  headers.forEach((label, idx) => {
    const cell = ws.getCell(headerRow, idx + 1);
    cell.value = label;
    cell.font = {
      name: FONT_NAME,
      size: 11,
      bold: true,
      color: { argb: C.text },
    };
    cell.fill = fillSolid(C.headerBg);
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = allBorders(C.border);
  });
  ws.getRow(row).height = 24;
  row++;

  /* ============== BUILDING SECTIONS ============== */
  for (const building of buildings) {
    // Building name banner (merged across all columns)
    ws.mergeCells(`A${row}:F${row}`);
    const banner = ws.getCell(`A${row}`);
    banner.value = `বিল্ডিং  •  ${building.buildingName}`;
    banner.font = {
      name: FONT_NAME,
      size: 12,
      bold: true,
      color: { argb: C.white },
    };
    banner.fill = fillSolid(C.buildingBanner);
    banner.alignment = {
      horizontal: "left",
      vertical: "middle",
      indent: 2,
    };
    banner.border = allBorders(C.border);
    ws.getRow(row).height = 22;
    row++;

    // Data rows — one per flat
    if (building.rows.length === 0) {
      ws.mergeCells(`A${row}:F${row}`);
      const empty = ws.getCell(`A${row}`);
      empty.value = "কোনো অর্ডার নেই  /  No orders";
      empty.font = {
        name: FONT_NAME,
        size: 11,
        italic: true,
        color: { argb: C.textMuted },
      };
      empty.alignment = { horizontal: "center", vertical: "middle" };
      empty.border = allBorders(C.borderLight);
      ws.getRow(row).height = 20;
      row++;
    } else {
      building.rows.forEach((flat, idx) => {
        const isAlt = idx % 2 === 1;
        const cells: (string | number)[] = [
          "",
          flat.flatName,
          flat.breakfast > 0 ? flat.breakfast : "—",
          flat.lunch > 0 ? flat.lunch : "—",
          flat.dinner > 0 ? flat.dinner : "—",
          flat.breakfast + flat.lunch + flat.dinner,
        ];
        cells.forEach((value, c) => {
          const cell = ws.getCell(row, c + 1);
          cell.value = value;
          cell.font = {
            name: FONT_NAME,
            size: 11,
            color: { argb: value === "—" ? C.textMuted : C.text },
            bold: c === 1, // Flat name is bold
          };
          cell.alignment = {
            horizontal: c === 0 ? "left" : "center",
            vertical: "middle",
          };
          cell.border = allBorders(C.borderLight);
          if (isAlt) cell.fill = fillSolid(C.rowAlt);
        });
        ws.getRow(row).height = 18;
        row++;
      });
    }

    // Per-building subtotal row
    const subtotalCells: (string | number)[] = [
      "",
      "Sub Total",
      building.totals.breakfast,
      building.totals.lunch,
      building.totals.dinner,
      building.totals.breakfast +
        building.totals.lunch +
        building.totals.dinner,
    ];
    subtotalCells.forEach((value, c) => {
      const cell = ws.getCell(row, c + 1);
      cell.value = value;
      cell.font = {
        name: FONT_NAME,
        size: 11,
        bold: true,
        color: { argb: c === 1 ? C.totalLabel : C.text },
      };
      cell.fill = fillSolid(C.totalRowBg);
      cell.alignment = {
        horizontal: c === 0 ? "left" : "center",
        vertical: "middle",
      };
      cell.border = allBorders(C.border);
    });
    ws.getRow(row).height = 22;
    row++;

    // Spacer between buildings
    ws.getRow(row).height = 8;
    row++;
  }

  /* ============== GRAND TOTAL ============== */
  // Header bar
  ws.mergeCells(`A${row}:F${row}`);
  const gtHeader = ws.getCell(`A${row}`);
  gtHeader.value = "সর্বমোট মিল  •  GRAND TOTAL";
  gtHeader.font = {
    name: FONT_NAME,
    size: 13,
    bold: true,
    color: { argb: C.white },
  };
  gtHeader.fill = fillSolid(C.brandGreen);
  gtHeader.alignment = { horizontal: "center", vertical: "middle" };
  gtHeader.border = allBorders(C.brandGreen);
  ws.getRow(row).height = 26;
  row++;

  // Numbers row
  const gtCells: (string | number)[] = [
    "",
    "Total",
    grandTotals.breakfast,
    grandTotals.lunch,
    grandTotals.dinner,
    grandTotals.breakfast + grandTotals.lunch + grandTotals.dinner,
  ];
  gtCells.forEach((value, c) => {
    const cell = ws.getCell(row, c + 1);
    cell.value = value;
    cell.font = {
      name: FONT_NAME,
      size: 14,
      bold: true,
      color: { argb: c === 1 ? C.brandGreenDark : C.text },
    };
    cell.fill = fillSolid(C.brandGreenLight);
    cell.alignment = {
      horizontal: c === 0 ? "left" : "center",
      vertical: "middle",
    };
    cell.border = allBorders(C.brandGreen);
  });
  ws.getRow(row).height = 30;
  row++;

  // Spacer
  ws.getRow(row).height = 8;
  row++;

  /* ============== MONEY + USER COUNT SUMMARY ============== */
  // Money line (right-aligned)
  ws.mergeCells(`A${row}:E${row}`);
  const moneyLabel = ws.getCell(`A${row}`);
  moneyLabel.value = "মোট টাকা  •  Total Amount:";
  moneyLabel.font = {
    name: FONT_NAME,
    size: 12,
    bold: true,
    color: { argb: C.text },
  };
  moneyLabel.alignment = { horizontal: "right", vertical: "middle", indent: 1 };

  const moneyCell = ws.getCell(`F${row}`);
  moneyCell.value = `৳ ${grandTotals.totalMoney.toLocaleString()}`;
  moneyCell.font = {
    name: FONT_NAME,
    size: 13,
    bold: true,
    color: { argb: C.brandGreenDark },
  };
  moneyCell.fill = fillSolid(C.brandGreenLight);
  moneyCell.alignment = { horizontal: "center", vertical: "middle" };
  moneyCell.border = allBorders(C.brandGreen);
  ws.getRow(row).height = 24;
  row++;

  // Users line
  ws.mergeCells(`A${row}:E${row}`);
  const usersLabel = ws.getCell(`A${row}`);
  usersLabel.value = "মোট ইউজার  •  Total Users:";
  usersLabel.font = {
    name: FONT_NAME,
    size: 11,
    color: { argb: C.text },
  };
  usersLabel.alignment = { horizontal: "right", vertical: "middle", indent: 1 };

  const usersCell = ws.getCell(`F${row}`);
  usersCell.value = grandTotals.totalUsers;
  usersCell.font = {
    name: FONT_NAME,
    size: 12,
    bold: true,
    color: { argb: C.text },
  };
  usersCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(row).height = 20;
  row++;

  // Spacer
  ws.getRow(row).height = 12;
  row++;

  /* ============== FOOTER NOTE ============== */
  ws.mergeCells(`A${row}:F${row}`);
  const footer = ws.getCell(`A${row}`);
  footer.value = `Generated by Niribili Home Admin  •  ${new Date().toLocaleString()}`;
  footer.font = {
    name: FONT_NAME,
    size: 9,
    italic: true,
    color: { argb: C.textMuted },
  };
  footer.alignment = { horizontal: "center", vertical: "middle" };

  /* ---------- Trigger download ---------- */
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `locked-meals-${date}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
