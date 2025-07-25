const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const uploadBox = document.getElementById('upload-box');
const fileMap = new Map(); // filename → File object

uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  const files = e.dataTransfer.files;
  sendToBackend(files);
});

fileInput.addEventListener('change', () => {
  const files = fileInput.files;
  sendToBackend(files);
});

function formatFileSize(bytes) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

function clearFiles() {
  fetch('/delete-all-images/', {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCSRFToken()
    }
  }).then(() => {
    fileList.innerHTML = '';
    fileInput.value = '';
    toggleUploadBoxVisibility();

    // ✅ Toast after bulk delete
    Swal.fire({
      toast: true,
      icon: 'success',
      title: 'All files deleted',
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000
    });
  });
}



function downloadFile(name, url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function toggleUploadBoxVisibility() {
  uploadBox.style.display = fileList.children.length > 0 ? 'block' : 'none';
}

function addFileToUI(filename, url) {
  const fileEl = document.createElement('div');
  fileEl.className = 'file-info';

  const name = document.createElement('div');
  name.className = 'file-details';

  const img = document.createElement('img');
  img.src = url;
  img.alt = filename;
  img.className = 'thumb preview-big';
  name.appendChild(img);

  const text = document.createElement('div');
  text.innerHTML = `
    <div class="file-name">${filename}</div>
    <div class="file-size">Stored</div>
  `;
  name.appendChild(text);

  const actions = document.createElement('div');
  actions.className = 'file-actions';

  const downloadBtn = document.createElement('button');
  downloadBtn.innerHTML = '⬇️';
  downloadBtn.title = 'Download file';
  downloadBtn.onclick = () => downloadFile(filename, url);

  const deleteBtn = document.createElement('button');
  deleteBtn.innerHTML = '🗑️';
  deleteBtn.title = 'Remove file from list';
  deleteBtn.onclick = () => {
  fetch('/delete-image/', {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCSRFToken(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `filename=${encodeURIComponent(filename)}`
  })
    .then(res => res.json())
    .then(() => {
      fileEl.remove();
      toggleUploadBoxVisibility();

      // ✅ Toast after delete
      Swal.fire({
        toast: true,
        icon: 'success',
        title: `${filename} deleted`,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      });
    });
};


  actions.appendChild(downloadBtn);
  actions.appendChild(deleteBtn);

  fileEl.appendChild(name);
  fileEl.appendChild(actions);
  fileList.appendChild(fileEl);
  toggleUploadBoxVisibility();
}

function showSensitiveDialog(filename, matches) {
  Swal.fire({
    title: 'Sensitive Content Detected',
    html: `<p><strong>${filename}</strong></p><pre>${matches?.join('\n') || 'Text hidden'}</pre>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Blur & Upload',
    denyButtonText: 'Upload Anyway',
    showDenyButton: true,
    cancelButtonText: 'Cancel Upload',
  }).then(result => {
    const originalFile = fileMap.get(filename);
    if (!originalFile) return console.error('Missing file for', filename);

    if (result.isConfirmed) {
      blurAndReupload(originalFile);
    } else if (result.isDenied) {
      uploadAnyway(originalFile);
    }
  });
}

function sendToBackend(files) {
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire('File too large', `${file.name} exceeds 10MB.`, 'error');
      continue;
    }

    fileMap.set(file.name, file); // store the file

    const formData = new FormData();
    formData.append('images', file);
    

    fetch('/upload/', {
      method: 'POST',
      headers: { 'X-CSRFToken': getCSRFToken() },
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        data.results.forEach(result => {
          if (result.sensitive) {
            // pass filename (to get file from Map)
            showSensitiveDialog(result.filename, result.matches);
          } else if (result.stored) {
            addFileToUI(result.filename, result.url);
            Swal.fire({
              toast: true,
              icon: 'success',
              title: `${result.filename} uploaded`,
              position: 'top-end',
              showConfirmButton: false,
              timer: 2000
            });
          }
        });
      });
  }
}

function getSavedImages() {
  fetch('/uploaded-images/')
    .then(res => res.json())
    .then(data => {
      fileList.innerHTML = '';
      data.images.forEach(file => addFileToUI(file.name, file.url));
    });
}

function getCSRFToken() {
  let name = 'csrftoken';
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(cookie.slice(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

document.addEventListener('DOMContentLoaded', () => {
  getSavedImages();
});


function blurAndReupload(file) {
  const formData = new FormData();
  formData.append('images', file);
  formData.append('blurred', 'true');

  fetch('/upload/', {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCSRFToken()
    },
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      data.results.forEach(file => {
        if (file.stored) {
          addFileToUI(file.filename, file.url);
          Swal.fire({
            toast: true,
            icon: 'success',
            title: `${file.filename} blurred & uploaded`,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
          });
        }
      });
    });
}


function uploadAnyway(file) {
  const formData = new FormData();
  formData.append('images', file);
  formData.append('force_upload', 'true');

  fetch('/upload/', {
    method: 'POST',
    headers: { 'X-CSRFToken': getCSRFToken() },
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      data.results.forEach(file => {
        if (file.stored) {
          addFileToUI(file.filename, file.url);
          Swal.fire({
            toast: true,
            icon: 'success',
            title: `${file.filename} uploaded (forced)`,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
          });
        }
      });
    });
}
