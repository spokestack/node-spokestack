/**
 * @license
 * Copyright 2021 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

// This file is autogenerated.


import {registerKernel} from '@tensorflow/tfjs-core/dist/base';
import '@tensorflow/tfjs-core/dist/base_side_effects';
export * from '@tensorflow/tfjs-core/dist/base';
export * from '@tensorflow/tfjs-converter';

//backend = cpu
export * from '@tensorflow/tfjs-backend-cpu/dist/base';
import {batchMatMulConfig as BatchMatMul_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/BatchMatMul';
registerKernel(BatchMatMul_cpu);
import {concatConfig as Concat_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Concat';
registerKernel(Concat_cpu);
import {sigmoidConfig as Sigmoid_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Sigmoid';
registerKernel(Sigmoid_cpu);
import {realDivConfig as RealDiv_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/RealDiv';
registerKernel(RealDiv_cpu);
import {imagConfig as Imag_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Imag';
registerKernel(Imag_cpu);
import {gatherV2Config as GatherV2_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/GatherV2';
registerKernel(GatherV2_cpu);
import {packConfig as Pack_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Pack';
registerKernel(Pack_cpu);
import {realConfig as Real_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Real';
registerKernel(Real_cpu);
import {lessConfig as Less_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Less';
registerKernel(Less_cpu);
import {reshapeConfig as Reshape_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Reshape';
registerKernel(Reshape_cpu);
import {addConfig as Add_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Add';
registerKernel(Add_cpu);
import {unpackConfig as Unpack_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Unpack';
registerKernel(Unpack_cpu);
import {subConfig as Sub_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Sub';
registerKernel(Sub_cpu);
import {castConfig as Cast_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Cast';
registerKernel(Cast_cpu);
import {fftConfig as FFT_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/FFT';
registerKernel(FFT_cpu);
import {conv2DConfig as Conv2D_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Conv2D';
registerKernel(Conv2D_cpu);
import {reluConfig as Relu_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Relu';
registerKernel(Relu_cpu);
import {expandDimsConfig as ExpandDims_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/ExpandDims';
registerKernel(ExpandDims_cpu);
import {_fusedMatMulConfig as _FusedMatMul_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/_FusedMatMul';
registerKernel(_FusedMatMul_cpu);
import {stridedSliceConfig as StridedSlice_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/StridedSlice';
registerKernel(StridedSlice_cpu);
import {logConfig as Log_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Log';
registerKernel(Log_cpu);
import {sumConfig as Sum_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Sum';
registerKernel(Sum_cpu);
import {splitVConfig as SplitV_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/SplitV';
registerKernel(SplitV_cpu);
import {expConfig as Exp_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Exp';
registerKernel(Exp_cpu);
import {fillConfig as Fill_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Fill';
registerKernel(Fill_cpu);
import {maxConfig as Max_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Max';
registerKernel(Max_cpu);
import {complexAbsConfig as ComplexAbs_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/ComplexAbs';
registerKernel(ComplexAbs_cpu);
import {multiplyConfig as Multiply_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Multiply';
registerKernel(Multiply_cpu);
import {identityConfig as Identity_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Identity';
registerKernel(Identity_cpu);
import {transposeConfig as Transpose_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Transpose';
registerKernel(Transpose_cpu);
import {padV2Config as PadV2_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/PadV2';
registerKernel(PadV2_cpu);
import {complexConfig as Complex_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Complex';
registerKernel(Complex_cpu);
import {zerosLikeConfig as ZerosLike_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/ZerosLike';
registerKernel(ZerosLike_cpu);
import {maximumConfig as Maximum_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Maximum';
registerKernel(Maximum_cpu);
import {tanhConfig as Tanh_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/Tanh';
registerKernel(Tanh_cpu);
import {argMaxConfig as ArgMax_cpu} from '@tensorflow/tfjs-backend-cpu/dist/kernels/ArgMax';
registerKernel(ArgMax_cpu);

//backend = webgl
export * from '@tensorflow/tfjs-backend-webgl/dist/base';
import {batchMatMulConfig as BatchMatMul_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/BatchMatMul';
registerKernel(BatchMatMul_webgl);
import {concatConfig as Concat_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Concat';
registerKernel(Concat_webgl);
import {sigmoidConfig as Sigmoid_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Sigmoid';
registerKernel(Sigmoid_webgl);
import {realDivConfig as RealDiv_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/RealDiv';
registerKernel(RealDiv_webgl);
import {imagConfig as Imag_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Imag';
registerKernel(Imag_webgl);
import {gatherV2Config as GatherV2_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/GatherV2';
registerKernel(GatherV2_webgl);
import {packConfig as Pack_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Pack';
registerKernel(Pack_webgl);
import {realConfig as Real_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Real';
registerKernel(Real_webgl);
import {lessConfig as Less_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Less';
registerKernel(Less_webgl);
import {reshapeConfig as Reshape_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Reshape';
registerKernel(Reshape_webgl);
import {addConfig as Add_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Add';
registerKernel(Add_webgl);
import {unpackConfig as Unpack_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Unpack';
registerKernel(Unpack_webgl);
import {subConfig as Sub_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Sub';
registerKernel(Sub_webgl);
import {castConfig as Cast_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Cast';
registerKernel(Cast_webgl);
import {fftConfig as FFT_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/FFT';
registerKernel(FFT_webgl);
import {conv2DConfig as Conv2D_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Conv2D';
registerKernel(Conv2D_webgl);
import {reluConfig as Relu_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Relu';
registerKernel(Relu_webgl);
import {expandDimsConfig as ExpandDims_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/ExpandDims';
registerKernel(ExpandDims_webgl);
import {_fusedMatMulConfig as _FusedMatMul_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/_FusedMatMul';
registerKernel(_FusedMatMul_webgl);
import {stridedSliceConfig as StridedSlice_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/StridedSlice';
registerKernel(StridedSlice_webgl);
import {logConfig as Log_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Log';
registerKernel(Log_webgl);
import {sumConfig as Sum_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Sum';
registerKernel(Sum_webgl);
import {splitVConfig as SplitV_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/SplitV';
registerKernel(SplitV_webgl);
import {expConfig as Exp_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Exp';
registerKernel(Exp_webgl);
import {fillConfig as Fill_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Fill';
registerKernel(Fill_webgl);
import {maxConfig as Max_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Max';
registerKernel(Max_webgl);
import {complexAbsConfig as ComplexAbs_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/ComplexAbs';
registerKernel(ComplexAbs_webgl);
import {multiplyConfig as Multiply_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Multiply';
registerKernel(Multiply_webgl);
import {identityConfig as Identity_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Identity';
registerKernel(Identity_webgl);
import {transposeConfig as Transpose_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Transpose';
registerKernel(Transpose_webgl);
import {padV2Config as PadV2_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/PadV2';
registerKernel(PadV2_webgl);
import {complexConfig as Complex_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Complex';
registerKernel(Complex_webgl);
import {zerosLikeConfig as ZerosLike_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/ZerosLike';
registerKernel(ZerosLike_webgl);
import {maximumConfig as Maximum_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Maximum';
registerKernel(Maximum_webgl);
import {tanhConfig as Tanh_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/Tanh';
registerKernel(Tanh_webgl);
import {argMaxConfig as ArgMax_webgl} from '@tensorflow/tfjs-backend-webgl/dist/kernels/ArgMax';
registerKernel(ArgMax_webgl);