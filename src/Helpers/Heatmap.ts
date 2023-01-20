import {OcrData} from "../OcrData";
import {browser, scalar, squeeze} from "@tensorflow/tfjs";
import {DET_MEAN, DET_STD} from "../common/constants";
import cv from "@techstark/opencv-js";

export class Heatmap {
    private data: OcrData;
    private readonly imageObject: HTMLImageElement;

    private constructor(data: OcrData, imageObject: HTMLImageElement) {
        this.data = data;
        this.imageObject = imageObject;
    }

    public static async create(data: OcrData, imageObject: HTMLImageElement) {
        const heatmap = new Heatmap(data, imageObject);
        await heatmap.generateHeatmap();
        await heatmap.getBoundingBoxes();
    }

    private async generateHeatmap() {
        return new Promise<void>(async (resolve) => {
            if (!this.data.heatMapContainerElement && !this.data.detectionModel) {
                return;
            }
            this.data.heatMapContainerElement!.width = this.imageObject.width;
            this.data.heatMapContainerElement!.height = this.imageObject.height;
            let tensor = this.getImageTensorForDetectionModel(this.imageObject, this.data.getDetconfigSize());
            let prediction: any = await this.data.detectionModel?.execute(tensor);
            // @ts-ignore
            prediction = squeeze(prediction, 0);
            if (Array.isArray(prediction)) {
                prediction = prediction[0];
            }
            // @ts-ignore
            await browser.toPixels(prediction, this.data.heatMapContainerElement);
            resolve();
        });
    }

    private getImageTensorForDetectionModel(imageObject: HTMLImageElement, size: [number, number]) {
        let tensor = browser
            .fromPixels(imageObject)
            .resizeNearestNeighbor(size)
            .toFloat();
        let mean = scalar(255 * DET_MEAN);
        let std = scalar(255 * DET_STD);
        return tensor.sub(mean).div(std).expandDims();
    };

    private async getBoundingBoxes() {
        return new Promise<void>((resolve) => {
            const boundingBoxes = this.extractBoundingBoxesFromHeatmap();
            this.data.setAnnotationData({
                image: this.imageObject?.src,
                shapes: boundingBoxes
            });
            resolve();
        });
    }

    private extractBoundingBoxesFromHeatmap() {
        let src = cv.imread(this.data.heatMapContainerElement);
        cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
        cv.threshold(src, src, 77, 255, cv.THRESH_BINARY);
        cv.morphologyEx(src, src, cv.MORPH_OPEN, cv.Mat.ones(2, 2, cv.CV_8U));
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        // You can try more different parameters
        cv.findContours(
            src,
            contours,
            hierarchy,
            cv.RETR_EXTERNAL,
            cv.CHAIN_APPROX_SIMPLE
        );
        // draw contours with random Scalar
        const boundingBoxes = [];
        // @ts-ignore
        for (let i = 0; i < contours.size(); ++i) {
            const contourBoundingBox = cv.boundingRect(contours.get(i));
            if (contourBoundingBox.width > 2 && contourBoundingBox.height > 2) {
                boundingBoxes.unshift(this.transformBoundingBox(contourBoundingBox, i));
            }
        }
        src.delete();
        contours.delete();
        hierarchy.delete();
        return boundingBoxes;
    }

    private transformBoundingBox(contour: any, id: any) {
        const size = this.data.getDetconfigSize();
        let offset =
            (contour.width * contour.height * 1.8) /
            (2 * (contour.width + contour.height));
        const p1 = this.clamp(contour.x - offset, size[1]) - 1;
        const p2 = this.clamp(p1 + contour.width + 2 * offset, size[1]) - 1;
        const p3 = this.clamp(contour.y - offset, size[0]) - 1;
        const p4 = this.clamp(p3 + contour.height + 2 * offset, size[0]) - 1;
        return {
            id,
            coordinates: [
                [p1 / size[1], p3 / size[0]],
                [p2 / size[1], p3 / size[0]],
                [p2 / size[1], p4 / size[0]],
                [p1 / size[1], p4 / size[0]],
            ],
        };
    }

    private clamp(value: number, max: number) {
        return Math.min(Math.max(value, 0), max);
    }
}