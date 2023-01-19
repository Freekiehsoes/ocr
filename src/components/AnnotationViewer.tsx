import {
  AnnotationData,
  AnnotationViewer as AnnotationViewerBase,
  Stage,
} from "react-mindee-js";

interface Props {
  loadingImage: boolean;
  annotationData: AnnotationData;
  setAnnotationStage: (stage: Stage) => void;
}

export default function AnnotationViewer({
  setAnnotationStage,
  annotationData,
  loadingImage,
}: Props): JSX.Element {
  return (
      <>
        {loadingImage ? (
            <></>
        ) : !annotationData.image ? (
            <>
            <p>No image loaded</p>
            </>
        ) : (
            <AnnotationViewerBase
                data={annotationData}
                getStage={setAnnotationStage}
                style={{ height: "465px", width: "100%", background: "white" }}
            />
        )}
      </>
  );
}
