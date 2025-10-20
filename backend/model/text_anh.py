import cv2
import numpy as np
from ultralytics import YOLO
import easyocr
import re
from imutils.perspective import four_point_transform
import imutils
import time
import sys
import os

# ================== Model và OCR ==================
model = YOLO("best.pt")  # đường dẫn đến model của bạn
reader = easyocr.Reader(['en'], gpu=True)

# ================== Regex để chuẩn hoá biển số ==================
regex_line1 = re.compile(r'^[0-9]{2}[A-Z]{1}[0-9]{1}$')
regex_line2 = re.compile(r'^[0-9]{4,5}$')

def correct_plate_format(line1: str, line2: str) -> str:
    """Chuẩn hoá định dạng biển số"""
    line1 = line1.strip().upper().replace(" ", "")
    line2 = line2.strip().upper().replace(" ", "")
    if regex_line1.match(line1) and regex_line2.match(line2):
        return line1, line2

    mapping_number_to_alpha = {"0": "D", "1": "I", "2": "S", "3": "E",
                               "4": "A", "5": "S", "6": "G", "7": "T",
                               "8": "B", "9": "P"}
    mapping_alpha_to_number = {"I": "1", "K": "2", "E": "3", "A": "4",
                               "S": "5", "G": "6", "T": "7", "B": "8",
                               "P": "9", "L": "4", "D": "0", "C": "0", "F": "5"}

    if len(line1) != 4 or len(line2) not in [4, 5]:
        return ""

    corrected = []
    for i, ch in enumerate(line1):
        if i < 2:
            corrected.append(mapping_alpha_to_number.get(ch, ch))
        elif i == 2:
            corrected.append(mapping_number_to_alpha.get(ch, ch))
        else:
            corrected.append(ch)

    corrected2 = [mapping_alpha_to_number.get(ch, ch) for ch in line2]

    if not (regex_line1.match("".join(corrected)) and regex_line2.match("".join(corrected2))):
        return ""

    return "".join(corrected), "".join(corrected2)


def preprocess_plate(plate_crop):
    """Tiền xử lý ảnh biển số"""
    gray = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    cnts = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = imutils.grab_contours(cnts)
    if cnts:
        c = max(cnts, key=cv2.contourArea)
        rect = cv2.minAreaRect(c)
        box = cv2.boxPoints(rect)
        box = np.int0(box)
        warped = four_point_transform(plate_crop, box)
        gray = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return cv2.resize(thresh, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)


def recognize_plate(plate_crop):
    """OCR và chuẩn hóa biển số"""
    if plate_crop.size == 0:
        return ""
    plate_img = preprocess_plate(plate_crop)
    try:
        ocr_result = reader.readtext(
            plate_img,
            detail=0,
            allowlist="ABCDEFGHIKLMNPRSTUVXY0123456789"
        )
        print("OCR raw:", ocr_result)
        if len(ocr_result) >= 2:
            l1, l2 = ocr_result[0], ocr_result[1]
            plate_text = correct_plate_format(l1, l2)
            if plate_text:
                print("✅ Biển số hợp lệ:", plate_text)
                return plate_text
    except Exception as e:
        print("❌ OCR lỗi:", e)
    return ""


def draw_plate(frame, x1, y1, x2, y2, text):
    """Vẽ khung và text biển số"""
    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 3)
    if text:
        cv2.putText(frame, text, (x1, max(0, y1 - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 6)
        cv2.putText(frame, text, (x1, max(0, y1 - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 3)


def detect_license_plate(image_path, conf_thresh=0.3):
    """Nhận diện biển số trong ảnh"""
    frame = cv2.imread(image_path)
    if frame is None:
        print(f"⚠️ Không đọc được ảnh: {image_path}")
        return

    start = time.time()
    results = model(frame, verbose=False)
    detected = []

    for r in results:
        for box in r.boxes:
            conf = float(box.conf.cpu().numpy().item())
            if conf < conf_thresh:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy.cpu().numpy()[0])
            plate_crop = frame[y1:y2, x1:x2]
            text = recognize_plate(plate_crop)
            if text:
                detected.append(text)
            draw_plate(frame, x1, y1, x2, y2, text)

    print(f"⏱️ Thời gian xử lý: {time.time() - start:.2f}s")
    if detected:
        print("✅ Biển số nhận dạng được:", detected)
    else:
        print("❌ Không phát hiện biển số nào.")

    cv2.imshow("Kết quả nhận dạng", frame)
    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("⚠️ Cách dùng: python detect_image.py <đường_dẫn_ảnh>")
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(f"❌ Không tìm thấy ảnh: {image_path}")
        sys.exit(1)

    detect_license_plate(image_path)
