from diffusers import DiffusionPipeline, StableDiffusionXLControlNetPipeline, StableDiffusionXLImg2ImgPipeline, ControlNetModel, AutoencoderKL
from diffusers.utils import load_image
import numpy as np
import torch
import cv2
from PIL import Image
import gradio as gr
import os 

prompt = 'a horse in a field'

def text_2_sketch(prompt):

    pipe = DiffusionPipeline.from_pretrained("runwayml/stable-diffusion-v1-5", safety_checker = None, requires_safety_checker = False)
    pipe.load_lora_weights("jordanhilado/sd-1-5-sketch-lora")
    pipe = pipe.to("cuda")
    print(prompt)
    images = pipe(prompt) 
    image = images.images[0]
    return image

image = text_2_sketch(prompt)
image.save("tmp_x/img.png")