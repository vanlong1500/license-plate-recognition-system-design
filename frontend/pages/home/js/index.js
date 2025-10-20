// Dữ liệu mẫu cho trang chủ
let vehicleData = [
  {
    id: 1,
    plateNumber: "30A-12345",
    driverName: "Nguyễn Văn A",
    rank: "Thiếu tá",
    position: "Trưởng phòng",
    time: "2024-10-20 08:30:00",
    status: "vao",
    note: "Công tác"
  },
  {
    id: 2,
    plateNumber: "29B-67890",
    driverName: "Trần Thị B",
    rank: "Đại úy",
    position: "Phó phòng",
    time: "2024-10-20 09:15:00",
    status: "vao",
    note: "Họp"
  },
  {
    id: 3,
    plateNumber: "51C-11111",
    driverName: "Lê Văn C",
    rank: "Trung úy",
    position: "Nhân viên",
    time: "2024-10-20 10:00:00",
    status: "vao",
    note: "Làm việc"
  },
  {
    id: 4,
    plateNumber: "30A-12345",
    driverName: "Nguyễn Văn A",
    rank: "Thiếu tá",
    position: "Trưởng phòng",
    time: "2024-10-20 17:30:00",
    status: "ra",
    note: "Về nhà"
  },
  {
    id: 5,
    plateNumber: "29B-67890",
    driverName: "Trần Thị B",
    rank: "Đại úy",
    position: "Phó phòng",
    time: "2024-10-20 18:00:00",
    status: "ra",
    note: "Kết thúc công việc"
  }
];

// Biến lưu trữ camera streams
let camera1Stream = null;
let camera2Stream = null;

// Khởi tạo trang
document.addEventListener('DOMContentLoaded', function () {
  initializeCameras();
  loadRecentVehicles();
  updateStatistics();

  // Cập nhật dữ liệu mỗi 30 giây
  setInterval(() => {
    loadRecentVehicles();
    updateStatistics();
  }, 30000);
});

// Khởi tạo camera
async function initializeCameras() {
  try {
    // Khởi tạo camera 1
    await startCamera(1);

    // Khởi tạo camera 2 (có thể sử dụng camera khác hoặc giả lập)
    await startCamera(2);

  } catch (error) {
    console.error('Lỗi khởi tạo camera:', error);
    showCameraError();
  }
}

// Bắt đầu camera
async function startCamera(cameraId) {
  try {
    const constraints = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'environment' // Sử dụng camera sau nếu có
      },
      audio: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const videoElement = document.getElementById(`camera${cameraId}`);

    if (videoElement) {
      videoElement.srcObject = stream;

      // Lưu stream để có thể dừng sau này
      if (cameraId === 1) {
        camera1Stream = stream;
      } else {
        camera2Stream = stream;
      }

      // Cập nhật trạng thái camera
      updateCameraStatus(cameraId, 'online');
    }

  } catch (error) {
    console.error(`Lỗi khởi tạo camera ${cameraId}:`, error);
    updateCameraStatus(cameraId, 'offline');

    // Hiển thị hình ảnh demo thay thế
    showDemoImage(cameraId);
  }
}

// Cập nhật trạng thái camera
function updateCameraStatus(cameraId, status) {
  const statusElement = document.querySelector(`#camera${cameraId}`).parentElement.querySelector('.camera-status');

  if (statusElement) {
    statusElement.className = `camera-status ${status}`;
    statusElement.innerHTML = status === 'online'
      ? '<i class="mdi mdi-circle"></i> Đang hoạt động'
      : '<i class="mdi mdi-circle"></i> Không kết nối';
  }
}

// Hiển thị hình ảnh demo khi không có camera
function showDemoImage(cameraId) {
  const videoElement = document.getElementById(`camera${cameraId}`);
  const container = videoElement.parentElement;

  // Tạo div thay thế với hình ảnh demo
  const demoDiv = document.createElement('div');
  demoDiv.className = 'camera-video d-flex align-items-center justify-content-center';
  demoDiv.style.background = 'linear-gradient(45deg, #333, #555)';
  demoDiv.style.color = 'white';
  demoDiv.innerHTML = `
    <div class="text-center">
      <i class="mdi mdi-camera-off" style="font-size: 48px; opacity: 0.5;"></i>
      <p class="mt-2 mb-0">Camera ${cameraId === 1 ? 'cổng vào' : 'cổng ra'}</p>
      <small>Không có thiết bị</small>
    </div>
  `;

  // Thay thế video element
  container.replaceChild(demoDiv, videoElement);
}

// Bật/tắt camera
function toggleCamera(cameraId) {
  const videoElement = document.getElementById(`camera${cameraId}`);

  if (videoElement && videoElement.srcObject) {
    const stream = videoElement.srcObject;
    const tracks = stream.getVideoTracks();

    tracks.forEach(track => {
      track.enabled = !track.enabled;
    });

    // Cập nhật trạng thái
    updateCameraStatus(cameraId, tracks[0].enabled ? 'online' : 'offline');
  }
}

// Chụp ảnh từ camera
function captureImage(cameraId) {
  const videoElement = document.getElementById(`camera${cameraId}`);

  if (videoElement && videoElement.srcObject) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    context.drawImage(videoElement, 0, 0);

    // Chuyển đổi thành blob và tải xuống
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `camera_${cameraId}_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.9);

    // Hiển thị thông báo
    showNotification(`Đã chụp ảnh từ camera ${cameraId}`, 'success');
  } else {
    showNotification('Camera không hoạt động', 'error');
  }
}

// Load danh sách xe gần đây
function loadRecentVehicles() {
  const tbody = document.getElementById('recentVehiclesTable');

  if (!tbody) return;

  // Sắp xếp theo thời gian mới nhất và lấy 10 bản ghi
  const recentData = vehicleData
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 10);

  tbody.innerHTML = '';

  recentData.forEach((item, index) => {
    const row = document.createElement('tr');
    const statusBadge = item.status === 'vao'
      ? '<span class="badge badge-success"><i class="mdi mdi-login"></i> Vào</span>'
      : '<span class="badge badge-danger"><i class="mdi mdi-logout"></i> Ra</span>';

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${formatDateTime(item.time)}</td>
      <td><strong>${item.plateNumber}</strong></td>
      <td>${item.driverName}</td>
      <td>${item.position}</td>
      <td>${item.rank}</td>
      <td>${statusBadge}</td>
      <td>${item.note}</td>
    `;

    tbody.appendChild(row);
  });
}

// Cập nhật thống kê
function updateStatistics() {
  const today = new Date().toISOString().split('T')[0];
  const todayData = vehicleData.filter(item => item.time.startsWith(today));

  const totalInToday = todayData.filter(item => item.status === 'vao').length;
  const totalOutToday = todayData.filter(item => item.status === 'ra').length;
  const totalVehiclesToday = todayData.length;

  // Tính xe đang trong bãi
  const uniquePlates = [...new Set(vehicleData.map(item => item.plateNumber))];
  let totalParking = 0;

  uniquePlates.forEach(plate => {
    const plateRecords = vehicleData.filter(item => item.plateNumber === plate)
      .sort((a, b) => new Date(b.time) - new Date(a.time));
    if (plateRecords.length > 0 && plateRecords[0].status === 'vao') {
      totalParking++;
    }
  });

  // Cập nhật UI
  updateCounter('totalVehiclesToday', totalVehiclesToday);
  updateCounter('totalInToday', totalInToday);
  updateCounter('totalOutToday', totalOutToday);
  updateCounter('totalParking', totalParking);
}

// Cập nhật số đếm với hiệu ứng
function updateCounter(elementId, newValue) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const currentValue = parseInt(element.textContent) || 0;

  if (currentValue !== newValue) {
    // Hiệu ứng đếm
    const increment = newValue > currentValue ? 1 : -1;
    const timer = setInterval(() => {
      const current = parseInt(element.textContent);
      if (current === newValue) {
        clearInterval(timer);
      } else {
        element.textContent = current + increment;
      }
    }, 50);
  }
}

// Làm mới dữ liệu
function refreshData() {
  showNotification('Đang làm mới dữ liệu...', 'info');

  // Giả lập việc tải dữ liệu mới
  setTimeout(() => {
    // Thêm một bản ghi mới (giả lập)
    const newRecord = {
      id: vehicleData.length + 1,
      plateNumber: `30A-${Math.floor(Math.random() * 90000) + 10000}`,
      driverName: "Người dùng mới",
      rank: "Trung úy",
      position: "Nhân viên",
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: Math.random() > 0.5 ? 'vao' : 'ra',
      note: "Tự động cập nhật"
    };

    vehicleData.unshift(newRecord);

    // Giới hạn dữ liệu không quá 50 bản ghi
    if (vehicleData.length > 50) {
      vehicleData = vehicleData.slice(0, 50);
    }

    loadRecentVehicles();
    updateStatistics();
    showNotification('Dữ liệu đã được cập nhật', 'success');
  }, 1000);
}

// Hiển thị thông báo
function showNotification(message, type = 'info') {
  // Tạo element thông báo
  const notification = document.createElement('div');
  notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.zIndex = '9999';
  notification.style.minWidth = '300px';

  notification.innerHTML = `
    ${message}
    <button type="button" class="close" data-dismiss="alert">
      <span>&times;</span>
    </button>
  `;

  document.body.appendChild(notification);

  // Tự động ẩn sau 3 giây
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// Format datetime
function formatDateTime(dateTimeString) {
  const date = new Date(dateTimeString);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Xử lý lỗi camera
function showCameraError() {
  console.log('Không thể truy cập camera. Sử dụng chế độ demo.');
}

// Cleanup khi trang được đóng
window.addEventListener('beforeunload', function () {
  if (camera1Stream) {
    camera1Stream.getTracks().forEach(track => track.stop());
  }
  if (camera2Stream) {
    camera2Stream.getTracks().forEach(track => track.stop());
  }
});