import os
from flask import Flask, render_template, request
from PIL import Image
import pytesseract
from io import BytesIO
import base64

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload-receipt', methods=['POST'])
def upload_receipt():
    # Get base64-encoded image data from form
    image_data = request.form['imageData']
    image_data = image_data.replace('data:image/png;base64,', '')

    # Decode base64 to binary
    image = Image.open(BytesIO(base64.b64decode(image_data)))

    # Save the image temporarily for display in show_photo.html
    image_path = 'static/uploaded_image.png'
    image.save(image_path)

    ocr_text = pytesseract.image_to_string(image)

    # Render show_photo.html with OCR text and image
    return render_template('show_photo.html', filename='uploaded_image.png', ocr_text=ocr_text)

if __name__ == '__main__':
    app.run(debug=True)