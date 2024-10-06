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

@app.route('/backend_tmp')
def backend_tmp():
    return render_template('backend_stuff/index.html')


import cv2
from openai import OpenAI
import json

def extract_text(image_path):
    # Open the image file and encode it as a base64 string
    def encode_image(image_path):
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")

    base64_image = encode_image(image_path)

    client = OpenAI(api_key='goodbye')

    response = client.chat.completions.create(
        model='gpt-4o',
        messages=[
            {"role": "system",
             "content": """
             You will receive an image of a receipt. First, extract the items listed on the receipt along with their corresponding prices. Then, provide an estimated shelf life for each item based on typical storage conditions.

# Steps

1. **Receipt Analysis**: 
   - Use OCR (Optical Character Recognition) to extract text from the receipt image.
   - Identify and list all items purchased, along with their respective prices.
   - If there is an item whose name is shorthand, unintelligable, or an acronym for a longer title, make the most accurate guess as to what the name of the item is

2. **Shelf Life Estimation**:
   - For each identified item, estimate the typical time it will remain fresh based on general storage guidelines.
   
3. **Color Identification**
   - For each identified item, estimate what color may be associated with that item commonly in hex.
   
4. **Receipt Date Detection**:
   - Identify the date and time that the transaction occured on the receipt image.
   - If there is no date or time present, include the date in the output as "N/A"

5. **Data Output**:
   - Present both the extracted item details, their estimated shelf life, and the transaction date in a structured format.

# Output Format

The output should be structured in JSON format as follows:
- "items": a list of objects, each containing:
  - "name": the name of the item.
  - "price": the price of the item.
  - "shelf_life": estimated shelf life in days.
  - "color": color that the item is commonly associated with (in hex format)
- "date": the date of the transaction.

```json
{
  "items": [
    {
      "name": "[Item Name]",
      "price": "[Price]",
      "shelf_life": "[Shelf Life in Days]".
      "color": "[Item Color]"
    },
    {
      "name": "[Item Name]",
      "price": "[Price]",
      "shelf_life": "[Shelf Life in Days]",
      "color": "[Item Color]"
    }
    // More items as needed
  ],
  "date": "[Transaction Date]"
}
```

# Examples

**Example Input:**
- Image of a grocery receipt.

**Example Output:**
```json
{
  "items": [
    {
      "name": "Bananas",
      "price": "$2.99",
      "shelf_life": "5",
      "color": "#FFFF00"
    },
    {
      "name": "Milk",
      "price": "$1.50",
      "shelf_life": "7"
      "color": "#FFFFFF"
    }
  ],
  "date": "10/3/24 at 4:50PM"
}
```

# Notes

- Consider variations in item names; use common names when possible.
- Pay attention to store-specific receipt formats; some receipts may list item codes instead of names. Attempt to map item codes to common names if possible.
- This system assumes typical room or refrigerated storage conditions when estimating shelf life. Adjust estimates if different storage conditions are provided.
- You may want to access the internet and search for any acronyms or shorthand names that come across as unclear.
- For instance, "RED GRAPE" should be "Bunch of Red Grapes", "RED BELL" should be "Red Bell Peppers", "CINN ROLLS" should be "Cinnamon Rolls" and anything similar.
- If an identified item has no easily identifiable color, choose the best fit color.
- Usually, the transaction date/time will be at the bottom of the receipt in the format "MM/DD/YY HH:MM:SS".
"""},
            {"role": "user", "content": [
                {"type": "text", "text": "Here is an image of a receipt."},
                {"type": "image_url", "image_url": {
                    "url": f"data:image/png;base64,{base64_image}"}
                 }
            ]}
        ],
        temperature=0.0,
    )

    response_text = response.choices[0].message.content.replace("```","").replace("json","")

    try:
        json_response = json.loads(response_text)  # Parse string as JSON
        return json_response  # Return the JSON response
    except json.JSONDecodeError:
        return {"error": "Failed to parse the response as JSON. Response: " + str(response_text)}

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

    # Initially render show_photo.html with a loading state
    return render_template('show_photo.html', filename='receipt.png')


@app.route('/get_ocr_data', methods=['POST'])
def get_ocr_data():
    image_path = 'static/receipt.png'

    # Perform OCR on the processed image
    ocr_text = extract_text(image_path)

    return ocr_text

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