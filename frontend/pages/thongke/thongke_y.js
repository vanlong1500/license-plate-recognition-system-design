import { createStatusBadge } from "../home/js/index.js";

const inputElement = document.getElementById("name");
const searchInput = document.getElementById("searchInput");

const autocompleteList = document.getElementById("autocompleteList");
const employeeIdInput = document.getElementById("_id");
const selector = ".form-control, select.form-control, textarea.form-control";
let data_find_pls = null;

let employeeData = []; // Nơi lưu trữ dữ liệu nhân viên từ API
document.addEventListener("DOMContentLoaded", async () => {
  if (inputElement) {
    inputElement.addEventListener("focus", fetchEmployeeData);
    inputElement.addEventListener("input", handleInput);
  } else {
    console.error(
      "Lỗi: Không tìm thấy inputElement. Vui lòng kiểm tra ID 'employeeSearchInput'"
    );
  }
  const findButton = document.getElementById("find");
  if (findButton) {
    findButton.addEventListener("click", function () {
      collectFormData(selector);

      // Sau khi log, bạn có thể gửi đối tượng formData này đi
      // Ví dụ: sendDataToServer(formData);
    });
    document
      .getElementById("exportExcelBtn")
      .addEventListener("click", exportTableToCSV);
  } else {
    console.error("Lỗi: Không tìm thấy nút 'Tìm kiếm' (ID: findButton).");
  }
  searchInput.addEventListener("click", function () {
    if (data_find_pls) {
      const findPlateInput = document.querySelector(".find_plate");
      const plateNumString = findPlateInput ? findPlateInput.value.trim() : "";

      const searchNumber = Number(plateNumString);

      if (searchNumber === 0 || isNaN(searchNumber)) {
        return originalData;
      }
      const filteredResults = data_find_pls.filter((item) => {
        return item.plateNum === searchNumber;
      });

      const tableBody = document.getElementById("vehicleTableBody");
      tableBody.innerHTML = ""; // Xóa dữ liệu cũ
      filteredResults.forEach((item, index) => {
        const hasInfo =
          (item.no_data && item.no_data.trim() !== "") ||
          (item.note && item.note.trim() !== "");
        let formattedTime = "";
        if (item.time) {
          try {
            // 1. Thêm 'Z' vào cuối chuỗi để JavaScript nhận diện đây là thời gian UTC
            const timeAsUTC = item.time + "Z";

            formattedTime = new Date(timeAsUTC).toLocaleString("vi-VN", {
              timeZone: "Asia/Ho_Chi_Minh",
              hour12: false, // dùng 24h

              // 2. PHẢI CÓ: Các tùy chọn định dạng đầy đủ
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
          } catch (e) {
            // Nếu chuyển đổi thất bại, giữ nguyên giá trị gốc
            formattedTime = item.time;
          }
        }
        createStatusBadge(item, index, formattedTime, hasInfo, tableBody);
        const actionCells = document.querySelectorAll(".note_ed");
        actionCells.forEach((cell) => {
          cell.style.display = "none";
        });
      });
      console.log(`Tìm kiếm: ${searchNumber}. Kết quả:`, filteredResults);
    } else {
      const findPlateInput = document.querySelector(".find_plate");
      const plateNumString = findPlateInput ? findPlateInput.value.trim() : "";

      const data = { plateNum: plateNumString };
      find_plsNumber(data);
    }
  });
});
//tìm kiếm
const collectFormData = (selector) => {
  const formElements = document.querySelectorAll(selector);
  const formData = {};
  formElements.forEach((input) => {
    const inputName = input.getAttribute("name");
    const inputValue = input.value;

    if (inputName) {
      formData[inputName] = inputValue;

      console.log(`${inputName}: ${inputValue}`);
    } else {
      console.warn(
        `[Cảnh báo]: Thẻ input có ID ${input.id} thiếu thuộc tính 'name' và bị bỏ qua.`
      );
    }
  });
  const startDateValue = formData["Start_day"];
  const endDateValue = formData["End_day"];

  if (startDateValue && endDateValue) {
    const startDate = new Date(startDateValue);
    const endDate = new Date(endDateValue);

    // 1. Kiểm tra tính hợp lệ của ngày tháng (Định dạng)
    if (isNaN(startDate) || isNaN(endDate)) {
      alert("Lỗi: Định dạng Ngày bắt đầu hoặc Ngày kết thúc không hợp lệ.");
      return null;
    }
    if (startDate >= endDate) {
      // Hiển thị alert cho lỗi logic
      alert("Lỗi: Ngày bắt đầu phải nhỏ hơn Ngày kết thúc.");
      return null;
    }

    const startDateLocal = new Date(formData.Start_day + "T00:00:00");
    const endDateLocal = new Date(formData.End_day + "T00:00:00");

    formData["Start_day"] = startDateLocal.toISOString();
    formData["End_day"] = endDateLocal.toISOString();
  }
  if (!startDateValue || startDateValue.trim() === "") {
    alert("Vui lòng chọn 'Từ ngày' (Start Day)!");
    return; // DỪNG lại, KHÔNG gửi API
  }

  if (!endDateValue || endDateValue.trim() === "") {
    alert("Vui lòng chọn 'Đến ngày' (End Day)!");
    return; // DỪNG lại, KHÔNG gửi API
  }
  list_find_inf(formData);
  return formData;
};
async function find_plsNumber(plsMB) {
  console.log(plsMB);
  const res = await fetch(`http://127.0.0.1:5000/api/plsMB`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(plsMB),
  });
  const reponseData = await res.json();
  const tableBody = document.getElementById("vehicleTableBody");
  tableBody.innerHTML = ""; // Xóa dữ liệu cũ
  reponseData.forEach((item, index) => {
    const hasInfo =
      (item.no_data && item.no_data.trim() !== "") ||
      (item.note && item.note.trim() !== "");
    let formattedTime = "";
    if (item.time) {
      try {
        // 1. Thêm 'Z' vào cuối chuỗi để JavaScript nhận diện đây là thời gian UTC
        const timeAsUTC = item.time + "Z";

        formattedTime = new Date(timeAsUTC).toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          hour12: false, // dùng 24h

          // 2. PHẢI CÓ: Các tùy chọn định dạng đầy đủ
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      } catch (e) {
        // Nếu chuyển đổi thất bại, giữ nguyên giá trị gốc
        formattedTime = item.time;
      }
    }
    createStatusBadge(item, index, formattedTime, hasInfo, tableBody);
    const actionCells = document.querySelectorAll(".note_ed");
    actionCells.forEach((cell) => {
      cell.style.display = "none";
    });
  });
}
// api list information plates
async function list_find_inf(data) {
  const res = await fetch(`http://127.0.0.1:5000/api/listFindInf`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const reponseData = await res.json();
  data_find_pls = reponseData;

  const tableBody = document.getElementById("vehicleTableBody");
  tableBody.innerHTML = ""; // Xóa dữ liệu cũ
  reponseData.forEach((item, index) => {
    const hasInfo =
      (item.no_data && item.no_data.trim() !== "") ||
      (item.note && item.note.trim() !== "");
    let formattedTime = "";
    if (item.time) {
      try {
        // 1. Thêm 'Z' vào cuối chuỗi để JavaScript nhận diện đây là thời gian UTC
        const timeAsUTC = item.time + "Z";

        formattedTime = new Date(timeAsUTC).toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          hour12: false, // dùng 24h

          // 2. PHẢI CÓ: Các tùy chọn định dạng đầy đủ
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      } catch (e) {
        // Nếu chuyển đổi thất bại, giữ nguyên giá trị gốc
        formattedTime = item.time;
      }
    }
    createStatusBadge(item, index, formattedTime, hasInfo, tableBody);
    const actionCells = document.querySelectorAll(".note_ed");
    actionCells.forEach((cell) => {
      cell.style.display = "none";
    });
  });
}

// Hàm Debounce
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// B. Hàm Gọi API và Lưu Dữ liệu
async function fetchEmployeeData() {
  // 1. Kiểm tra nếu dữ liệu đã có thì không gọi lại API
  if (employeeData.length > 0) return;

  try {
    // Thay thế bằng endpoint API thực tế của bạn
    const response = await fetch("http://127.0.0.1:5000/api/employees/all");
    if (!response.ok) {
      throw new Error("Lỗi khi tải dữ liệu nhân viên.");
    }
    employeeData = await response.json();
  } catch (error) {
    console.log(error);
  }
}

// C. Hàm Lọc và Hiển thị Gợi ý
function renderSuggestions(searchTerm) {
  // Xóa gợi ý cũ
  autocompleteList.innerHTML = "";

  if (!searchTerm) return;

  // Lọc dữ liệu dựa trên ký tự nhập vào
  const filteredSuggestions = employeeData
    .filter((employee) =>
      // Chuyển về chữ thường để tìm kiếm không phân biệt hoa thường
      employee.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 5); // Giới hạn 10 gợi ý

  // Tạo và hiển thị các gợi ý
  filteredSuggestions.forEach((employee) => {
    const div = document.createElement("div");
    div.innerHTML = `<p style="cursor: pointer;">${employee.name}</p> `;

    // Gán sự kiện click để chọn gợi ý
    div.addEventListener("click", function () {
      inputElement.value = employee.name;
      if (employeeIdInput) {
        employeeIdInput.value = employee._id;
      }
      autocompleteList.innerHTML = ""; // Đóng gợi ý
    });

    autocompleteList.appendChild(div);
  });
}

// Hàm Chính xử lý đầu vào (đã áp dụng Debounce)
const handleInput = debounce((event) => {
  // Chỉ gọi hàm renderSuggestions vì dữ liệu đã được fetch
  renderSuggestions(event.target.value);
}, 200); // 200ms delay

// xuất exc
function exportTableToCSV() {
  // 1. Lấy bảng (Thay 'dataTable' bằng ID thực của bảng bạn nếu có)
  const table = document.querySelector("table");

  if (!table) {
    alert("Không tìm thấy bảng dữ liệu.");
    return;
  }

  let csv = [];

  // --- Lấy Tiêu đề Bảng (Header) ---
  const headers = [];
  table.querySelectorAll("thead th").forEach((th) => {
    const headerText = th.textContent.trim();
    // Bỏ qua tiêu đề cho cột STT, cột _id
    if (headerText !== "STT" && headerText !== "") {
      headers.push('"' + headerText + '"');
    }
  });
  csv.push(headers.join(","));
  // --- Lấy Dữ liệu (Rows) ---
  table.querySelectorAll("tbody tr").forEach((row) => {
    let rowData = [];
    const cells = row.querySelectorAll("td:not(.hide):not(.note_ed)");

    cells.forEach((cell, index) => {
      let csvCellValue = "";
      const inputsAndSelects = cell.querySelectorAll(
        "input[name], select[name]"
      );

      if (inputsAndSelects.length > 0) {
        let parts = [];
        inputsAndSelects.forEach((input) => {
          let value = "";

          if (input.tagName === "SELECT") {
            // Lấy giá trị hiển thị (Vào/Ra) cho <select>
            value = input.options[input.selectedIndex].text;
          } else {
            value = input.value;
          }

          parts.push(value);
        });

        // Nối các phần lại:
        csvCellValue = parts.join(" ");
      } else {
        csvCellValue = cell.textContent.trim();
      }
      csvCellValue = csvCellValue.replace(/"/g, '""'); // Escape dấu nháy kép
      csvCellValue = csvCellValue.replace(/(\r\n|\n|\r)/gm, " "); // Loại bỏ xuống dòng

      rowData.push('"' + csvCellValue + '"');
    });

    if (rowData.length > 0) {
      csv.push(rowData.join(","));
    }
  });

  // --- 3. Tạo và Tải xuống File CSV ---
  const csvString = csv.join("\n");

  // Tạo đối tượng Blob với định dạng CSV và encoding UTF-8
  const blob = new Blob(["\uFEFF" + csvString], {
    type: "text/csv;charset=utf-8;",
  });

  // Kích hoạt tải xuống
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download =
    "ThongKeDuLieu_" + new Date().toLocaleDateString("vi-VN") + ".csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
