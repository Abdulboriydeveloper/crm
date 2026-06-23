// ================================================================
// GOOGLE APPS SCRIPT — Nargiza CRM
// Deploy: Web app | Execute as: Me | Who has access: Anyone
// ================================================================

const SPREADSHEET_ID = "1QLlIBT0_ytulG8HZ_P3kuen44VeZUnNWrWI2Dn8Sh4s";

const STAGES = [
  "Yangi lid",
  "Chek yubordi",
  "Ma'lumot berildi",
  "Qayta aloqa",
  "To'lov kutilmoqda",
  "Joy band qildi",
  "To'liq to'lov",
  "Atkaz",
];

function getSheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
}

function ensureHeaders() {
  const sheet = getSheet();
  const first = sheet.getRange(1, 1).getValue();
  if (!first || first === "") {
    sheet.getRange(1, 1, 1, STAGES.length).setValues([STAGES]);
    const h = sheet.getRange(1, 1, 1, STAGES.length);
    h.setFontWeight("bold").setBackground("#4A90D9").setFontColor("#FFFFFF");
  }
}

function getColIndex(stageName) {
  const idx = STAGES.indexOf(stageName);
  return idx === -1 ? 1 : idx + 1;
}

function getFirstEmptyRow(sheet, colIndex) {
  const lastRow = Math.max(sheet.getLastRow(), 2);
  const vals = sheet.getRange(2, colIndex, lastRow, 1).getValues();
  for (let i = 0; i < vals.length; i++) {
    if (!vals[i][0] || vals[i][0].toString().trim() === "") return i + 2;
  }
  return vals.length + 2;
}

function findByPhone(sheet, phone) {
  const clean = phone.toString().replace(/[\s+\-()]/g, "");
  const data = sheet.getDataRange().getValues();
  for (let r = 1; r < data.length; r++) {
    for (let c = 0; c < data[r].length; c++) {
      const cell = data[r][c].toString().replace(/[\s+\-()]/g, "");
      if (cell.includes(clean) || (clean.length >= 9 && cell.includes(clean.slice(-9)))) {
        return { row: r + 1, col: c + 1, value: data[r][c].toString() };
      }
    }
  }
  return null;
}

function writeCell(sheet, row, col, value) {
  const range = sheet.getRange(row, col);
  // Avval validation ni o'chirish — keyin yozish
  range.clearDataValidations();
  range.setValue(value);
  range.setWrap(true);
  // Dropdown qo'shish (majburiy emas, lekin qulay)
  addDropdown(sheet, row, col);
}

function addLead(name, phone, date) {
  ensureHeaders();
  const sheet = getSheet();
  const col = getColIndex("Yangi lid");
  const row = getFirstEmptyRow(sheet, col);
  const cellValue = "Ism: " + name + "\nRaqam: " + phone;
  writeCell(sheet, row, col, cellValue);
  Logger.log("Yangi lid qo'shildi: " + name + " | " + phone + " | row=" + row);
}

function moveLead(phone, newStage) {
  ensureHeaders();
  const sheet = getSheet();
  const found = findByPhone(sheet, phone);
  const newCol = getColIndex(newStage);
  const cellValue = found ? found.value : "Raqam: " + phone;
  const newRow = getFirstEmptyRow(sheet, newCol);
  writeCell(sheet, newRow, newCol, cellValue);
  if (found) {
    sheet.getRange(found.row, found.col).clearContent().clearDataValidations();
  }
  Logger.log("Ko'chirildi: " + phone + " → " + newStage);
}

function addDropdown(sheet, row, col) {
  try {
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(STAGES, true)
      .setAllowInvalid(true) // true — noto'g'ri qiymat kiritilsa ham xato chiqarmaydi
      .build();
    sheet.getRange(row, col).setDataValidation(rule);
  } catch(e) {
    Logger.log("Dropdown xatosi: " + e.toString());
  }
}

function getLeads() {
  ensureHeaders();
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { status: "ok", leads: [], columns: STAGES };
  const headers = data[0];
  const leads = [];
  for (let r = 1; r < data.length; r++) {
    for (let c = 0; c < headers.length; c++) {
      const cell = data[r][c];
      if (cell && cell.toString().trim() !== "") {
        leads.push({
          id: r + "_" + c,
          value: cell.toString(),
          stage: headers[c],
          row: r + 1,
          col: c + 1,
        });
      }
    }
  }
  return { status: "ok", leads, columns: headers };
}

function corsResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function doGet(e) {
  try {
    const p = e.parameter || {};
    const action = p.action || "list";

    if (action === "list") return corsResponse(getLeads());

    if (action === "move") {
      if (!p.phone || !p.stage) {
        return corsResponse({ status: "error", message: "phone va stage kerak" });
      }
      moveLead(p.phone, decodeURIComponent(p.stage));
      return corsResponse({ status: "ok", moved: true });
    }

    if (action === "add") {
      addLead(
        decodeURIComponent(p.name || ""),
        p.phone || "",
        p.date || new Date().toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" })
      );
      return corsResponse({ status: "ok", added: true });
    }

    return corsResponse({ status: "error", message: "Noto'g'ri action" });
  } catch (err) {
    return corsResponse({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === "add") {
      addLead(data.name || "", data.phone || "", data.date || "");
      return corsResponse({ status: "ok", added: true });
    }
    if (data.action === "move") {
      moveLead(data.phone || "", data.stage || "");
      return corsResponse({ status: "ok", moved: true });
    }
    return corsResponse({ status: "error", message: "Unknown action" });
  } catch (err) {
    return corsResponse({ status: "error", message: err.toString() });
  }
}
