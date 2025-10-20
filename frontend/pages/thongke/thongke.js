// Dữ liệu mẫu - trong thực tế sẽ lấy từ API
let vehicleData = [
  {
    id: 1,
    plateNumber: "30A-12345",
    driverName: "Nguyễn Văn A",
    rank: "Thiếu tá",
    position: "Trưởng phòng",
    time: "2024-01-15 08:30:00",
    status: "vao",
    note: "Công tác"
  },
  {
    id: 2,
    plateNumber: "29B-67890",
    driverName: "Trần Thị B",
    rank: "Đại úy",
    position: "Phó phòng",
    time: "2024-01-15 09:15:00",
    status: "vao",
    note: "Họp"
  },
  {
    id: 3,
    plateNumber: "30A-12345",
    driverName: "Nguyễn Văn A",
    rank: "Thiếu tá",
    position: "Trưởng phòng",
    time: "2024-01-15 17:30:00",
    status: "ra",
    note: "Về nhà"
  },
  {
    id: 4,
    plateNumber: "51C-11111",
    driverName: "Lê Văn C",
    rank: "Trung úy",
    position: "Nhân viên",
    time: "2024-01-15 10:00:00",
    status: "vao",
    note: "Làm việc"
  },
  {
    id: 5,
    plateNumber: "29B-67890",
    driverName: "Trần Thị B",
    rank: "Đại úy",
    position: "Phó phòng",
    time: "2024-01-15 18:00:00",
    status: "ra",
    note: "Kết thúc công việc"
  }
];

let currentPage = 1;
let recordsPerPage = 10;
let filteredData = [...vehicleData];

// Khởi tạo trang
document.addEventListener('DOMContentLoaded', function () {
  // Set ngày mặc định
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('fromDate').value = today;
  document.getElementById('toDate').value = today;

  loadData();
  updateStatistics();
});

// Load dữ liệu vào bảng
function loadData() {
  const tbody = document.getElementById('vehicleTableBody');
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const pageData = filteredData.slice(startIndex, endIndex);

  tbody.innerHTML = '';

  pageData.forEach((item, index) => {
    const row = document.createElement('tr');
    const statusBadge = item.status === 'vao' ?
      '<span class="badge badge-success">Vào</span>' :
      '<span class="badge badge-danger">Ra</span>';

    row.innerHTML = `
      <td>${startIndex + index + 1}</td>
      <td><strong>${item.plateNumber}</strong></td>
      <td>${item.driverName}</td>
      <td>${item.rank}</td>
      <td>${item.position}</td>
      <td>${formatDateTime(item.time)}</td>
      <td>${statusBadge}</td>
      <td>${item.note}</td>
    `;
    tbody.appendChild(row);
  });

  updatePagination();
}

// Cập nhật thống kê
function updateStatistics() {
  const today = new Date().toISOString().split('T')[0];
  const todayData = vehicleData.filter(item => item.time.startsWith(today));

  const totalIn = todayData.filter(item => item.status === 'vao').length;
  const totalOut = todayData.filter(item => item.status === 'ra').length;
  const totalAll = vehicleData.length;

  // Tính xe đang trong bãi (xe vào - xe ra)
  const uniquePlates = [...new Set(vehicleData.map(item => item.plateNumber))];
  let totalParking = 0;

  uniquePlates.forEach(plate => {
    const plateRecords = vehicleData.filter(item => item.plateNumber === plate)
      .sort((a, b) => new Date(b.time) - new Date(a.time));
    if (plateRecords.length > 0 && plateRecords[0].status === 'vao') {
      totalParking++;
    }
  });

  document.getElementById('totalIn').textContent = totalIn;
  document.getElementById('totalOut').textContent = totalOut;
  document.getElementById('totalAll').textContent = totalAll;
  document.getElementById('totalParking').textContent = totalParking;
}

// Lọc dữ liệu
function filterData() {
  const fromDate = document.getElementById('fromDate').value;
  const toDate = document.getElementById('toDate').value;
  const status = document.getElementById('statusFilter').value;

  filteredData = vehicleData.filter(item => {
    const itemDate = item.time.split(' ')[0];
    const dateMatch = (!fromDate || itemDate >= fromDate) && (!toDate || itemDate <= toDate);
    const statusMatch = !status || item.status === status;

    return dateMatch && statusMatch;
  });

  currentPage = 1;
  loadData();
}

// Tìm kiếm trong bảng
function searchTable() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();

  filteredData = vehicleData.filter(item =>
    item.plateNumber.toLowerCase().includes(searchTerm) ||
    item.driverName.toLowerCase().includes(searchTerm) ||
    item.rank.toLowerCase().includes(searchTerm) ||
    item.position.toLowerCase().includes(searchTerm)
  );

  currentPage = 1;
  loadData();
}

// Xuất dữ liệu Excel
function exportData() {
  // Tạo CSV content
  let csvContent = "STT,Biển số xe,Tên lái xe,Cấp bậc,Chức vụ,Thời gian,Trạng thái,Ghi chú\n";

  filteredData.forEach((item, index) => {
    const status = item.status === 'vao' ? 'Vào' : 'Ra';
    csvContent += `${index + 1},"${item.plateNumber}","${item.driverName}","${item.rank}","${item.position}","${formatDateTime(item.time)}","${status}","${item.note}"\n`;
  });

  // Tạo và download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `thongke_xe_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Cập nhật phân trang
function updatePagination() {
  const totalPages = Math.ceil(filteredData.length / recordsPerPage);
  const pagination = document.getElementById('pagination');

  // Cập nhật thông tin hiển thị
  const startRecord = (currentPage - 1) * recordsPerPage + 1;
  const endRecord = Math.min(currentPage * recordsPerPage, filteredData.length);

  document.getElementById('showingFrom').textContent = startRecord;
  document.getElementById('showingTo').textContent = endRecord;
  document.getElementById('totalRecords').textContent = filteredData.length;

  // Tạo pagination
  pagination.innerHTML = '';

  // Previous button
  const prevLi = document.createElement('li');
  prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
  prevLi.innerHTML = '<a class="page-link" href="#" onclick="changePage(' + (currentPage - 1) + ')">Trước</a>';
  pagination.appendChild(prevLi);

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement('li');
    li.className = `page-item ${i === currentPage ? 'active' : ''}`;
    li.innerHTML = '<a class="page-link" href="#" onclick="changePage(' + i + ')">' + i + '</a>';
    pagination.appendChild(li);
  }

  // Next button
  const nextLi = document.createElement('li');
  nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
  nextLi.innerHTML = '<a class="page-link" href="#" onclick="changePage(' + (currentPage + 1) + ')">Sau</a>';
  pagination.appendChild(nextLi);
}

// Chuyển trang
function changePage(page) {
  const totalPages = Math.ceil(filteredData.length / recordsPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    loadData();
  }
}

// Format datetime
function formatDateTime(dateTimeString) {
  const date = new Date(dateTimeString);
  return date.toLocaleString('vi-VN');
}