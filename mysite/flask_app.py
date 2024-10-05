import os
from flask import Flask, render_template, request, Response
from PIL import Image
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

def adjust_receipt_image(image, output_size=(800, 1000)):
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

    cv2.drawContours(image, contours, -1, (255, 255, 0), 2)

    # Filter out non-rectangular contours
    rectangular_contours = []
    i = 0
    for contour in contours:
        epsilon = 0.02 * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)

        x, y, w, h = cv2.boundingRect(approx)
        aspect_ratio = float(w) / h

        if i == 0:
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
    if len(rectangular_contours) > 0:
        cv2.drawContours(image, rectangular_contours, -1, (0, 255, 0), 5)  # Green color for rectangular contours

    # Ensure that we have at least one rectangular contour
    if not rectangular_contours:
        image = cv2.putText(image, 'Cannot find rectangular contours', (50, 50), cv2.FONT_HERSHEY_SIMPLEX,
                            1, (255, 0, 0), 2, cv2.LINE_AA)
        return image

    rectangular_contours = sorted(rectangular_contours, key=cv2.contourArea, reverse=True)

    # Assuming the largest rectangular contour is the receipt
    receipt_contour = rectangular_contours[0]

    cv2.drawContours(image, [receipt_contour], -1, (0, 0, 255), 20)  # Green color for rectangular contours

    # Get the four points of the receipt
    # Get the bounding box of the contour (rectangular box around the contour)
    x, y, w, h = cv2.boundingRect(receipt_contour)

    # Define the four points of the bounding box
    points = np.array([
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h]
    ], dtype="float32")

    # Specify the points for the destination (a straightened rectangle)
    dst_points = np.array([
        [0, 0],
        [output_size[0] - 1, 0],
        [output_size[0] - 1, output_size[1] - 1],
        [0, output_size[1] - 1]
    ], dtype="float32")

    # Get the perspective transform matrix
    matrix = cv2.getPerspectiveTransform(points, dst_points)

    # Warp the image using the perspective transform
    warped = cv2.warpPerspective(image, matrix, output_size)

    return warped

@app.route('/process-receipt', methods=['POST'])
def process_receipt():
    # Get base64-encoded image data from form
    image_data = request.form['imageData']
    image_data = image_data.replace('data:image/png;base64,', '')

    # Decode base64 to binary
    image = Image.open(BytesIO(base64.b64decode(image_data)))

    # Convert PIL image to OpenCV format (NumPy array)
    image_cv = np.array(image)

    # Check if the image has an alpha channel (remove it if present)
    if image_cv.shape[-1] == 4:
        image_cv = cv2.cvtColor(image_cv, cv2.COLOR_RGBA2BGR)

    # Apply the adjustment (crop and warp the receipt)
    adjusted_image = adjust_receipt_image(image_cv)

    # Convert the processed OpenCV image back to PIL format
    processed_image = Image.fromarray(image_cv)

    # Save the image temporarily for display in show_photo.html
    image_path = 'static/receipt.png'
    processed_image.save(image_path)

    # Perform OCR on the processed image
    ocr_text = pytesseract.image_to_string(processed_image)

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

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(debug=True, port=5001)