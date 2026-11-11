// Chuẩn bị tệp trước khi gửi lên backend (POST multipart).
// Backend chỉ nhận .jpg / .jpeg / .png / .pdf, tối đa 10 MB; ảnh chụp từ điện thoại hay là WEBP / HEIC
// hoặc nặng hơn thế, nên ảnh được đổi sang JPEG và thu nhỏ ngay trên trình duyệt.

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// Ảnh JPG/PNG nhẹ hơn mức này thì gửi nguyên bản
const KEEP_ORIGINAL_BYTES = 3 * 1024 * 1024;
// Cạnh dài nhất của ảnh sau khi thu nhỏ: vẫn đủ rõ để đọc biên bản / xem hiện trường
const MAX_DIMENSION = 2560;
const JPEG_QUALITY = 0.85;

const extensionOf = (name = '') => (name.includes('.') ? name.split('.').pop().toLowerCase() : '');

const isPdf = (file) => file.type === 'application/pdf' || extensionOf(file.name) === 'pdf';
const isJpegOrPng = (file) =>
  ['image/jpeg', 'image/png'].includes(file.type) || ['jpg', 'jpeg', 'png'].includes(extensionOf(file.name));
const isImage = (file) => file.type.startsWith('image/') || ['heic', 'heif', 'webp', 'gif', 'bmp'].includes(extensionOf(file.name));

// Định dạng thật đọc từ vài byte đầu: ảnh lưu từ web hay là WEBP nhưng đặt đuôi .jpg, backend kiểm tra nội dung nên từ chối
async function sniffType(file) {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'pdf';
  return 'other';
}

const uploadError = (userMessage) => Object.assign(new Error(userMessage), { userMessage });

/** Giải mã ảnh bằng trình duyệt; định dạng trình duyệt không đọc được (HEIC trên Chrome / Android) thì lỗi */
const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('decode'));
    };
    img.src = url;
  });

async function toJpeg(file) {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  // PNG trong suốt: nền trắng thay vì đen khi sang JPEG
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
  if (!blob) throw new Error('encode');
  const baseName = (file.name || 'photo').replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}

/**
 * Trả về tệp backend nhận được: PDF / JPG / PNG nhẹ giữ nguyên; ảnh khác (WEBP, HEIC, ảnh lớn) đổi sang JPEG đã thu nhỏ.
 * Lỗi ném ra có `userMessage` tiếng Việt để hiện thẳng cho người dùng.
 * @param {File} file
 * @returns {Promise<File>}
 */
export async function prepareUploadFile(file) {
  if (!file) return file;

  const actual = await sniffType(file);

  if (isPdf(file)) {
    if (actual !== 'pdf') throw uploadError('Tệp PDF bị hỏng hoặc không phải PDF thật.');
    if (file.size > MAX_UPLOAD_BYTES) throw uploadError('Tệp PDF quá lớn (tối đa 10 MB).');
    return file;
  }

  if (!isImage(file)) {
    throw uploadError('Chỉ nhận ảnh (JPG, PNG) hoặc tệp PDF.');
  }

  // Đuôi .jpg/.png phải khớp nội dung thật thì mới gửi nguyên bản
  const genuine = (actual === 'jpeg' || actual === 'png') && isJpegOrPng(file)
    && (actual === 'png') === (extensionOf(file.name) === 'png');
  if (genuine && file.size <= KEEP_ORIGINAL_BYTES) return file;

  try {
    const converted = await toJpeg(file);
    if (converted.size > MAX_UPLOAD_BYTES) throw uploadError('Ảnh quá lớn (tối đa 10 MB).');
    return converted;
  } catch (err) {
    if (err.userMessage) throw err;
    // Ảnh JPG/PNG gốc vẫn gửi được nếu không quá 10 MB
    if (genuine && file.size <= MAX_UPLOAD_BYTES) return file;
    throw uploadError('Không đọc được ảnh này (ví dụ ảnh HEIC). Hãy chọn ảnh JPG / PNG hoặc chụp lại ở chế độ "Tương thích nhất".');
  }
}
