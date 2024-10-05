import os
from flask import Flask, render_template, request
from PIL import Image
import pytesseract
from io import BytesIO
import base64
import cv2
import numpy as np

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/redirect_scan')
def redirect_scan():
    return render_template('index.html')

@app.route('/redirect_list')
def redirect_list():
    return render_template('home.html')

@app.route('/receipt_scan')
def receipt_scan():
    return render_template('receipt_scan.html')


def adjust_receipt_image(image, output_size=(800, 1000)):
    # Convert to grayscale (if not already)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Apply Gaussian blur (optional, helps with noise)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Apply thresholding to detect the white rectangle
    _, threshold = cv2.threshold(blurred, 200, 255, cv2.THRESH_BINARY)

    # Find contours
    contours, _ = cv2.findContours(threshold, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Sort contours by area (largest should be the receipt)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)

    # Ensure that we have at least one contour
    if not contours:
        raise ValueError("No contours found in the image.")

    # Assuming the largest contour is the receipt
    receipt_contour = contours[0]

    # Approximate the contour to get the four corners of the receipt
    epsilon = 0.02 * cv2.arcLength(receipt_contour, True)
    approx = cv2.approxPolyDP(receipt_contour, epsilon, True)

    # Ensure that the approximated contour has four points (rectangle)
    if len(approx) == 4:
        # Get the four points of the receipt
        points = approx.reshape(4, 2)

        # Specify the points for the destination (a straightened rectangle)
        dst_points = np.array([
            [0, 0],
            [output_size[0] - 1, 0],
            [output_size[0] - 1, output_size[1] - 1],
            [0, output_size[1] - 1]
        ], dtype="float32")

        # Get the perspective transform matrix
        matrix = cv2.getPerspectiveTransform(points.astype("float32"), dst_points)

        # Warp the image using the perspective transform
        warped = cv2.warpPerspective(image, matrix, output_size)

        return warped
    else:
        raise ValueError("Could not find four corners of the receipt.")


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
    processed_image = Image.fromarray(adjusted_image)

    # Save the image temporarily for display in show_photo.html
    image_path = 'static/receipt.png'
    processed_image.save(image_path)

    # Perform OCR on the processed image
    ocr_text = pytesseract.image_to_string(processed_image)

    # Render show_photo.html with OCR text and image
    return render_template('show_photo.html', filename='receipt.png', ocr_text=ocr_text)

if __name__ == '__main__':
    app.run(debug=True, port=5001)