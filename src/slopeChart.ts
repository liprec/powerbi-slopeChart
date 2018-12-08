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
    // powerbi.visuals
    import ISelectionId = powerbi.visuals.ISelectionId;
    // utils.svg
    import ClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.ClassAndSelector;
    import createClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.createClassAndSelector;
    // utils.formatting
    import valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
    import textMeasurementService = powerbi.extensibility.utils.formatting.textMeasurementService;
    // utils.dataview
    import DataViewObjectsModule = powerbi.extensibility.utils.dataview.DataViewObjects;
    // utils.tooltip
    import ITooltipServiceWrapper = powerbi.extensibility.utils.tooltip.ITooltipServiceWrapper;
    import createTooltipServiceWrapper = powerbi.extensibility.utils.tooltip.createTooltipServiceWrapper;
    // powerbi.extensibility
    import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
    import TooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
    import ISelectionIdBuilder = powerbi.visuals.ISelectionIdBuilder;
    // d3
    import Selection = d3.Selection;
    import Update = d3.selection.Update;
    import Selector = powerbi.data.Selector;
    // SlopeChartEnums
    import MarkerType = SlopeChartEnums.MarkerType;
    import LegendIcon = SlopeChartEnums.LegendIcon;
    import LineStyle = SlopeChartEnums.LineStyle;
    import CapStyle = SlopeChartEnums.CapStyle;
    import ScaleOrientation = SlopeChartEnums.ScaleOrientation;
    import LabelType = SlopeChartEnums.LabelType;

    export class SlopeChart implements IVisual {

        public static Svg: ClassAndSelector = createClassAndSelector("slopeChart");
        public static Axis: ClassAndSelector = createClassAndSelector("axis");
        public static CategoryAxis: ClassAndSelector = createClassAndSelector("categoryAxis");
        public static Value1Axis: ClassAndSelector = createClassAndSelector("axisValue1");
        public static Value2Axis: ClassAndSelector = createClassAndSelector("axisValue2");
        public static Value1AxisLabel: ClassAndSelector = createClassAndSelector("axisValue1Label");
        public static Value2AxisLabel: ClassAndSelector = createClassAndSelector("axisValue2Label");
        public static AxisGrid: ClassAndSelector = createClassAndSelector("axisGrid");
        public static Legend: ClassAndSelector = createClassAndSelector("legend");
        public static LegendTitle: ClassAndSelector = createClassAndSelector("legendTitle");
        public static LegendNode: ClassAndSelector = createClassAndSelector("legendNode");
        public static LegendMarker: ClassAndSelector = createClassAndSelector("legendMarker");
        public static LegendLabel: ClassAndSelector = createClassAndSelector("legendLabel");
        public static PlotArea: ClassAndSelector = createClassAndSelector("plotArea");
        public static PlotAreaBackground: ClassAndSelector = createClassAndSelector("plotAreaBackground");
        public static Plot: ClassAndSelector = createClassAndSelector("plot");
        public static SlopeNode: ClassAndSelector = createClassAndSelector("slopeNode");
        public static SlopePath: ClassAndSelector = createClassAndSelector("slopePath");
        public static SlopeMarker: ClassAndSelector = createClassAndSelector("slopeMarker");
        public static SlopeLabelV1: ClassAndSelector = createClassAndSelector("slopeLabelValue1");
        public static SlopeLabelV2: ClassAndSelector = createClassAndSelector("slopeLabelValue2");

        private svg: Selection<any>;
        private mainGroupElement: Selection<any>;
        private axis: Selection<any>;
        private axisCategory: Selection<any>;
        private axisValue1: Selection<any>;
        private axisValue2: Selection<any>;
        private axisValue1Label: Selection<any>;
        private axisValue2Label: Selection<any>;
        private axisGrid: Selection<any>;
        private legend: Selection<any>;
        private plotAreaGroup: Selection<any>;
        private plotArea: Selection<any>;
        private plotAreaBackground: Selection<any>;
        private plot: Selection<any>;
        private plotSelection: Update<SlopeChartDataPoint>;

        private host: IVisualHost;
        private dataView: DataView;
        private colorPalette: ISandboxExtendedColorPalette;
        private selectionIdBuilder: ISelectionIdBuilder;
        private selectionManager: ISelectionManager;
        private allowInteractions: boolean;
        private tooltipServiceWrapper: ITooltipServiceWrapper;
        private data: SlopeChartData;

        private settings: SlopeChartSettings;
        private axisSettings: SlopeAxisSettings;

        constructor(options: VisualConstructorOptions) {
            this.host = options.host;
            this.colorPalette = options.host.colorPalette;
            this.selectionIdBuilder = options.host.createSelectionIdBuilder();
            this.selectionManager = options.host.createSelectionManager();
            this.allowInteractions = options.host.allowInteractions;
            this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
            this.settings = this.parseSettings(this.dataView);
            this.settings.general.locale = options.host.locale;

            this.selectionManager.registerOnSelectCallback(() => {
                syncSelectionState(this.plotSelection, this.selectionManager.getSelectionIds() as ISelectionId[]);
            });

            if (!this.svg) {
                this.svg = d3.select(options.element)
                    .append("svg")
                    .classed(SlopeChart.Svg.className, true);
            }

            this.svg.on("click", () => {
                if (this.allowInteractions) {
                    this.selectionManager
                        .clear()
                        .then(() => {
                            syncSelectionState(this.plotSelection, []);
                        });
                }
            });

            this.mainGroupElement = this.svg.append("g");

            this.legend = this.mainGroupElement
                .append("g")
                .classed(SlopeChart.Legend.className, true);

            this.axis = this.mainGroupElement
                .append("g")
                .classed(SlopeChart.Axis.className, true);

            this.axisCategory = this.axis
                .append("g")
                .classed(SlopeChart.CategoryAxis.className, true);

            this.axisValue1 = this.axis
                .append("g")
                .classed(SlopeChart.Value1Axis.className, true);

            this.axisValue2 = this.axis
                .append("g")
                .classed(SlopeChart.Value2Axis.className, true);

            this.axisValue1Label = this.axis
                .append("text")
                .classed(SlopeChart.Value1AxisLabel.className, true);

            this.axisValue2Label = this.axis
                .append("text")
                .classed(SlopeChart.Value2AxisLabel.className, true);

            this.axisGrid = this.axis
                .append("g")
                .classed(SlopeChart.AxisGrid.className, true);

            this.plotAreaGroup = this.mainGroupElement
                .append("g");

            this.plotArea = this.plotAreaGroup
                .append("svg")
                .classed(SlopeChart.PlotArea.className, true);

            this.plotAreaBackground = this.plotArea
                .append("rect")
                .style("opacity", 0)
                .attr({
                    "height": "100%",
                    "width": "100%"
                })
                .classed(SlopeChart.PlotAreaBackground.className, true);

            this.plot = this.plotArea
                .append("g")
                .classed(SlopeChart.Plot.className, true);

        }

        public converter(dataView: DataView, host: IVisualHost, colors: ISandboxExtendedColorPalette): SlopeChartData {
            if (!this.checkFullDataset(dataView)) {
                return {
                    legendPoints: [],
                    dataPoints: [],
                    hasHighLight: false
                };
            }
            const dataPoints: SlopeChartDataPoint[] = [];
            const legendPoints: SlopeChartDataLegend[] = [];
            const hasHighLight: boolean = dataView.categorical.values[0].highlights !== undefined;
            // const types = hasHighlight ? 2 : 1;
            let category: DataViewCategoryColumn = dataView.categorical.categories[0];
            let values1: DataViewValueColumn = dataView.categorical.values[0];
            let values2: DataViewValueColumn = dataView.categorical.values[1];
            let valueLabels: string[] = [values1.source.displayName, values2.source.displayName];
            this.settings.axis1.defaultTitle = values1.source.displayName;
            this.settings.axis2.defaultTitle = values2.source.displayName;

            if (this.settings.dataColors.oneFill === undefined) {
                this.settings.dataColors.oneFill = this.getColumnColorByIndex(-1, "", this.colorPalette, undefined);
            }
            if (this.settings.legend.markerColor === undefined) {
                this.settings.legend.markerColor = this.settings.dataColors.oneFill;
            }

            legendPoints.push({
                label: category.source.displayName,
                color: undefined,
                markerType: MarkerType.None,
                markerSize: 0,
                isTitle: true
            });

            const axis1Formatter = this.settings.formatting.axis1Formatter = valueFormatter.create({
                format: valueFormatter.getFormatStringByColumn(values1.source),
                precision: this.settings.axis1.labelPrecision,
                value: this.settings.axis1.labelDisplayUnits || values1.maxLocal,
                cultureSelector: this.settings.general.locale
            });

            const axis2Formatter = this.settings.formatting.axis2Formatter = valueFormatter.create({
                format: valueFormatter.getFormatStringByColumn(values2.source),
                precision: this.settings.chart.secondaryAxis ? this.settings.axis2.labelPrecision : this.settings.axis1.labelPrecision,
                value: (this.settings.chart.secondaryAxis ?  this.settings.axis2.labelDisplayUnits : this.settings.axis1.labelDisplayUnits) || values2.maxLocal,
                cultureSelector: this.settings.general.locale
            });

            const values1Formatter = this.settings.formatting.values1Formatter = valueFormatter.create({
                format: valueFormatter.getFormatStringByColumn(values1.source),
                precision: this.settings.dataValues.labelPrecision,
                value: this.settings.dataValues.labelDisplayUnits || values1.maxLocal,
                cultureSelector: this.settings.general.locale
            });

            const values2Formatter = this.settings.formatting.values2Formatter = valueFormatter.create({
                format: valueFormatter.getFormatStringByColumn(values2.source),
                precision: this.settings.chart.secondaryAxis ? this.settings.dataValues.labelPrecisionSecondary : this.settings.dataValues.labelPrecision,
                value: (this.settings.chart.secondaryAxis ?  this.settings.dataValues.labelDisplayUnitsSecondary : this.settings.dataValues.labelDisplayUnits) || values2.maxLocal,
                cultureSelector: this.settings.general.locale
            });

            const labelFormatter = this.settings.formatting.labelFormatter = valueFormatter.create({
                format: valueFormatter.getFormatStringByColumn(category.source),
                precision: undefined,
                value: category.values[0],
                cultureSelector: this.settings.general.locale
            });

            this.settings.formatting.dataLabelFormatter = valueFormatter.create({
                format: valueFormatter.getFormatStringByColumn(values1.source),
                precision: this.settings.dataLabels.labelPrecision,
                value: this.settings.dataLabels.labelDisplayUnits || values1.maxLocal,
                cultureSelector: this.settings.general.locale
            });

            // for (let t = 0; t < types; t++) {
                for (let i = 0; i < category.values.length; i++) {
                    const selectionId: ISelectionId = host.createSelectionIdBuilder()
                        .withCategory(category, i)
                        .createSelectionId();

                    const color: string = this.getColumnColorByIndex(this.settings.dataColors.showAll ? i : -1, i.toString(), colors, this.settings.dataColors.oneFill);
                    const markerType: MarkerType = this.getColumnMarkerTypeByIndex(i);
                    const markerSize: number = this.getColumnMarkerSizeByIndex(this.settings.markers.markerAutomatic ? -1 : i, this.settings.markers.strokeWidth);
                    const lineSize: number = this.getColumnLineSizeByIndex(this.settings.shapes.useDefault ? -1 : i, this.settings.shapes.strokeWidth);
                    const lineStyle: LineStyle = this.getColumnLineStyleByIndex(this.settings.shapes.useDefault ? -1 : i, this.settings.shapes.lineStyle);
                    const lineCap: CapStyle = this.getColumnLineCapByIndex(this.settings.shapes.useDefault ? -1 : i, this.settings.shapes.lineCap);

                    dataPoints.push({
                            category: i,
                            value1: values1.values[i],
                            value2: values2.values[i],
                            label: labelFormatter.format(category.values[i]),
                            valueLabels: valueLabels,
                            color: color,
                            highlight: hasHighLight ? values1.values[i] === values1.highlights[i] : true,
                            selectionId: selectionId,
                            markerType: markerType,
                            markerSize: markerSize,
                            lineSize: lineSize,
                            lineStyle: lineStyle,
                            lineCap: lineCap,
                            tooltipInfo: [
                                {
                                    header: labelFormatter.format(category.values[i]),
                                    displayName: valueLabels[0],
                                    value: values1Formatter.format(values1.values[i]),
                                    color: color
                                },
                                {
                                    displayName: valueLabels[1],
                                    value: values2Formatter.format(values2.values[i]),
                                    color: color,
                                    opacity: "0"
                                }
                            ]
                        });

                    legendPoints.push({
                        label: labelFormatter.format(category.values[i]),
                        color: color,
                        markerType: this.settings.legend.useShapeMarker ? markerType : this.settings.legend.markerType,
                        markerSize: this.settings.legend.useShapeMarker ? markerSize : this.settings.legend.strokeWidth,
                        isTitle: false
                    });
                }
            // }

            return {
                legendPoints: legendPoints,
                dataPoints: dataPoints,
                hasHighLight: hasHighLight
            };
        }

        public update(options: VisualUpdateOptions) {
            if (!options ||
                !options.dataViews ||
                !options.dataViews[0] ||
                !options.viewport) {
                return;
            }

            let dataView = this.dataView = options.dataViews ? options.dataViews[0] : undefined;
            if (!this.dataView) {
                return;
            }

            this.settings = this.parseSettings(this.dataView);

            let data = this.data = this.converter(dataView, this.host, this.colorPalette),
                dataPoints = data.dataPoints,
                legendPoints = data.legendPoints;

            this.settings.general.viewport = {
                height: options.viewport.height > 0 ? options.viewport.height : 0,
                width: options.viewport.width > 0 ? options.viewport.width : 0
            };

            this.axisSettings = calcAxisSettings(this.settings, this.data);
            this.svg
                .attr({
                    "height": this.settings.general.viewport.height,
                    "width": this.settings.general.viewport.width
                });

            // Overwrite High Contrast colors
            this.settings.plotArea.fillColor = this.colorPalette.isHighContrast ? this.colorPalette.background.value : this.settings.plotArea.fillColor;
            this.settings.category.fontColor = this.colorPalette.isHighContrast ? this.colorPalette.foreground.value : this.settings.category.fontColor;
            this.settings.axis1.fontColor = this.colorPalette.isHighContrast ? this.colorPalette.foreground.value : this.settings.axis1.fontColor;
            this.settings.axis2.fontColor = this.colorPalette.isHighContrast ? this.colorPalette.foreground.value : this.settings.axis2.fontColor;
            this.settings.axis1.gridColor = this.colorPalette.isHighContrast ? this.colorPalette.backgroundLight.value : this.settings.axis1.gridColor;
            this.settings.legend.markerColor = this.colorPalette.isHighContrast ? this.colorPalette.foreground.value : this.settings.legend.markerColor;
            this.settings.legend.fontColor = this.colorPalette.isHighContrast ? this.colorPalette.foreground.value : this.settings.legend.fontColor;
            this.settings.category.fontColor = this.colorPalette.isHighContrast ? this.colorPalette.foreground.value : this.settings.category.fontColor;

            this.plotSelection = this.plot
                .selectAll(SlopeChart.SlopeNode.selectorName)
                .data(dataPoints);

            this.plotSelection
                .enter()
                .append("g")
                .classed(SlopeChart.SlopeNode.className, true);

            this.plotSelection
                .exit()
                .remove();

            // const legendTitle = this.legend
            //     .selectAll(SlopeChart.LegendTitle.selectorName)
            //     .data(this.settings.legend.showLegend ? [this.data.legend] : []);

            // legendTitle
            //     .enter()
            //     .append("g")
            //     .classed(SlopeChart.LegendTitle.className, true);

            // legendTitle
            //     .append("text")
            //     .attr("x", (this.settings.legend.strokeWidth * 2) + 2)
            //     .attr("y", this.settings.legend.legendHeight * .75)
            //     .style("fill", this.settings.legend.fontColor)
            //     .style("font-family", this.settings.legend.fontFamily)
            //     .style("font-size", `${this.settings.legend.fontSize}pt`)
            //     .transition()
            //     .duration(this.settings.general.duration)
            //     .text(d => { return d; });

            // legendTitle
            //     .exit()
            //     .remove();

            const legendSelection = this.legend
                .selectAll(SlopeChart.LegendNode.selectorName)
                .data(this.settings.legend.show ? legendPoints : []);

            legendSelection
                .enter()
                .append("g")
                .classed(SlopeChart.LegendNode.className, true);

            legendSelection
                .exit()
                .remove();

            drawLegend(
                legendSelection,
                this.settings,
                this.tooltipServiceWrapper);

            drawAxis(
                this.axis,
                this.settings,
                this.data,
                this.axisSettings);
            this.setPlotAreaDimensions();
            drawChart(
                this.plot,
                this.plotSelection,
                this.settings,
                this.selectionManager,
                this.allowInteractions,
                this.tooltipServiceWrapper,
                this.axisSettings,
                this.data);
            syncSelectionState(this.plotSelection, this.selectionManager.getSelectionIds() as ISelectionId[]);
        }

        public checkFullDataset(dataView: DataView) {
            return !(
                !dataView ||
                !dataView.categorical ||
                !dataView.categorical.categories ||
                !dataView.categorical.categories[0] ||
                !dataView.categorical.categories[0].values ||
                !(dataView.categorical.categories[0].values.length > 0) ||
                !dataView.categorical.values ||
                !(dataView.categorical.values.length === 2) ||
                !dataView.categorical.values[0] ||
                !dataView.categorical.values[0].values ||
                !(dataView.categorical.values[0].values.length > 0) ||
                !dataView.categorical.values[1] ||
                !dataView.categorical.values[1].values ||
                !(dataView.categorical.values[1].values.length > 0)
            );
        }

        public getColumnColorByIndex(index: number, queryName: string, colorPalette: ISandboxExtendedColorPalette, oneFill: string): string {
            if (colorPalette.isHighContrast) {
                return colorPalette.foreground.value;
            }

            if (index === -1) {
                if (oneFill) {
                    return oneFill;
                }
                return colorPalette.getColor("0").value;
            }

            let objects = this.dataView.metadata.objects;
            if (objects) {
                let dataPoint = DataViewObjectsModule.getObject(objects, "dataColors");
                if (dataPoint) {
                    dataPoint = dataPoint.$instances;
                    if (dataPoint) {
                        let dataPointSetting: any = dataPoint[index];
                        if (dataPointSetting) {
                            return dataPointSetting.fill.solid.color;
                        }
                    }
                }
            }

            return colorPalette.getColor(queryName).value;
        }

        public getColumnMarkerTypeByIndex(index: number): MarkerType {
            let objects = this.dataView.metadata.objects;
            if (objects) {
                let dataPoint = DataViewObjectsModule.getObject(objects, "markers");
                if (dataPoint) {
                    dataPoint = dataPoint.$instances;
                    if (dataPoint) {
                        let dataPointSetting: any = dataPoint[index];
                        if (dataPointSetting) {
                            if (dataPointSetting.markerType !== undefined) {
                                return dataPointSetting.markerType;
                            }
                        }
                    }
                }
            }

            return index % 5;
        }

        public getColumnMarkerSizeByIndex(index: number, strokeWidth: number): number {
            if (index === -1) {
                return strokeWidth;
            }

            let objects = this.dataView.metadata.objects;
            if (objects) {
                let dataPoint = DataViewObjectsModule.getObject(objects, "markers");
                if (dataPoint) {
                    dataPoint = dataPoint.$instances;
                    if (dataPoint) {
                        let dataPointSetting: any = dataPoint[index];
                        if (dataPointSetting) {
                            if (dataPointSetting.strokeWidth) {
                                return dataPointSetting.strokeWidth;
                            }
                        }
                    }
                }
            }
            return strokeWidth;
        }

        public getColumnLineSizeByIndex(index: number, strokeWidth: number): number {
            if (index === -1) {
                return strokeWidth;
            }

            let objects = this.dataView.metadata.objects;
            if (objects) {
                let dataPoint = DataViewObjectsModule.getObject(objects, "shapes");
                if (dataPoint) {
                    dataPoint = dataPoint.$instances;
                    if (dataPoint) {
                        let dataPointSetting: any = dataPoint[index];
                        if (dataPointSetting) {
                            if (dataPointSetting.strokeWidth) {
                                return dataPointSetting.strokeWidth;
                            }
                        }
                    }
                }
            }
            return strokeWidth;
        }

        public getColumnLineStyleByIndex(index: number, lineStyle: LineStyle): LineStyle {
            if (index === -1) {
                return lineStyle;
            }

            let objects = this.dataView.metadata.objects;
            if (objects) {
                let dataPoint = DataViewObjectsModule.getObject(objects, "shapes");
                if (dataPoint) {
                    dataPoint = dataPoint.$instances;
                    if (dataPoint) {
                        let dataPointSetting: any = dataPoint[index];
                        if (dataPointSetting) {
                            if (dataPointSetting.lineStyle !== undefined) {
                                return dataPointSetting.lineStyle;
                            }
                        }
                    }
                }
            }
            return LineStyle.Solid;
        }

        public getColumnLineCapByIndex(index: number, lineCap: CapStyle): CapStyle {
            if (index === -1) {
                return lineCap;
            }

            let objects = this.dataView.metadata.objects;
            if (objects) {
                let dataPoint = DataViewObjectsModule.getObject(objects, "shapes");
                if (dataPoint) {
                    dataPoint = dataPoint.$instances;
                    if (dataPoint) {
                        let dataPointSetting: any = dataPoint[index];
                        if (dataPointSetting) {
                            if (dataPointSetting.lineCap !== undefined) {
                                return dataPointSetting.lineCap;
                            }
                        }
                    }
                }
            }
            return CapStyle.Round;
        }

        private setPlotAreaDimensions() {
            this.axisSettings.CategoryAxis.DrawScale = this.axisSettings.CategoryAxis.Scale.copy()
                .rangeBands([0, this.axisSettings.Generic.Width]);
            this.axisSettings.Value1Axis.DrawScale = this.axisSettings.Value1Axis.Scale.copy();
            this.axisSettings.Value2Axis.DrawScale = this.axisSettings.Value2Axis.Scale.copy();

            switch (this.settings.axis1.orientation) {
                case ScaleOrientation.Descending:
                    this.axisSettings.Value1Axis.DrawScale
                        .range([this.axisSettings.Value1Axis.Scale(this.axisSettings.Value1Axis.Options.min) - this.axisSettings.Value1Axis.Scale(this.axisSettings.Value1Axis.Options.max), 0]);
                    break;
                case ScaleOrientation.Ascending:
                    this.axisSettings.Value1Axis.DrawScale
                        .range([0, this.axisSettings.Value1Axis.Scale(this.axisSettings.Value1Axis.Options.max) - this.axisSettings.Value1Axis.Scale(this.axisSettings.Value1Axis.Options.min)]);
                    break;
            }

            switch (this.settings.axis2.orientation) {
                case ScaleOrientation.Descending:
                    this.axisSettings.Value2Axis.DrawScale
                        .range([this.axisSettings.Value2Axis.Scale(this.axisSettings.Value2Axis.Options.min) - this.axisSettings.Value2Axis.Scale(this.axisSettings.Value2Axis.Options.max), 0]);
                    break;
                case ScaleOrientation.Ascending:
                    this.axisSettings.Value2Axis.DrawScale
                        .range([0, this.axisSettings.Value2Axis.Scale(this.axisSettings.Value2Axis.Options.max) - this.axisSettings.Value2Axis.Scale(this.axisSettings.Value2Axis.Options.min)]);
                    break;
            }

            let chartX = this.settings.general.margin.left + this.axisSettings.Value1Axis.Width,
                chartY = this.settings.general.margin.top,
                chartWidth = this.axisSettings.Generic.Width,
                chartHeight = this.axisSettings.Generic.Height;
            this.plotAreaGroup
                .attr({
                    "transform": `translate(${chartX}, ${chartY})`,
                })
                .transition()
                .duration(this.settings.general.duration);

            this.plotArea
                .attr({
                    "height": chartHeight,
                    "width": chartWidth,
                })
                .transition()
                .duration(this.settings.general.duration);

            this.plotAreaBackground
                .style({
                    "fill": this.settings.plotArea.fillColor,
                    "opacity": this.settings.plotArea.transparency / 100,
                    "visibility": this.settings.plotArea.show ? "visible" : "hidden"
                })
                .transition()
                .duration(this.settings.general.duration);
        }

        private parseSettings(dataView: DataView): SlopeChartSettings {
            let settings: SlopeChartSettings = SlopeChartSettings.parse(dataView) as SlopeChartSettings;

            if (settings.chart.secondaryAxis) {
                settings.axis2.show = true;
                settings.axis1.showGrid = false;
            } else {
                settings.axis2.show = false;
            }
            if (!settings.markers.show) {
                settings.legend.useShapeMarker = false;
            }
            // settings.general.margin = {
            //     top: settings.chart.marginTop,
            //     bottom: settings.chart.marginBottom,
            //     left: settings.chart.marginLeft,
            //     right: settings.chart.marginRight,
            // };
            if (settings.legend.show) {
                let legendHeight = textMeasurementService.measureSvgTextHeight(
                    settings.legend.textProperties(),
                    "Legend"
                );
                const legendHeightMarker = (settings.legend.strokeWidth * 2) / 0.75;
                legendHeight = ((legendHeight) < legendHeightMarker) ? legendHeightMarker : legendHeight;
                settings.legend.legendHeight = legendHeight;
                settings.general.margin.top += legendHeight;
            }

            return settings;
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
            const instanceEnumeration: VisualObjectInstanceEnumeration = SlopeChartSettings.enumerateObjectInstances(
                this.settings || SlopeChartSettings.getDefault(),
                options);
            if (options.objectName === "general") {
                // return;
            }

            let instances: VisualObjectInstance[] = [];

            switch (options.objectName) {
                case "chart":
                    if (this.settings.chart.secondaryAxis) {
                    }
                    break;
                case "plotArea":
                    break;
                case "legend":
                    if (!this.settings.markers.show) {
                        this.removeEnumerateObject(instanceEnumeration, "useShapeMarker");
                    }
                    if (this.settings.legend.useShapeMarker) {
                        this.removeEnumerateObject(instanceEnumeration, "markerType");
                    }
                    if (this.settings.legend.markerColorAutomatic) {
                        this.removeEnumerateObject(instanceEnumeration, "markerColor");
                    }
                    break;
                case "category":
                    break;
                case "axis1":
                    if (!this.settings.axis1.showTitle) {
                        this.removeEnumerateObject(instanceEnumeration, "title");
                        this.removeEnumerateObject(instanceEnumeration, "titleFontColor");
                        this.removeEnumerateObject(instanceEnumeration, "titleFontSize");
                        this.removeEnumerateObject(instanceEnumeration, "titleFontFamily");
                        this.removeEnumerateObject(instanceEnumeration, "titleAlignment");
                    }
                    if (!this.settings.axis1.showGrid || this.settings.chart.secondaryAxis) {
                        this.removeEnumerateObject(instanceEnumeration, "gridSize");
                        this.removeEnumerateObject(instanceEnumeration, "gridColor");
                        this.removeEnumerateObject(instanceEnumeration, "gridStyle");
                    } else {
                        this.removeEnumerateObject(instanceEnumeration, "color");
                    }
                    if (this.settings.chart.secondaryAxis) {
                        this.removeEnumerateObject(instanceEnumeration, "showGrid");
                    }
                    break;
                case "axis2":
                    if (!this.settings.chart.secondaryAxis) {
                        return;
                    }
                    if (!this.settings.axis2.showTitle) {
                        this.removeEnumerateObject(instanceEnumeration, "title");
                        this.removeEnumerateObject(instanceEnumeration, "titleFontColor");
                        this.removeEnumerateObject(instanceEnumeration, "titleFontSize");
                        this.removeEnumerateObject(instanceEnumeration, "titleFontFamily");
                        this.removeEnumerateObject(instanceEnumeration, "titleAlignment");
                    }
                    break;
                case "dataValues":
                    if (!this.settings.chart.secondaryAxis) {
                        this.removeEnumerateObject(instanceEnumeration, "labelDisplayUnitsSecondary");
                        this.removeEnumerateObject(instanceEnumeration, "labelPrecisionSecondary");
                    }
                    break;
                case "dataColors":
                    if (this.settings.dataColors.showAll) {
                        this.removeEnumerateObject(instanceEnumeration, "oneFill");
                        instances = this.dataColorsEnumerateObjectInstances(this.data.dataPoints);
                    }
                    break;
                case "markers":
                    if (!this.settings.markers.markerAutomatic) {
                        this.removeEnumerateObject(instanceEnumeration, "strokeWidth");
                        instances = this.dataMarkersEnumerateObjectInstances(this.data.dataPoints);
                    }
                    break;
                case "dataLabels":
                    if (this.settings.dataLabels.labelType === LabelType.Name) {
                        this.removeEnumerateObject(instanceEnumeration, "labelDisplayUnits");
                        this.removeEnumerateObject(instanceEnumeration, "labelPrecision");
                    }
                    break;
                case "shapes":
                    if (!this.settings.shapes.useDefault) {
                        this.removeEnumerateObject(instanceEnumeration, "strokeWidth");
                        this.removeEnumerateObject(instanceEnumeration, "lineStyle");
                        this.removeEnumerateObject(instanceEnumeration, "lineCap");
                        instances = this.dataShapesEnumerateObjectInstances(this.data.dataPoints);
                    }
                    break;
            }

            instances.forEach((instance: VisualObjectInstance) => { this.addAnInstanceToEnumeration(instanceEnumeration, instance); });
            return instanceEnumeration;
        }

        public dataColorsEnumerateObjectInstances(dataPoints: SlopeChartDataPoint[]): VisualObjectInstance[] {
            let instances: VisualObjectInstance[] = [];
            dataPoints.forEach((dataPoint: SlopeChartDataPoint, index: number) => {
                instances.push({
                    displayName: dataPoint.label,
                    objectName: "dataColors",
                    selector: { id: index.toString(), metadata: undefined },
                    properties: {
                        fill: { solid: { color: dataPoint.color } }
                    }
                });
            });
            return instances;
        }

        public dataMarkersEnumerateObjectInstances(dataPoints: SlopeChartDataPoint[]): VisualObjectInstance[] {
            let instances: VisualObjectInstance[] = [];
            dataPoints.forEach((dataPoint: SlopeChartDataPoint, index: number) => {
                instances.push({
                    displayName: `${dataPoint.label} - marker type`,
                    objectName: "markers",
                    selector: { id: index.toString(), metadata: undefined },
                    properties: {
                        markerType: dataPoint.markerType
                    }
                });
                if (dataPoint.markerType !== MarkerType.None) {
                    instances.push({
                        displayName: `${dataPoint.label} - marker size`,
                        objectName: "markers",
                        selector: { id: index.toString(), metadata: undefined },
                        properties: {
                            strokeWidth: dataPoint.markerSize
                        }
                    });
                }
            });
            return instances;
        }

        public dataShapesEnumerateObjectInstances(dataPoints: SlopeChartDataPoint[]): VisualObjectInstance[] {
            let instances: VisualObjectInstance[] = [];
            dataPoints.forEach((dataPoint: SlopeChartDataPoint, index: number) => {
                instances.push({
                    displayName: `${dataPoint.label} - line size`,
                    objectName: "shapes",
                    selector: { id: index.toString(), metadata: undefined },
                    properties: {
                        strokeWidth: dataPoint.lineSize
                    }
                });
                instances.push({
                    displayName: `${dataPoint.label} - line type`,
                    objectName: "shapes",
                    selector: { id: index.toString(), metadata: undefined },
                    properties: {
                        lineStyle: dataPoint.lineStyle
                    }
                });
                instances.push({
                    displayName: `${dataPoint.label} - line cap`,
                    objectName: "shapes",
                    selector: { id: index.toString(), metadata: undefined },
                    properties: {
                        lineCap: dataPoint.lineCap
                    }
                });
            });
            return instances;
        }

        public addAnInstanceToEnumeration(instanceEnumeration: VisualObjectInstanceEnumeration, instance: VisualObjectInstance): void {
            if ((instanceEnumeration as VisualObjectInstanceEnumerationObject).instances) {
                (instanceEnumeration as VisualObjectInstanceEnumerationObject)
                    .instances
                    .push(instance);
            } else {
                (instanceEnumeration as VisualObjectInstance[]).push(instance);
            }
        }

        public removeEnumerateObject(instanceEnumeration: VisualObjectInstanceEnumeration, objectName: string): void {
            if ((instanceEnumeration as VisualObjectInstanceEnumerationObject).instances) {
                delete (instanceEnumeration as VisualObjectInstanceEnumerationObject)
                    .instances[0].properties[objectName];
            } else {
                delete (instanceEnumeration as VisualObjectInstance[])[0].properties[objectName];
            }
        }
    }
}