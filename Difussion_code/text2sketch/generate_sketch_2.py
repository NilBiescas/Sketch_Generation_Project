from diffusers import DiffusionPipeline

pipeline = DiffusionPipeline.from_pretrained("CompVis/stable-diffusion-v1-4")
pipeline.load_lora_weights("MdEndan/stable-diffusion-lora-fine-tuned")
pipe = pipe.to("cuda")
prompt = "a nice car on the road"
images = pipe(prompt) 
image = images.images[0]
image.save("img_2.png")