# import cv2
# import numpy as np
#
# img = np.zeros((300, 300, 3), dtype=np.uint8)
# cv2.putText(img, "It works!", (50, 150), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
# cv2.imshow("Test Window", img)
# cv2.waitKey(0)
# cv2.destroyAllWindows()


# from ultralytics import YOLO
#
# model = YOLO("yolov8n.pt")  # Automatically downloads if not present
# results = model(r"C:\Users\miavetisyan\Desktop\images\photo_7_2025-07-14_14-01-30.jpg")
# results.show()