import base64
from flask import Flask, request, render_template, url_for
import os

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/upload-receipt', methods=['POST'])
def upload_receipt():
    try:
        image_data = request.form.get('imageData')

        if not image_data:
            return "No image data received", 400

        # Decode the base64 image data
        image_data = image_data.split(',')[1]
        image_data = base64.b64decode(image_data)

        # Define the upload folder and ensure it exists (use 'static' for easier access)
        upload_folder = os.path.join(app.root_path, 'static/uploads')
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)

        # Save the image to the 'static/uploads' folder
        filename = 'receipt.png'  # You could generate dynamic names for each file
        filepath = os.path.join(upload_folder, filename)
        with open(filepath, 'wb') as f:
            f.write(image_data)

        # Render the template to display the uploaded image
        return render_template('show_photo.html', filename=f'uploads/{filename}')

    except Exception as e:
        print(f"Error: {str(e)}")
        return f"An error occurred: {str(e)}", 500

if __name__ == '__main__':
    app.run(debug=True)