document.addEventListener("DOMContentLoaded", () => {
  fetch("./html/camera.html")
    .then((response) => {
      if (!response.ok) throw new Error("Không thể tải camera.html");
      return response.text();
    })
    .then((html) => {
      document.getElementById("show_camera").innerHTML = html;
    })
    .catch((error) => {
      console.error("Lỗi khi load file:", error);
    });
});
document.addEventListener("DOMContentLoaded", () => {
  fetch("./html/table.html")
    .then((response) => {
      if (!response.ok) throw new Error("Không thể tải table.html");
      return response.text();
    })
    .then((html) => {
      document.getElementById("table").innerHTML = html;
    })
    .catch((error) => {
      console.error("Lỗi khi load file:", error);
    });
});
