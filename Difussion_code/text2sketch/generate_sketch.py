from diffusers import DiffusionPipeline

pipe = DiffusionPipeline.from_pretrained("runwayml/stable-diffusion-v1-5")
pipe.load_lora_weights("jordanhilado/sd-1-5-sketch-lora")
pipe = pipe.to("cuda")
prompt = "a horse in a field"
images = pipe(prompt) 
image = images.images[0]
image.save("img.png")