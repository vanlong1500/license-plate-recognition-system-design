import { MongoClient } from "mongodb";

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

const names = [
  "Nguyen Van A",
  "Tran Thi B",
  "Le Van C",
  "Pham Thi D",
  "Hoang Van E",
  "Nguyen Thi F",
  "Tran Van G",
  "Le Thi H",
  "Pham Van I",
  "Hoang Thi J",
];
const ranks = ["Sơ cấp", "Trung cấp", "Cao cấp", "Chuyên gia"];
const positions = ["Nhân viên", "Quản lý", "Giám sát", "Giám đốc"];
const licensePlates = [
  "59A1 12345",
  "59B2 23456",
  "59C3 34567",
  "59D4 45678",
  "59E5 56789",
];
const avatars = [
  "/assets/images/users/1-old.jpg",
  "/assets/images/users/2.jpg",
  "/assets/images/users/3.jpg",
  "/assets/images/users/4.jpg",
  "/assets/images/users/5.jpg",
  "/assets/images/users/6.jpg",
  "/assets/images/users/7.jpg",
  "/assets/images/users/8.jpg",
];

async function generateData() {
  try {
    await client.connect();
    const db = client.db("employees");
    const staff = db.collection("staff");

    const data = [];
    for (let i = 0; i < 50; i++) {
      data.push({
        name: names[Math.floor(Math.random() * names.length)],
        avatar: avatars[Math.floor(Math.random() * avatars.length)],
        rank: ranks[Math.floor(Math.random() * ranks.length)],
        position: positions[Math.floor(Math.random() * positions.length)],
        licensePlate:
          licensePlates[Math.floor(Math.random() * licensePlates.length)],
      });
    }

    const result = await staff.insertMany(data);
    console.log(`✅ Đã chèn ${result.insertedCount} bản ghi mẫu`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

generateData();
