# !pip install opencv-python transformers accelerate

from diffusers import StableDiffusionXLControlNetPipeline, StableDiffusionXLImg2ImgPipeline, ControlNetModel, AutoencoderKL

from diffusers.utils import load_image

import numpy as np

import torch

import cv2

from PIL import Image

prompt = "a horse in a field, realistic picture, best quality, 4k, 8k, ultra highres, raw photo in hdr, sharp focus"

negative_prompt = "worst quality, low quality, normal quality, child, painting, drawing, sketch, cartoon, anime, render, blurry"

# download an image

image = cv2.imread("/home/GROUP04/text2sketch/img.png")

# initialize the models and pipeline

controlnet_conditioning_scale = 0.5  # recommended for good generalization

controlnet = ControlNetModel.from_pretrained(

    "diffusers/controlnet-canny-sdxl-1.0", torch_dtype=torch.float16

)

vae = AutoencoderKL.from_pretrained("madebyollin/sdxl-vae-fp16-fix", torch_dtype=torch.float16)

pipe = StableDiffusionXLControlNetPipeline.from_pretrained(

    "stabilityai/stable-diffusion-xl-base-1.0", controlnet=controlnet, vae=vae, torch_dtype=torch.float16

)

pipe.enable_model_cpu_offload()

image = np.array(image)

image = cv2.Canny(image, 100, 200)

image = image[:, :, None]

image = np.concatenate([image, image, image], axis=2)

canny_image = Image.fromarray(image)

canny_image.save("sketch2canny.png")

# generate image

image = pipe(

    prompt, controlnet_conditioning_scale=controlnet_conditioning_scale, image=canny_image

).images[0]

image.save("sketch2img.png")

pipe_refiner = StableDiffusionXLImg2ImgPipeline.from_pretrained(
        "stabilityai/stable-diffusion-xl-refiner-1.0", torch_dtype=torch.float16, variant="fp16", use_safetensors=True
    )

pipe_refiner.to("cuda")

image = pipe_refiner(prompt, image=image, negative_prompt=negative_prompt, strength=0.2).images[0]

image.save("sketch2img_refined.png")