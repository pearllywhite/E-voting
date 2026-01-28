/// ================= KONFIGURASI =================
const API_URL = 'https://script.google.com/macros/s/AKfycbxYwzrg3hllUyvl3gfA5BO34EEMxyG0b3poikahXixAa3nUmbQozP7eOOP95AfNcGTT/exec';

let currentUserNIM = '';
let currentUserRole = '';


$('#formLogin').on('submit', async function (e) {
  e.preventDefault();

  const nim = $('#inputNIM').val().trim();
  const pass = $('#inputPassword').val().trim();

  if (!nim || !pass) {
    alert('NIM dan Password wajib diisi');
    return;
  }
//tampilan masing masing
  try {
    const url =
      API_URL +
      '?action=login' +
      '&nim=' + encodeURIComponent(nim) +
      '&pass=' + encodeURIComponent(pass);

    const res = await fetch(url);
    const data = JSON.parse(await res.text());

    if (data.status === 'success') {
      currentUserNIM = data.nim;
      currentUserRole = data.role;

      // ===== TAMPILKAN APLIKASI =====
      $('#loginSection').addClass('d-none');
      $('#mainAppSection').removeClass('d-none');

      // ===== SET ROLE BADGE =====
      $('#roleBadge').text(data.role.toUpperCase());

      // ===== ROLE CONTROL =====
      if (data.role === 'admin') {
        $('.admin-only').removeClass('d-none');
        $('.user-only').addClass('d-none');
      } else {
        $('.user-only').removeClass('d-none');
        $('.admin-only').addClass('d-none');
      }

      // ===== DEFAULT PAGE =====
      showPage('home');

    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
    alert('Gagal koneksi ke server');
  }
});
//e

// ================= NAVIGATION =================
$('.nav-link').on('click', function (e) {
  e.preventDefault();
  const target = $(this).data('target');
  if (target) showPage(target);
});

function showPage(id) {
  $('.page-section').addClass('d-none');
  $('#' + id).removeClass('d-none');

  $('.nav-link').removeClass('active');
  $(`.nav-link[data-target="${id}"]`).addClass('active');
}

// ================= VOTING =================
$('#votingForm').on('submit', async function (e) {
  e.preventDefault();

  const bem_univ = $('input[name="bem_univ"]:checked').val();
  const bem_fkom = $('input[name="bem_fkom"]:checked').val();
  const blm_fkom = $('input[name="blm_fkom"]:checked').val();

  if (!bem_univ || !bem_fkom || !blm_fkom) {
    alert('Semua pilihan wajib diisi');
    return;
  }

  try {
    const url =
      API_URL +
      '?action=vote' +
      '&nim=' + currentUserNIM +
      '&bem_univ=' + bem_univ +
      '&bem_fkom=' + bem_fkom +
      '&blm_fkom=' + blm_fkom;

    const res = await fetch(url);
    const data = JSON.parse(await res.text());

    if (data.status === 'success') {
      $('#finishOverlay').removeClass('d-none');
      $('#mainAppSection').addClass('d-none');
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
    alert('Gagal mengirim voting');
  }
});
//endvoting

//  ASPIRASI 
$('#formAspirasi').on('submit', async function (e) {
  e.preventDefault();

  try {
    const url =
      API_URL +
      '?action=aspirasi' +
      '&harapan=' + encodeURIComponent($('#inputHarapan').val()) +
      '&saran=' + encodeURIComponent($('#inputSaran').val()) +
      '&rate=' + encodeURIComponent($('#inputRate').val());

    const res = await fetch(url);
    const data = JSON.parse(await res.text());

    alert(data.message || 'Aspirasi terkirim');
    $('#formAspirasi')[0].reset();
  } catch (err) {
    console.error(err);
    alert('Gagal mengirim aspirasi');
  }
});
// 6. FITUR ADMIN: QUICK COUNT (Baca dari API)
function loadQuickCount() {
  $('#resultsContainer').html('<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Mengambil data live count...</p></div>');

  $.getJSON(API_URL, { action: "read_count" }, function (response) {
    if (response.status === 'success') {
      let stats = response.result;
      let total = response.total;

      let cats = [
        { id: 'bem_univ', label: 'BEM Universitas' },
        { id: 'bem_fkom', label: 'BEM FKOM' },
        { id: 'blm_fkom', label: 'BLM FKOM' }
      ];

      let html = '';

      if (total === 0) {
        $('#resultsContainer').html('<div class="col-12 text-center"><div class="alert alert-warning">Belum ada suara masuk.</div></div>');
        return;
      }

      cats.forEach(cat => {
        let v1 = stats[cat.id + '_01'] || 0;
        let v2 = stats[cat.id + '_02'] || 0;

        // Kalkulasi Persentase
        let p1 = total > 0 ? (v1 / total * 100).toFixed(1) : 0;
        let p2 = total > 0 ? (v2 / total * 100).toFixed(1) : 0;

        html += `
                    <div class="col-md-4 mb-4">
                        <div class="card p-3 shadow-sm h-100 border-0">
                            <h5 class="fw-bold text-center mb-3 text-secondary border-bottom pb-2">${cat.label}</h5>
                            
                            <div class="mb-3">
                                <div class="d-flex justify-content-between small fw-bold mb-1">
                                    <span>Paslon 01</span>
                                    <span>${v1} (${p1}%)</span>
                                </div>
                                <div class="progress" style="height: 25px;">
                                    <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" 
                                         style="width:${p1}%; background:#9b59b6" 
                                         aria-valuenow="${p1}" aria-valuemin="0" aria-valuemax="100">
                                         ${p1}%
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div class="d-flex justify-content-between small fw-bold mb-1">
                                    <span>Paslon 02</span>
                                    <span>${v2} (${p2}%)</span>
                                </div>
                                <div class="progress" style="height: 25px;">
                                    <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" 
                                         style="width:${p2}%; background:#e056fd" 
                                         aria-valuenow="${p2}" aria-valuemin="0" aria-valuemax="100">
                                         ${p2}%
                                    </div>
                                </div>
                            </div>
                            
                            <div class="text-center mt-3">
                                <span class="badge bg-light text-dark border">Total Suara: ${v1 + v2}</span>
                            </div>
                        </div>
                    </div>`;
      });

      $('#resultsContainer').html(html);
    } else {
      $('#resultsContainer').html('<div class="col-12 text-center text-danger">Gagal memuat data dari server.</div>');
    }
  }).fail(function () {
    $('#resultsContainer').html('<div class="col-12 text-center text-danger">Terjadi kesalahan koneksi internet.</div>');
  });
}

// 7. FITUR ADMIN: LIST ASPIRASI (Baca dari API)
function loadAspirasi() {
  const tbody = $('#tabelAspirasiAdmin');
  tbody.html('<tr><td colspan="5" class="text-center py-4"><div class="spinner-border text-primary spinner-border-sm"></div> Memuat data...</td></tr>');

  $.getJSON(API_URL, { action: "read_aspirasi" }, function (response) {
    if (response.status === 'success') {
      tbody.empty();

      if (response.data.length === 0) {
        tbody.html('<tr><td colspan="5" class="text-center">Belum ada data aspirasi.</td></tr>');
        return;
      }

      // Render Data (Format dr API: [Waktu, Harapan, Saran, Rate])
      // Kita ambil row[1], row[2], row[3]
      response.data.forEach((row, i) => {
        tbody.append(`
                        <tr>
                            <td>${i + 1}</td>
                            <td>${row[1] || '-'}</td>
                            <td>${row[2] || '-'}</td>
                            <td>${row[3] || '-'}</td>
                            <td><span class="badge bg-success">Terkirim</span></td> 
                        </tr>
                    `);
      });
    } else {
      tbody.html('<tr><td colspan="5" class="text-center text-danger">Gagal mengambil data.</td></tr>');
    }
  });
}

// ================= LOGOUT =================
$('.logout-trigger').on('click', function () {
  location.reload();
});
