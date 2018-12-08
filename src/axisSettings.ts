/*
 *
 * Copyright (c) 2018 Jan Pieter Posthuma / DataScenarios
 *
 * All rights reserved.
 *
 * MIT License.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual {

    "use strict";

    export class SlopeAxisSettings {
        public Generic: Generic = new Generic();
        public CategoryAxis: CategoryAxis = new CategoryAxis();
        public Value1Axis: ValueAxis = new ValueAxis();
        public Value2Axis: ValueAxis = new ValueAxis();

        public static getDefault() {
            return new this();
        }
    }

    class Generic {
        public Height: number = 0;
        public Width: number = 0;
    }

    export class CategoryAxis {
        public Scale: d3.scale.Ordinal<string, number>;
        public LabelSize: number = 0;
        public Height: number = 0;
        public DrawScale: d3.scale.Ordinal<string, number>;
    }

    export class ValueAxis {
        public Scale: d3.scale.Linear<number, number>;
        public LabelSize: number = 0;
        public Options: SlopeAxisOptions = new SlopeAxisOptions();
        public Width: number = 0;
        public DrawScale: d3.scale.Linear<number, number> ;
    }

    export class SlopeAxisOptions {
        max: number = 0;
        min: number = 0;
        ticks: number = 0;
        tickSize: number = 0;
    }
}