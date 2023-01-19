// Copyright (C) 2021, Mindee.

// This program is licensed under the Apache License version 2.
// See LICENSE or go to <https://www.apache.org/licenses/LICENSE-2.0.txt> for full license details.

import { Grid, makeStyles, Portal, Theme } from "@material-ui/core";
import { GraphModel } from "@tensorflow/tfjs";
import { createRef, useEffect, useMemo, useRef, useState } from "react";
import {
  AnnotationData,
  AnnotationShape,
  drawLayer,
  drawShape,
  setShapeConfig,
  Stage,
} from "react-mindee-js";
import { DET_CONFIG, RECO_CONFIG } from "src/common/constants";
import {
  extractBoundingBoxesFromHeatmap,
  extractWords,
  getHeatMapFromImage,
  loadDetectionModel,
  loadRecognitionModel,
} from "src/utils";
import { useStateWithRef } from "src/utils/hooks";
import { flatten } from "underscore";
import { UploadedFile, Word } from "../common/types";
import AnnotationViewer from "./AnnotationViewer";
import HeatMap from "./HeatMap";
import ImageViewer from "./ImageViewer";
import Sidebar from "./Sidebar";
import WordsList from "./WordsList";

const COMPONENT_ID = "VisionWrapper";

const useStyles = makeStyles((theme: Theme) => ({
  wrapper: {},
}));

export default function VisionWrapper(): JSX.Element {
  const classes = useStyles();
  const detConfig = DET_CONFIG.db_mobilenet_v2;
  const recoConfig = RECO_CONFIG.crnn_vgg16_bn;
  const [loadingImage, setLoadingImage] = useState(false);
  const recognitionModel = useRef<GraphModel | null>(null);
  const detectionModel = useRef<GraphModel | null>(null);
  const imageObject = useRef<HTMLImageElement>(new Image());
  const heatMapContainerObject = useRef<HTMLCanvasElement | null>(null);
  const annotationStage = useRef<Stage | null>();
  const [annotationData, setAnnotationData] = useState<AnnotationData>({
    image: null,
  });
  const [words, setWords] = useState<Word[]>([]);

  useEffect(() => {
    console.log(words);
  }, [words]);

  useEffect(() => {
    // eslint-disable-next-line
    (async () => {
      const imageUrl = "car.jpg";
      // generate UploadedFile object
      // eslint-disable-next-line
      const blob =  await fetch(imageUrl).then((res) => res.blob());
      const fileObject = new File([blob], "test.jpg", { type: "image/jpeg" });
      // eslint-disable-next-line
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(fileObject);
        reader.onload = () => resolve(reader.result as string);
      });

      const file: UploadedFile = {
        image: base64,
        source: fileObject,
      };

      extractPicture(file);
    })();
  },[]);

  const clearCurrentStates = () => {
    setWords([]);
  };

  const extractPicture = (newFile: UploadedFile) => {
    clearCurrentStates();
    loadImage(newFile).then();
    setAnnotationData({ image: newFile.image });
  };

  useEffect(() => {
    setWords([]);
    setAnnotationData({ image: null });
    imageObject.current.src = "";
    if (heatMapContainerObject.current) {
      const context = heatMapContainerObject.current.getContext("2d");
      context?.clearRect(
        0,
        0,
        heatMapContainerObject.current.width,
        heatMapContainerObject.current.height
      );
    }
    loadRecognitionModel({recognitionModel, recoConfig}).then();
    loadDetectionModel({ detectionModel, detConfig }).then();
  }, []);

  const getBoundingBoxes = () => {
    const boundingBoxes = extractBoundingBoxesFromHeatmap([
      detConfig.height,
      detConfig.width,
    ]);
    setAnnotationData({
      image: imageObject.current.src,
      shapes: boundingBoxes,
    });
    setTimeout(getWords, 2000);
  };

  const getWords = async () => {
    const words = (await extractWords({
      recognitionModel: recognitionModel.current,
      stage: annotationStage.current!,
      size: [recoConfig.height, recoConfig.width],
    })) as Word[];
    setWords(flatten(words));
  };

  const loadImage = async (uploadedFile: UploadedFile) => {
    setLoadingImage(true);
    imageObject.current.onload = async () => {
      await getHeatMapFromImage({
        heatmapContainer: heatMapContainerObject.current,
        detectionModel: detectionModel.current,
        imageObject: imageObject.current,
        size: [detConfig.height, detConfig.width],
      });
      getBoundingBoxes();
      setLoadingImage(false);
    };
    imageObject.current.src = uploadedFile?.image as string;
  };
  const setAnnotationStage = (stage: Stage) => {
    annotationStage.current = stage;
  };

  const uploadContainer = document.getElementById("upload-container");
  return (
      <>
        <canvas id="heatmap" ref={heatMapContainerObject} />
        <AnnotationViewer
            loadingImage={loadingImage}
            setAnnotationStage={setAnnotationStage}
            annotationData={annotationData}
        />
      </>
  );
}
