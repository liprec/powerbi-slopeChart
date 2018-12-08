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
    // utils.formatting
    import IValueFormatter = powerbi.extensibility.utils.formatting.IValueFormatter;
    import TextProperties = powerbi.extensibility.utils.formatting.TextProperties;
    // utils.dataview
    import DataViewObjectsParser = powerbi.extensibility.utils.dataview.DataViewObjectsParser;
    // utils.svg
    import IMargin = powerbi.extensibility.utils.svg.IMargin;
    // SlopeChartEnums
    import MarkerType = SlopeChartEnums.MarkerType;
    import LineStyle = SlopeChartEnums.LineStyle;
    import CapStyle = SlopeChartEnums.CapStyle;
    import ScaleOrientation = SlopeChartEnums.ScaleOrientation;
    import ScaleType = SlopeChartEnums.ScaleType;
    import LabelType = SlopeChartEnums.LabelType;

    const fontFamily: string = "\"Segoe UI\",wf_segoe-ui_normal,helvetica,arial,sans-serif";
    const fontFamilyAxis: string = "\"Segoe UI\",wf_segoe-ui_normal,helvetica,arial,sans-serif";

    export class SlopeChartSettings extends DataViewObjectsParser {
        public general: GeneralSettings = new GeneralSettings();
        public formatting: FormattingSettings = new FormattingSettings();
        public chart: ChartSettings = new ChartSettings();
        public plotArea: PlotAreaSettings = new PlotAreaSettings();
        public legend: LegendSettings = new LegendSettings();
        public category: CategorySettings = new CategorySettings();
        public axis1: AxisSettings = new AxisSettings();
        public axis2: AxisSettings = new AxisSettings();
        public dataValues: DataValuesSettings = new DataValuesSettings();
        public dataColors: DataColorsSettings = new DataColorsSettings();
        public markers: MarkersSettings = new MarkersSettings();
        public dataLabels: LabelsSettings = new LabelsSettings();
        public shapes: ShapesSettings = new ShapesSettings();
    }

    class GeneralSettings {
        public viewport: IViewport;
        public margin: IMargin = {
            top: 15,
            bottom: 10,
            right: 10,
            left: 10
        };
        public locale: string = undefined;
        public formatString: string = "";
        public duration: number = 0;
        public defaultColor: string = "#01B8AA";
        public ColorProperties: DataViewObjectPropertyIdentifier = {
            objectName: "dataPoint",
            propertyName: "fill"
        };
    }

    class FormattingSettings {
        public labelFormatter: IValueFormatter;
        public values1Formatter: IValueFormatter;
        public values2Formatter: IValueFormatter;
        public axis1Formatter: IValueFormatter;
        public axis2Formatter: IValueFormatter;
        public dataLabelFormatter: IValueFormatter;
    }

    class ChartSettings {
        public secondaryAxis: boolean = false;
        // public marginTop: number = 50;
        // public marginBottom: number = 50;
        // public marginLeft: number = 50;
        // public marginRight: number = 50;
    }

    class PlotAreaSettings {
        public show: boolean = false;
        public fillColor: string = "#FFF";
        public transparency: number = 50;
    }

    class LegendSettings {
        public show: boolean = false;
        public fontColor: string = "#777";
        public fontSize: number = 9;
        public fontFamily: string = fontFamily;
        public useShapeMarker: boolean = true;
        public markerType: MarkerType = MarkerType.Circle;
        public strokeWidth: number = 5;
        public markerColorAutomatic: boolean = true;
        public markerColor: string = undefined;
        public legendHeight: number;
        public textProperties(): TextProperties {
            return {
                fontFamily: this.fontFamily,
                fontSize: `${this.fontSize}pt`
            };
        }
    }

    export class CategorySettings {
        public show: boolean = true;
        public fontColor: string = "#777";
        public fontSize: number = 9;
        public fontFamily: string = fontFamilyAxis;
        public axisTextProperties(): TextProperties {
            return {
                fontFamily: this.fontFamily,
                fontSize: `${this.fontSize}pt`
            };
        }
    }

    export class AxisSettings {
        public show: boolean = true;
        public scaleType: number = ScaleType.Linear;
        public orientation: number = ScaleOrientation.Descending;
        public start: number = undefined;
        public end: number = undefined;
        public color: string = "#DDD";
        public fontColor: string = "#777";
        public fontSize: number = 9;
        public fontFamily: string = fontFamilyAxis;
        public labelDisplayUnits: number = 0;
        public labelPrecision: number = undefined;
        public showTitle: boolean = false;
        public title: string = undefined;
        public defaultTitle: string = undefined;
        public titleFontColor: string = "#777";
        public titleFontSize: number = 11;
        public titleFontFamily: string = fontFamilyAxis;
        public titleAlignment: string = "center";
        public axisTextProperties(): TextProperties {
            return {
                fontFamily: this.fontFamily,
                fontSize: `${this.fontSize}pt`
            };
        }
        public titleTextProperties(): TextProperties {
            return {
                fontFamily: this.titleFontFamily,
                fontSize: `${this.titleFontSize}pt`
            };
        }
        public showGrid: boolean = true;
        public strokeWidth: number = 1;
        public gridColor: string = "#DDD";
        public gridStyle: LineStyle = LineStyle.Solid;
    }

    class DataValuesSettings {
        public labelDisplayUnits: number = 0;
        public labelPrecision: number = undefined;
        public labelDisplayUnitsSecondary: number = 0;
        public labelPrecisionSecondary: number = undefined;
    }

    class DataColorsSettings {
        public oneFill: string = undefined;
        public showAll: boolean = false;
    }

    class LabelsSettings {
        public show: boolean = true;
        public fontColor: string = "#777";
        public fontSize: number = 9;
        public fontFamily: string = fontFamily;
        public labelType: LabelType = LabelType.Name;
        public labelDisplayUnits: number = 0;
        public labelPrecision: number = undefined;
        public textProperties(): TextProperties {
            return {
                fontFamily: this.fontFamily,
                fontSize: `${this.fontSize}pt`
            };
        }
    }

    class ShapesSettings {
        public useDefault: boolean = true;
        public strokeWidth: number = 2;
        public lineStyle: LineStyle = LineStyle.Solid;
        public lineCap: CapStyle = CapStyle.Round;
    }

    class MarkersSettings {
        public show: boolean = false;
        public markerAutomatic: boolean = true;
        public strokeWidth: number = 5;
    }
}
