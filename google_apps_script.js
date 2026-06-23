// ================================================================
// GOOGLE APPS SCRIPT — Nargiza CRM (Admin + Ko'p menejer)
// Deploy: Web app | Execute as: Me | Who has access: Anyone
//
// Google Sheets da 3 ta sahifa (tab) kerak:
//   "Barcha lidlar" — Bot qo'shadigan va Admin ko'radigan lidlar
//   "Menejer1"      — 1-menejerning lidlari
//   "Menejer2"      — 2-menejerning lidlari
// ================================================================

const SPREADSHEET_ID = "1QLlIBT0_ytulG8HZ_P3kuen44VeZUnNWrWI2Dn8Sh4s";

const STAGES = [
  "Yangi lid","Chek yubordi","Ma'lumot berildi","Qayta aloqa",
  "To'lov kutilmoqda","Joy band qildi","To'liq to'lov","Atkaz",
];

function getSheet(tabName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  if (tabName) { const s = ss.getSheetByName(tabName); if (s) return s; }
  return ss.getSheets()[0];
}

function ensureHeaders(sheet) {
  if (!sheet.getRange(1,1).getValue()) {
    sheet.getRange(1,1,1,STAGES.length).setValues([STAGES]);
    sheet.getRange(1,1,1,STAGES.length).setFontWeight("bold").setBackground("#4A90D9").setFontColor("#FFFFFF");
  }
}

function getColIndex(stageName) {
  const idx = STAGES.indexOf(stageName);
  return idx === -1 ? 1 : idx+1;
}

function getFirstEmptyRow(sheet, col) {
  const lastRow = Math.max(sheet.getLastRow(), 2);
  const vals = sheet.getRange(2, col, lastRow, 1).getValues();
  for (let i=0; i<vals.length; i++) {
    if (!vals[i][0] || vals[i][0].toString().trim()==="") return i+2;
  }
  return vals.length+2;
}

function findByPhone(sheet, phone) {
  const clean = phone.toString().replace(/[\s+\-()]/g,"");
  const data = sheet.getDataRange().getValues();
  for (let r=1; r<data.length; r++) {
    for (let c=0; c<data[r].length; c++) {
      const cell = data[r][c].toString().replace(/[\s+\-()]/g,"");
      if (cell.includes(clean) || (clean.length>=9 && cell.includes(clean.slice(-9)))) {
        return { row:r+1, col:c+1, value:data[r][c].toString() };
      }
    }
  }
  return null;
}

function writeCell(sheet, row, col, value) {
  const r = sheet.getRange(row, col);
  r.clearDataValidations();
  r.setValue(value).setWrap(true);
  try {
    r.setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(STAGES,true).setAllowInvalid(true).build()
    );
  } catch(e) {}
}

// Yangi lid qo'shish (bot yoki tashqaridan)
function addLead(name, phone, date, tabName) {
  const sheet = getSheet(tabName || "Barcha lidlar");
  ensureHeaders(sheet);
  const col = getColIndex("Yangi lid");
  const row = getFirstEmptyRow(sheet, col);
  writeCell(sheet, row, col, "Ism: "+name+"\nRaqam: "+phone);
}

// Bir tabda bosqich o'zgartirish
function moveLead(phone, newStage, tabName) {
  const sheet = getSheet(tabName);
  ensureHeaders(sheet);
  const found = findByPhone(sheet, phone);
  const newCol = getColIndex(newStage);
  const val = found ? found.value : "Raqam: "+phone;
  const newRow = getFirstEmptyRow(sheet, newCol);
  writeCell(sheet, newRow, newCol, val);
  if (found) sheet.getRange(found.row, found.col).clearContent().clearDataValidations();
}

// ASOSIY FUNKSIYA: Bir tabdan boshqa tabga ko'chirish (Admin → Menejer)
function assignToManager(phone, targetTab, stage) {
  // 1. Barcha lidlar tabidan topish
  const srcSheet = getSheet("Barcha lidlar");
  const found = findByPhone(srcSheet, phone);
  if (!found) return { status:"error", message:"Lid topilmadi: "+phone };

  // 2. Menejer tabiga qo'shish
  const dstSheet = getSheet(targetTab);
  ensureHeaders(dstSheet);
  const dstCol = getColIndex(stage || found.value.includes("Yangi lid") ? "Yangi lid" : STAGES[0]);
  const dstRow = getFirstEmptyRow(dstSheet, dstCol);
  writeCell(dstSheet, dstRow, dstCol, found.value);

  // 3. Barcha lidlardan o'chirish
  srcSheet.getRange(found.row, found.col).clearContent().clearDataValidations();

  Logger.log("Assigned: "+phone+" → "+targetTab);
  return { status:"ok", assigned:true };
}

function getLeads(tabName) {
  const sheet = getSheet(tabName || "Barcha lidlar");
  ensureHeaders(sheet);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { status:"ok", leads:[], columns:STAGES };
  const headers = data[0];
  const leads = [];
  for (let r=1; r<data.length; r++) {
    for (let c=0; c<headers.length; c++) {
      const cell = data[r][c];
      if (cell && cell.toString().trim()!=="") {
        leads.push({ id:r+"_"+c, value:cell.toString(), stage:headers[c], row:r+1, col:c+1 });
      }
    }
  }
  return { status:"ok", leads, columns:headers, tab:sheet.getName() };
}

function corsResponse(data) {
  const out = ContentService.createTextOutput(JSON.stringify(data));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}

function doGet(e) {
  try {
    const p = e.parameter || {};
    const action = p.action || "list";
    const tab = p.tab || null;

    if (action === "list") return corsResponse(getLeads(tab));

    if (action === "assign") {
      // Admin lid ni menejergа berish
      const result = assignToManager(p.phone, p.targetTab, p.stage);
      return corsResponse(result);
    }

    if (action === "move") {
      if (p.targetTab) {
        // Boshqa tabga ko'chirish (assign)
        const result = assignToManager(p.phone, p.targetTab, p.stage);
        return corsResponse(result);
      }
      moveLead(p.phone, decodeURIComponent(p.stage||""), tab);
      return corsResponse({ status:"ok", moved:true });
    }

    if (action === "add") {
      addLead(
        decodeURIComponent(p.name||""), p.phone||"",
        p.date||new Date().toLocaleString("uz-UZ",{timeZone:"Asia/Tashkent"}),
        tab || "Barcha lidlar"
      );
      return corsResponse({ status:"ok", added:true });
    }

    return corsResponse({ status:"error", message:"Noto'g'ri action" });
  } catch(err) {
    return corsResponse({ status:"error", message:err.toString() });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const tab = data.tab || "Barcha lidlar";
    if (data.action==="add") { addLead(data.name||"", data.phone||"", data.date||"", tab); return corsResponse({status:"ok"}); }
    if (data.action==="move") {
      if (data.targetTab) { return corsResponse(assignToManager(data.phone, data.targetTab, data.stage)); }
      moveLead(data.phone||"", data.stage||"", tab);
      return corsResponse({status:"ok"});
    }
    return corsResponse({status:"error", message:"Unknown action"});
  } catch(err) {
    return corsResponse({status:"error", message:err.toString()});
  }
}
