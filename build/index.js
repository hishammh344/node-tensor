"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const tf = __importStar(require("@tensorflow/tfjs-node"));
const server = (0, express_1.default)();
server.get("/", (req, res) => {
    res.json("hello");
});
server.get("/model", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const carsDataResponse = yield axios_1.default.get("https://storage.googleapis.com/tfjs-tutorials/carsData.json");
        const carsData = carsDataResponse.data;
        const cleaned = carsData
            .map((car) => ({
            mpg: car.Miles_per_Gallon,
            horsepower: car.Horsepower,
        }))
            .filter((car) => car.mpg != null && car.horsepower != null);
        cleaned.map((d) => ({
            x: d.horsepower,
            y: d.mpg,
        }));
        const values = cleaned.map((d) => ({
            x: d.horsepower,
            y: d.mpg,
        }));
    }
    catch (e) {
        res.json(e);
    }
}));
server.listen(4000, () => {
    console.log("listenin on port 4000");
});
const convertToTensor = (data) => {
    const result = tf.tidy(() => {
        tf.util.shuffle(data);
        const inputs = data.map((d) => d.horsepower);
        const labels = data.map((d) => d.mpg);
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
