import {OcrData} from "../OcrData";
import {CropperCrop} from "./Cropper";
import {argMax, browser, concat, scalar, softmax, unstack} from "@tensorflow/tfjs";
import {REC_MEAN, REC_STD, VOCAB} from "../common/constants";

export class WordExtractor {
    private data: OcrData;
    private readonly crops: CropperCrop[];

    private constructor(data: OcrData, crops: CropperCrop[]) {
        this.data = data;
        this.crops = crops;
    }


    public static async getWords(crops: CropperCrop[], data: OcrData) {
        const wordExtractor = new WordExtractor(data, crops);
        return await wordExtractor.extractWords();
    }

    private async extractWords() {
        const chunks = this.chunk(this.crops, 32);
        const output = [];
        for (const chunk of chunks) {
            const words = await this.extractWordsFromCrop(chunk.map((crop) => crop.crop));
            const collection = words?.map((word, index) => ({
                ...chunk[index],
                words: word ? [word] : [],
            }));
            output.push(collection);
        }
        return output;
    }

    private chunk<T>(array: T[], size: number) {
        const chunked_arr = [];
        let copied = [...array];
        const numOfChild = Math.ceil(copied.length / size);
        for (let i = 0; i < numOfChild; i++) {
            chunked_arr.push(copied.splice(0, size));
        }
        return chunked_arr;
    }

    private async extractWordsFromCrop(crops: HTMLImageElement[]) {
        let tensor = this.getImageTensorForRecognitionModel(crops, this.data.getRecoconfigSize());
        let predictions = await this.data.recognitionModel.executeAsync(tensor);

        //  @ts-ignore
        // @ts-ignore
        let probabilities = softmax(predictions, -1);
        let bestPath = unstack(argMax(probabilities, -1), 0);
        let blank = 126;
        const words = [];
        for (const sequence of bestPath) {
            let collapsed = "";
            let added = false;
            const values = sequence.dataSync();
            const arr = Array.from(values);
            for (const k of arr) {
                if (k === blank) {
                    added = false;
                } else if (k !== blank && added === false) {
                    collapsed += VOCAB[k];
                    added = true;
                }
            }
            words.push(collapsed);
        }
        return words;
    }

    private getImageTensorForRecognitionModel(crops: HTMLImageElement[], size: [number, number]) {
        const list = crops.map((imageObject) => {
            let h = imageObject.height;
            let w = imageObject.width;
            let resize_target: any;
            let padding_target: any;
            let aspect_ratio = size[1] / size[0];
            if (aspect_ratio * h > w) {
                resize_target = [size[0], Math.round((size[0] * w) / h)];
                padding_target = [
                    [0, 0],
                    [0, size[1] - Math.round((size[0] * w) / h)],
                    [0, 0],
                ];
            } else {
                resize_target = [Math.round((size[1] * h) / w), size[1]];
                padding_target = [
                    [0, size[0] - Math.round((size[1] * h) / w)],
                    [0, 0],
                    [0, 0],
                ];
            }
            return browser
                .fromPixels(imageObject)
                .resizeNearestNeighbor(resize_target)
                .pad(padding_target, 0)
                .toFloat()
                .expandDims();
        });
        const tensor = concat(list);
        let mean = scalar(255 * REC_MEAN);
        let std = scalar(255 * REC_STD);
        return tensor.sub(mean).div(std);
    }
}
