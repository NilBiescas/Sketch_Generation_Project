import cv2
import numpy as np
from PIL import Image

image = cv2.imread("/home/GROUP04/text2sketch/img.png")
image = np.array(image)
image = cv2.Canny(image, 100, 200)
image = image[:, :, None]
image = np.concatenate([image, image, image], axis=2)
canny_image = Image.fromarray(image)
canny_image.save("sketch2canny.png")