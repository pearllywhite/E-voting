// ================= KONFIGURASI =================
const SS_ID = '1XOZgAESipOfMvortAeHzxzkEvptGoUmTbyLkxNJx2gw';

const SHEET_USERS    = 'Users';
const SHEET_VOTES    = 'Votes';
const SHEET_ASPIRASI = 'Aspirasi';

// ================= HANDLER UNTUK MENANGANI REQUEST ATAU PERMINTAAN DARI USER  =================
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

// pengcekan aksi 
function handleRequest(e) {
  const p = (e && e.parameter) ? e.parameter : {};
  let result;

  try {
    switch (p.action) {
      case 'login':          result = login(p); break;
      case 'vote':           result = vote(p); break;
      case 'aspirasi':       result = aspirasi(p); break;
      case 'read_count':     result = quickCount(); break;
      case 'read_aspirasi':  result = readAspirasi(); break;
      default:
        result = { status:'error', message:'Action tidak dikenal' };
    }
  } catch (err) {
    result = { status:'error', message: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}


// ================= LOGIN =================
function login(d) {
  const sh = SpreadsheetApp.openById(SS_ID).getSheetByName(SHEET_USERS);
  const rows = sh.getRange(2,1,sh.getLastRow()-1,4).getValues();

  for (let r of rows) {
    if (r[0] == d.nim && r[2] == d.pass) {
      return { status:'success', nim:r[0], role:r[3] };
    }
  }
  return { status:'error', message:'Login gagal' };
}

// ================= VOTING (ANTI DOBEL) =================
function vote(d) {
  const lock = LockService.getScriptLock();
  // 1. Kunci harus dipasang SEBELUM membaca data sheet
  lock.waitLock(15000); 

  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sh = ss.getSheetByName(SHEET_VOTES);
    const lastRow = sh.getLastRow();
    
    // Pastikan d.nim adalah string dan bersih dari spasi
    const inputNim = String(d.nim).trim();

    if (lastRow > 1) {
      // 2. Ambil data NIM dan paksa semuanya jadi String
      const nims = sh.getRange(2, 2, lastRow - 1, 1)
                     .getValues()
                     .flat()
                     .map(n => String(n).trim()); // Konversi setiap sel jadi string

      // 3. Cek keberadaan NIM
      if (nims.indexOf(inputNim) !== -1) {
        return { status: 'error', message: 'NIM ' + inputNim + ' sudah melakukan voting!' };
      }
    }

    // 4. Tambahkan tanda kutip satu (') agar Sheets menyimpannya sebagai TEXT
    sh.appendRow([
      new Date(),
      "'" + inputNim, 
      d.bem_univ,
      d.bem_fkom,
      d.blm_fkom
    ]);
    
    // Memaksa sheet menulis data saat itu juga sebelum lock dilepas
    SpreadsheetApp.flush(); 

    return { status: 'success', message: 'Voting berhasil' };

  } catch (e) {
    return { status: 'error', message: 'Error: ' + e.message };
  } finally {
    lock.releaseLock();
  }
}

// ================= ASPIRASI =================
function aspirasi(d) {
  const sh = SpreadsheetApp.openById(SS_ID).getSheetByName(SHEET_ASPIRASI);
  sh.appendRow([
    new Date(),
    d.harapan,
    d.saran,
    "⭐".repeat(parseInt(d.rate))
  ]);
  return { status:'success', message:'Aspirasi terkirim' };
}

// ================= QUICK COUNT =================
function quickCount() {
  const sh = SpreadsheetApp.openById(SS_ID).getSheetByName(SHEET_VOTES);
  if (sh.getLastRow() <= 1)
    return { status:'success', total:0, result:{} };

  const data = sh.getRange(2,3,sh.getLastRow()-1,3).getValues();

  let r = {
    bem_univ_01:0, bem_univ_02:0,
    bem_fkom_01:0, bem_fkom_02:0,
    blm_fkom_01:0, blm_fkom_02:0
  };

  data.forEach(x=>{
    if(x[0]=='01') r.bem_univ_01++;
    if(x[0]=='02') r.bem_univ_02++;
    if(x[1]=='01') r.bem_fkom_01++;
    if(x[1]=='02') r.bem_fkom_02++;
    if(x[2]=='01') r.blm_fkom_01++;
    if(x[2]=='02') r.blm_fkom_02++;
  });

  return { status:'success', total:data.length, result:r };
}

// ================= READ ASPIRASI =================
function readAspirasi() {
  const sh = SpreadsheetApp.openById(SS_ID).getSheetByName(SHEET_ASPIRASI);
  if (sh.getLastRow() <= 1)
    return { status:'success', data:[] };

  return {
    status:'success',
    data: sh.getRange(2,1,sh.getLastRow()-1,4).getDisplayValues()
  };
}
