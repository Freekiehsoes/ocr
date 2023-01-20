import {AnnotationShape} from "./AnnotationShape";

export interface OcrAnnotationData {
    image?: string | null;
    shapes?: AnnotationShape[];
}
