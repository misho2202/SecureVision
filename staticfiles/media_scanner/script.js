const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');

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
  handleFiles(files);
});

fileInput.addEventListener('change', () => {
  handleFiles(fileInput.files);
});

function handleFiles(files) {
  [...files].forEach(file => {
    if (file.size > 10 * 1024 * 1024) {
      alert("File exceeds 10MB limit");
      return;
    }

    const fileEl = document.createElement('div');
    fileEl.className = 'file-info';

    const name = document.createElement('div');
    name.className = 'file-details';

    // Check if image
    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = file.name;
      img.className = 'thumb';
      name.appendChild(img);
    }

    const text = document.createElement('div');
    text.innerHTML = `
      <div class="file-name">${file.name}</div>
      <div class="file-size">${formatFileSize(file.size)}</div>
    `;
    name.appendChild(text);

    const actions = document.createElement('div');
    actions.className = 'file-actions';

    const downloadBtn = document.createElement('button');
    downloadBtn.innerHTML = '⬇️';
    downloadBtn.title = 'Download file';
    downloadBtn.onclick = () => downloadFile(file);

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = 'Remove file from list';
    deleteBtn.onclick = () => fileEl.remove();

    actions.appendChild(downloadBtn);
    actions.appendChild(deleteBtn);

    fileEl.appendChild(name);
    fileEl.appendChild(actions);
    fileList.appendChild(fileEl);
  });
}

function formatFileSize(bytes) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

function clearFiles() {
  fileList.innerHTML = '';
  fileInput.value = '';
}

function downloadFile(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function showSensitiveDialog(file) {
  Swal.fire({
    title: 'Sensitive Content Detected',
    html: `<p><strong>${file.filename}</strong></p><pre>${file.text}</pre>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Blur & Upload',
    denyButtonText: 'Upload Anyway',
    showDenyButton: true,
    cancelButtonText: 'Cancel Upload',
  }).then(result => {
    if (result.isConfirmed) {
      alert('We will blur this image before upload (TODO)');
      // TODO: Send blur request
    } else if (result.isDenied) {
      alert('Uploading as is (TODO)');
      // TODO: Proceed with upload
    } else {
      alert('Canceled upload');
    }
  });
}
