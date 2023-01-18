import express from "express";
import axios from "axios";
import * as tf from "@tensorflow/tfjs-node";

const server = express();

server.get("/", (req, res) => {
  res.json("hello");
});

server.get("/model", async (req, res) => {
  try {
    const carsDataResponse = await axios.get(
      "https://storage.googleapis.com/tfjs-tutorials/carsData.json"
    );
    const carsData = carsDataResponse.data;
    const cleaned = carsData
      .map((car: { Miles_per_Gallon: any; Horsepower: any }) => ({
        mpg: car.Miles_per_Gallon,
        horsepower: car.Horsepower,
      }))
      .filter(
        (car: { mpg: null; horsepower: null }) =>
          car.mpg != null && car.horsepower != null
      );

    cleaned.map((d: { horsepower: any; mpg: any }) => ({
      x: d.horsepower,
      y: d.mpg,
    }));
    const values = cleaned.map((d: { horsepower: any; mpg: any }) => ({
      x: d.horsepower,
      y: d.mpg,
    }));
  } catch (e) {
    res.json(e);
  }
});

server.listen(4000, () => {
  console.log("listenin on port 4000");
});

const convertToTensor = (data: any) => {
  const result = tf.tidy(() => {
    tf.util.shuffle(data);
    const inputs = data.map((d: { horsepower: any }) => d.horsepower);
    const labels = data.map((d: { mpg: any }) => d.mpg);
    const inputTensor = tf.tensor2d(inputs, [inputs.length, 1]);
    const labelTensor = tf.tensor2d(labels, [labels.length, 1]);
    const inputMax = inputTensor.max();
    const inputMin = inputTensor.min();
    const labelMax = labelTensor.max();
    const labelMin = labelTensor.min();
    const normalizedInputs = inputTensor
      .sub(inputMin)
      .div(inputMax.sub(inputMin));
    const normalizedLabels = labelTensor
      .sub(labelMin)
      .div(labelMax.sub(labelMin));
    return {
      inputs: normalizedInputs,
      labels: normalizedLabels,
      // Return the min/max bounds so we can use them later.
      inputMax,
      inputMin,
      labelMax,
      labelMin,
    };
  });
  return result;
};
function createModel() {
  // Create a sequential model
  const model = tf.sequential();

  // Add a single input layer
  model.add(tf.layers.dense({ inputShape: [1], units: 1, useBias: true }));

  // Add an output layer
  model.add(tf.layers.dense({ units: 1, useBias: true }));

  return model;
}
