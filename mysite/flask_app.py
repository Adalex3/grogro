import os
from flask import Flask, render_template, request, Response
from PIL import Image
import easyocr
import pytesseract
from io import BytesIO
import base64
import cv2
import numpy as np

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/receipt_scan')
def receipt_scan():
    return render_template('receipt_scan.html')


import cv2
import numpy as np


# READING TEXT FROM IMAGE
def preprocess_image(image):
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Apply adaptive thresholding to deal with lighting issues
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY, 11, 2)

    # Optional: Rotate and deskew the image using Hough Line Transform
    coords = np.column_stack(np.where(thresh > 0))
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    (h, w) = image.shape[:2]
    M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
    rotated = cv2.warpAffine(thresh, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

    return rotated


def extract_text(image):
    # Preprocess the image
    preprocessed_image = preprocess_image(image)

    # Extract text using Tesseract OCR
    custom_config = r'--oem 3 --psm 6'  # OEM 3 is for best accuracy, PSM 6 assumes uniform block of text
    extracted_text = pytesseract.image_to_string(preprocessed_image, config=custom_config)

    return extracted_text

def adjust_receipt_image(image, debug=False):
    # Convert to HSV color space to filter out non-white regions
    hsv_image = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # Define a mask for white regions (low saturation, high value)
    lower_white = np.array([0, 0, 150])  # Adjust the range based on lighting conditions
    upper_white = np.array([180, 50, 255])

    # Apply the mask to extract white areas (likely the paper)
    mask = cv2.inRange(hsv_image, lower_white, upper_white)

    # Apply Gaussian blur to reduce noise (optional)
    mask = cv2.GaussianBlur(mask, (5, 5), 0)

    # Find contours in the masked image
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Sort contours by area (largest should be the receipt)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)

    if debug:
        cv2.drawContours(image, contours, -1, (255, 255, 0), 2)

    # Filter out non-rectangular contours
    rectangular_contours = []
    i = 0
    for contour in contours:
        epsilon = 0.02 * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)

        x, y, w, h = cv2.boundingRect(approx)
        aspect_ratio = float(w) / h

        if i == 0 and debug:
            image = cv2.putText(image, ("aspect ratio: " + str(aspect_ratio)), (50, 100), cv2.FONT_HERSHEY_SIMPLEX,
                                1, (0 if 0.6 < aspect_ratio < 1.4 else 255, 255, 0 if 0.6 < aspect_ratio < 1.4 else 255), 2, cv2.LINE_AA)
            image = cv2.putText(image, ("w: " + str(w)), (50, 150), cv2.FONT_HERSHEY_SIMPLEX,
                                1, (0 if w > image.shape[1]*0.3 else 255, 255, 0 if w > image.shape[1]*0.3 else 255), 2, cv2.LINE_AA)
            image = cv2.putText(image, ("img-width x 0.4: " + str(image.shape[1]*0.4)), (50, 200), cv2.FONT_HERSHEY_SIMPLEX,
                                1, (255, 255, 255), 2, cv2.LINE_AA)
        i += 1

        if 0.6 < aspect_ratio < 1.4 and w > image.shape[1]*0.3:  # Check for square-like or rectangular contours
            # Get the area of the contour
            area = cv2.contourArea(contour)

            # if area > w*h*0.5:
            rectangular_contours.append(approx)

    # Draw rectangular contours for debugging
    if len(rectangular_contours) > 0 and debug:
        cv2.drawContours(image, rectangular_contours, -1, (0, 255, 0), 5)  # Green color for rectangular contours

    # Ensure that we have at least one rectangular contour
    if not rectangular_contours:
        if debug:
            image = cv2.putText(image, 'Cannot find rectangular contours', (50, 50), cv2.FONT_HERSHEY_SIMPLEX,
                            1, (255, 0, 0), 2, cv2.LINE_AA)
        return image

    rectangular_contours = sorted(rectangular_contours, key=cv2.contourArea, reverse=True)

    # Assuming the largest rectangular contour is the receipt
    receipt_contour = rectangular_contours[0]

    if debug:
        cv2.drawContours(image, [receipt_contour], -1, (0, 0, 255), 20)  # Green color for rectangular contours

    # Get the four points of the receipt
    # Get the bounding box of the contour (rectangular box around the contour)
    x, y, w, h = cv2.boundingRect(receipt_contour)

    # Instead of perspective warp, we simply crop the image using the bounding box
    cropped = image[y:y + h, x:x + w]

    # Optionally, you can resize the cropped image to a fixed size if desired
    centered = cv2.resize(cropped, (w,h))  # Resize to a standard dimension (optional)

    return centered  # Return the cropped and optionally resized image

@app.route('/process-receipt', methods=['POST'])
def process_receipt():
    # Get base64-encoded image data from form
    image_data = request.form['imageData']
    image_data = image_data.replace('data:image/png;base64,', '')

    # Decode base64 to binary
    image = Image.open(BytesIO(base64.b64decode(image_data)))

    # Convert PIL image to OpenCV format (NumPy array)
    image_cv = np.array(image)

    # Apply the adjustment (crop and warp the receipt)
    adjusted_image = adjust_receipt_image(image_cv)

    # Convert the processed OpenCV image back to PIL format
    processed_image = Image.fromarray(adjusted_image)

    # Save the image temporarily for display in show_photo.html
    image_path = 'static/receipt.png'
    processed_image.save(image_path)

    # Perform OCR on the processed image
    ocr_text = extract_text(adjusted_image)

    # Render show_photo.html with OCR text and image
    return render_template('show_photo.html', filename='receipt.png', ocr_text=ocr_text)

def generate_frames():
    camera = cv2.VideoCapture(0)
    while True:
        success, frame = camera.read()
        if not success:
            break
        else:
            # Apply any OpenCV filters or processing here
            frame = adjust_receipt_image(frame)
            # Convert processed frame to JPEG
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            
def generate_frame():
    camera = cv2.VideoCapture(0)
    success, frame = camera.read()
    if not success:
        return
    else:
        # Apply any OpenCV filters or processing here
        frame = adjust_receipt_image(frame)
        # Convert processed frame to JPEG
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()

        yield (b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/video_feed_static')
def video_feed_static():
    return Response(generate_frame(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(debug=True, port=5001)