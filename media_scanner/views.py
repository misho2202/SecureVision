from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import cv2
from django.http import StreamingHttpResponse
from django.views.decorators import gzip

import os
import re

from ai_processor.yolo_processor import process_image_file, generate_webcam_stream
from .models import UploadedImage

# Global camera instance
camera = None

# @csrf_exempt
# def upload_and_process(request):
#     """Handle uploaded images & process with YOLO before saving."""
#     if request.method == "POST":
#         files = request.FILES.getlist("images")
#         results = []
#
#         for f in files:
#             # Save temporarily
#             filename = default_storage.save(f.name, ContentFile(f.read()))
#             file_path = default_storage.path(filename)
#
#             # Process image & save processed output
#             output_filename = f"processed_{os.path.basename(filename)}"
#             output_path = default_storage.path(output_filename)
#
#             try:
#                 process_image_file(file_path, output_path)
#                 results.append({
#                     "filename": f.name,
#                     "stored": True,
#                     "url": default_storage.url(output_filename),
#                 })
#             except Exception as e:
#                 results.append({"filename": f.name, "stored": False, "error": str(e)})
#
#         return JsonResponse({"results": results})
#
#     return JsonResponse({"error": "Only POST allowed"}, status=405)
#
#
# def livestream_feed(request):
#     """Stream processed webcam frames with YOLO in real-time."""
#     return StreamingHttpResponse(
#         generate_webcam_stream(),
#         content_type="multipart/x-mixed-replace; boundary=frame"
#     )


@gzip.gzip_page
@csrf_exempt
def livestream_view(request):
    global camera

    if camera is None or not camera.isOpened():
        camera = cv2.VideoCapture(0)  # open the webcam

    def generate_frames():
        while True:
            if camera is None or not camera.isOpened():
                break

            success, frame = camera.read()
            if not success:
                break

            _, jpeg = cv2.imencode('.jpg', frame)
            frame_bytes = jpeg.tobytes()

            yield (
                b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n\r\n'
            )

    return StreamingHttpResponse(
        generate_frames(),
        content_type='multipart/x-mixed-replace; boundary=frame'
    )


@csrf_exempt
def disconnect_livestream(request):
    """API to stop the webcam"""
    global camera

    if camera and camera.isOpened():
        camera.release()
        camera = None
        return JsonResponse({"status": "disconnected"})
    else:
        return JsonResponse({"status": "already_closed"})


def index(request):
    return render(request, 'index.html')


@csrf_exempt
def upload(request):
    if request.method == 'POST':

        uploaded_files = request.FILES.getlist('images')
        results = []

        for f in uploaded_files:
            # Save to "uploaded/" inside MEDIA_ROOT
            filename = default_storage.save(f'uploaded/{f.name}', f)

            # Create DB record
            img_record = UploadedImage.objects.create(image=filename)

            # Return useful info to frontend
            results.append({
                'filename': f.name,
                'stored': True,
                'url': img_record.image.url,
            })

        return JsonResponse({'results': results})

    return JsonResponse({'error': 'Only POST allowed'}, status=400)


# def upload(request):
#     if request.method == 'POST':
#         uploaded_files = request.FILES.getlist('images')
#         results = []
#
#         for f in uploaded_files:
#             blurred = request.POST.get('blurred') == 'true'
#             force_upload = request.POST.get('force_upload') == 'true'
#
#             filename = default_storage.save(f'uploaded/{f.name}', f)
#             path = os.path.join('media', filename)
#
#             try:
#                 # Load with OpenCV
#                 img_cv = cv2.imread(path)
#                 gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
#                 _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
#                 contrast_img = cv2.convertScaleAbs(thresh, alpha=2.5, beta=0)
#
#                 pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
#                 ocr_data = pytesseract.image_to_data(contrast_img, output_type=pytesseract.Output.DICT)
#
#                 all_text = " ".join(ocr_data['text'])
#                 sensitive_matches = detect_sensitive(all_text)
#
#                 if blurred:
#                     # Build a flat list of sensitive values to blur
#                     values_to_blur = [value.lower().strip() for _, value in sensitive_matches]
#
#                     for i, word in enumerate(ocr_data['text']):
#                         word_clean = word.lower().strip().replace("’", "'").replace("“", '"')
#                         if word_clean in values_to_blur:
#                             x, y, w, h = (
#                                 ocr_data['left'][i],
#                                 ocr_data['top'][i],
#                                 ocr_data['width'][i],
#                                 ocr_data['height'][i]
#                             )
#                             roi = img_cv[y:y+h, x:x+w]
#                             if roi.size > 0:
#                                 blurred_roi = cv2.GaussianBlur(roi, (51, 51), 0)
#                                 img_cv[y:y+h, x:x+w] = blurred_roi
#
#                     cv2.imwrite(path, img_cv)
#
#                 if not sensitive_matches or blurred or force_upload:
#                     img_record = UploadedImage.objects.create(image=filename)
#                     results.append({
#                         'filename': f.name,
#                         'stored': True,
#                         'sensitive': bool(sensitive_matches),
#                         'url': img_record.image.url
#                     })
#                 else:
#                     results.append({
#                         'filename': f.name,
#                         'stored': False,
#                         'sensitive': True,
#                         'matches': sensitive_matches,
#                     })
#
#             finally:
#                 if not (not sensitive_matches or blurred or force_upload) and os.path.exists(path):
#                     os.remove(path)
#
#         return JsonResponse({'results': results})
#
#     return JsonResponse({'error': 'Only POST allowed'}, status=400)
#



def detect_sensitive(text):
    patterns = {
        # Armenian passport: AH0123456
        "passport": r"\b[A-Z]{2}\d{7}\b",
        # Armenian ID card and SSN (both 10 digits)
        "id_card": r"\b\d{10}\b",
        # Armenian driver's license: FG123456
        "driver_license": r"\b[A-Z]{2}\d{6}\b",
        # Armenian phone numbers
        "phone_number": r"\b(?:\+374|0)(?:10|11|33|41|44|55|60|77|91|93|94|95|97|98|99)\d{6}\b",
        # Credit card numbers (Visa, MasterCard, MIR, etc.)
        "credit_card": r"\b(?:4\d{12}(?:\d{3})?|5[1-5]\d{14}|2(2[2-9]\d{2}|[3-6]\d{3}|7[01]\d{2}|720)\d{12})\b",
        # Armenian license plates
        # Matches both:
        # - 78 AV 989
        # - 989 AB 77
        "license_plate": r"\b(\d{2} [A-Z]{2} \d{3}|\d{3} [A-Z]{2} \d{2})\b",
        # Street names
        "street": r"\b[A-Z][a-z]+ (Street|St|Avenue|Ave|Blvd|Road|Rd|Lane|Ln)\b",
        # Email
        "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
        # Keywords
        "keyword": r"\b(confidential|private|secret|restricted)\b",
        # Username detection: flexible keys and formats
        "username": r"(?i)\b(username|user\s*name|login|email)\b\s*(?:[:=]|is|->|=>)?\s*['\"]?([^\s'\"]{3,})['\"]?",
        # Password detection: very flexible key and format
        "password": r"(?i)\b(password|pass|pwd)\b\s*(?:[:=]|is|->|=>)?\s*['\"]?([^\s'\"]{3,})['\"]?",
    }

    found = []

    for label, pattern in patterns.items():
        matches = re.findall(pattern, text, flags=re.IGNORECASE)

        if matches:
            if isinstance(matches[0], tuple):
                # If there are groups, return the last one (the actual value)
                for match in matches:
                    found.append((label, match[-1]))
            else:
                for match in matches:
                    found.append((label, match))

    return found


def uploaded_images(request):
    images = UploadedImage.objects.all().order_by('-id')
    data = [
        {
            'name': img.image.name.split('/')[-1],
            'url': img.image.url
        }
        for img in images
    ]
    return JsonResponse({'images': data})



from django.views.decorators.csrf import csrf_exempt  # Optional if CSRF issues

@csrf_exempt  # You can remove this if CSRF token is working properly
def delete_image(request):
    if request.method == 'POST':
        filename = request.POST.get('filename')
        print("Deleting file:", filename)

        try:
            img = UploadedImage.objects.get(image__endswith=f'/{filename}')
            img_path = img.image.path
            img.delete()
            if os.path.exists(img_path):
                os.remove(img_path)
            return JsonResponse({'success': True})
        except UploadedImage.DoesNotExist:
            return JsonResponse({'error': 'File not found'}, status=404)

    return JsonResponse({'error': 'Only POST allowed'}, status=400)



def delete_all_images(request):
    if request.method == 'POST':
        images = UploadedImage.objects.all()
        for img in images:
            img_path = img.image.path
            if os.path.exists(img_path):
                os.remove(img_path)
            img.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'error': 'Only POST allowed'}, status=400)


# if __name__ == "__main__":
#     sensitive = detect_sensitive(sample_text)
#     for label, value in sensitive:
#         print(f"{label}: {value}")