export interface CropperShape {
    id: string;
    coordinates: number[][];
}

export interface CropperCrop {
    id: string;
    crop: HTMLImageElement;
}

export class Cropper {
    private readonly sourceImage: HTMLImageElement;
    private readonly shapes: CropperShape[];

    public constructor(sourceImage: HTMLImageElement, shapes: CropperShape[]) {
        this.sourceImage = sourceImage;
        this.shapes = shapes;
    }

    public async getCrops(): Promise<CropperCrop[]> {
        const output = [];
        for (const shape of this.shapes) {
            const crop = await this.getCrop(shape);
            output.push(crop);
        }
        return output;
    }


    private async getCrop(shape: CropperShape): Promise<CropperCrop> {
        const cropData = this.getCropData(shape.coordinates);

        const canvas = document.createElement("canvas");
        canvas.width = cropData.sWidth;
        canvas.height = cropData.sHeight;

        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(this.sourceImage, cropData.sx, cropData.sy, cropData.sWidth, cropData.sHeight, 0, 0, cropData.sWidth, cropData.sHeight);

        const crop = await new Promise<HTMLImageElement>((resolve) => {
            const image = document.createElement("img");
            document.body.appendChild(image);
            image.onload = () => {
                resolve(image);
            };
            image.src = canvas.toDataURL();
        });

        canvas.remove();

        return {
            id: shape.id,
            crop
        }
    }

    private getCropData(input_coordinates: number[][]) {
        const coordinates = input_coordinates.map((coord) => ({
            x: coord[0] * this.sourceImage!.width,
            y: coord[1] * this.sourceImage!.height,
        }));

        const sx = coordinates[0].x;
        const sy = coordinates[0].y;
        const sw = coordinates[1].x - sx;
        const sh = coordinates[2].y - sy;

        return {
            sx,
            sy,
            sWidth: sw,
            sHeight: sh
        }
    }
}
