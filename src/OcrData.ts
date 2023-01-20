import {GraphModel, loadGraphModel} from "@tensorflow/tfjs";
import {DET_CONFIG, RECO_CONFIG} from "./common/constants";
import {OcrAnnotationData} from "./Interfaces/OcrAnnotationData";

export class OcrData {
    public recognitionModel!: GraphModel;
    public detectionModel!: GraphModel;
    public detConfig = DET_CONFIG.db_mobilenet_v2;
    public recoConfig = RECO_CONFIG.crnn_vgg16_bn;
    public readonly heatMapContainerElement!: HTMLCanvasElement;
    private annotationData: OcrAnnotationData = {
        image: null
    };

    private constructor() {
        this.heatMapContainerElement = document.createElement("canvas");
        this.heatMapContainerElement.id = "heatmap";
        const context = this.heatMapContainerElement.getContext("2d");
        context?.clearRect(0, 0, this.heatMapContainerElement.width, this.heatMapContainerElement.height);
    }

    public static async create(): Promise<OcrData> {
        const ocrData = new OcrData();
        await ocrData.loadModels();
        return ocrData;
    }

    private async loadModels() {
        this.recognitionModel = await loadGraphModel(this.recoConfig.path);
        this.detectionModel = await loadGraphModel(this.detConfig.path);
    }

    public getAnnotationData(): OcrAnnotationData {
        return this.annotationData;
    }

    public getDetconfigSize(): [number, number] {
        return [this.detConfig.height, this.detConfig.width];
    }

    public getRecoconfigSize(): [number, number] {
        return [this.recoConfig.height, this.recoConfig.width];
    }

    public setAnnotationData(annotationData: Partial<OcrAnnotationData>) {
        this.annotationData = {...this.annotationData, ...annotationData};
    }
}