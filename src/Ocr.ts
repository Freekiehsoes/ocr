import {OcrData} from "./OcrData";
import {Cropper} from "./Helpers/Cropper";
import {Heatmap} from "./Helpers/Heatmap";
import {WordExtractor} from "./Helpers/WordExtractor";

export class Ocr {
    private readonly data: OcrData;

    private imageObject: HTMLImageElement | null = null;

    private constructor(data: OcrData) {
        this.data = data;
    }

    public static async create(): Promise<Ocr> {
        const data = await OcrData.create();
        return new Ocr(data);
    }

    public async processImage(imageUrl: string) {
        this.imageObject = await this.loadImage(imageUrl);

        await Heatmap.create(this.data, this.imageObject);

        return await this.getWords();
    }

    private async loadImage(imageUrl: string) {
        return new Promise<HTMLImageElement>((resolve) => {
            const imageObject = new Image();
            imageObject.onload = () => {
                resolve(imageObject);
            }
            imageObject.onerror = (e) => {
                console.log(e);
            }
            imageObject.src = imageUrl
        });
    }

    private async getWords() {
        const cropper = new Cropper(this.imageObject!, this.data.getAnnotationData().shapes!);
        const crops = await cropper.getCrops();
        return await WordExtractor.getWords(crops, this.data);
    }
}
