## custom classes


## general classes
import os

## import all 
from typing import *
from argparse import ArgumentParser
from base64 import b64encode
from pathlib import Path
from PIL import Image, ImageOps

class Convert2BMP:
    def __init__(self, path:Path) -> None:
        self.HEAD =  """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                        <paper xmlns:inkml="http://www.w3.org/2003/InkML" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.w3.org/2003/InkML">
                        <resource>
                            <templateImage Content-Type="image/bmp">
                        """
        
        self.TAIL ="""
                    </templateImage>
                    </resource>
                    </paper>
                    """
        self.BMP_FOLDER = Path("Outputs/Wacom/Bmp")
        self.INKML_FOLDER = Path("Wacom_api/Api_exe/Test/10/Inkml") 
        self.RESULT_FOLDER = Path("Wacom_api/Api_exe/Result")
        self.SCETHC2IMG_FOLDER = Path("Outputs/Wacom/Png_final_results")
        self._path = path

    def _Convert2BMP(self) -> None:
        path_bmp = self._path.with_suffix('.bmp')
        target = self.BMP_FOLDER / path_bmp.name

        Image.open(self._path).save(target)
        bmp_img = Image.open(target)
        # Convert to RGB
        bmp_img = bmp_img.convert("RGB")
        resized_image = bmp_img.resize((1404, 1872))
        # Convert the image to monochrome bitmap
        monochrome_image = resized_image.convert("1")
        monochrome_image.save(target)

    def _BMP2PNG(self) -> None:
        self._path = self._path.with_suffix('.bmp')
        img_path = self.RESULT_FOLDER / self._path.name

        while os.path.exists(img_path) == False:
            pass
        target = self.SCETHC2IMG_FOLDER / self._path.with_suffix('.png').name
        Image.open(img_path).resize((512, 512)).save(target)
        print("PNG saved in: ", target)
        
    def _BMP2INKML(self, filename:str) -> None:
        self._Convert2BMP()
        path_bmp = self._path.with_suffix('.bmp')
        BMP_file = self.BMP_FOLDER / path_bmp.name
        try:
            with open(BMP_file, "rb") as f_in:
                data = f_in.read()
        except:
            print("File not found")
            exit()
        filename += ".inkml"
        base64 = b64encode(data)

        full = self.HEAD + base64.decode(encoding="utf8") + self.TAIL
        target = os.path.join(self.INKML_FOLDER, filename) 
        with open(target, "w") as f_out:
            f_out.write(full)

        print("succesfully generated in: ", target)
    
if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument("--source", type=Path, help="source image file")
    args = parser.parse_args()
    path = args.source
    filename = path.name.split(".")[0]

    obj = Convert2BMP(path)
    obj._BMP2INKML(filename)
    obj._BMP2PNG()
    
    
