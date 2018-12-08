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
    // powerbi.extensibility
    import TooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
    // SlopeChartEnums
    import MarkerType = SlopeChartEnums.MarkerType;
    import LegendIcon = SlopeChartEnums.LegendIcon;
    import LineStyle = SlopeChartEnums.LineStyle;
    import CapStyle = SlopeChartEnums.CapStyle;

    export interface SlopeChartData {
        legendPoints: SlopeChartDataLegend[];
        dataPoints: SlopeChartDataPoint[];
        hasHighLight: boolean;
    }

    export interface SlopeChartDataPoint {
        category: number;
        value1: PrimitiveValue;
        value2: PrimitiveValue;
        color: string;
        label: string;
        valueLabels: string[];
        highlight: boolean;
        selectionId: powerbi.visuals.ISelectionId;
        tooltipInfo: TooltipDataItem[];
        markerType: MarkerType;
        markerSize: number;
        lineSize: number;
        lineStyle: LineStyle;
        lineCap: CapStyle;
    }

    export interface SlopeChartDataLegend {
        markerType: MarkerType;
        markerSize: number;
        color: string;
        label: string;
        isTitle: boolean;
    }
}