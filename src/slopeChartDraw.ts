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
    // utils.tooltip
    import ITooltipServiceWrapper = powerbi.extensibility.utils.tooltip.ITooltipServiceWrapper;
    import TooltipEventArgs = powerbi.extensibility.utils.tooltip.TooltipEventArgs;
    // d3
    import Selection = d3.Selection;
    import Update = d3.selection.Update;
    // SlopeChartEnums
    import MarkerType = SlopeChartEnums.MarkerType;
    import CapStyle = SlopeChartEnums.CapStyle;
    import LineStyle = SlopeChartEnums.LineStyle;
    import LabelType = SlopeChartEnums.LabelType;

    export function drawChart(chartElement: Selection<any>, chartSelection: Update<any>, settings: SlopeChartSettings, selectionManager: ISelectionManager, allowInteractions: boolean, tooltipServiceWrapper: ITooltipServiceWrapper, axisSettings: SlopeAxisSettings, data: SlopeChartData): void {
        let slopeData = (dataPoint) => {
            const shift = axisSettings.CategoryAxis.DrawScale.rangeBand() / 2;
            const value1 = <number>dataPoint.value1.valueOf();
            const value2 = <number>dataPoint.value2.valueOf();
            const x1 = axisSettings.CategoryAxis.DrawScale(dataPoint.valueLabels[0]) + shift;
            const x2 = axisSettings.CategoryAxis.DrawScale(dataPoint.valueLabels[1]) + shift;
            const y1 = axisSettings.Value1Axis.DrawScale(value1);
            const y2 = settings.chart.secondaryAxis ? axisSettings.Value2Axis.DrawScale(value2) : axisSettings.Value1Axis.DrawScale(value2);
            return `M ${x1}, ${y1} L${x2}, ${y2}`;
        };

        let slopeMarker = (dataPoint) => {
            const shift = axisSettings.CategoryAxis.DrawScale.rangeBand() / 2;
            const value1 = <number>dataPoint.value1.valueOf();
            const value2 = <number>dataPoint.value2.valueOf();
            const x1 = axisSettings.CategoryAxis.DrawScale(dataPoint.valueLabels[0]) + shift;
            const x2 = axisSettings.CategoryAxis.DrawScale(dataPoint.valueLabels[1]) + shift;
            const y1 = axisSettings.Value1Axis.DrawScale(value1);
            const y2 = axisSettings.Value1Axis.DrawScale(value2);
            const s = dataPoint.markerSize;
            const s2 = s * 2;
            switch (dataPoint.markerType) {
                case MarkerType.None:
                    return null;
                case MarkerType.Cross:
                    return `M ${x1}, ${y1} l -${s}, ${s} l ${s2}, -${s2} l -${s} ${s} l -${s}, -${s} l ${s2} ${s2} M ${x2}, ${y2} l -${s}, ${s} l ${s2}, -${s2} l -${s} ${s} l -${s}, -${s} l ${s2}  ${s2}`;
                case MarkerType.Square:
                    return `M ${x1}, ${y1} l -${s}, ${s} l 0, -${s2} l ${s2}, 0 l 0, ${s2} l -${s2} 0 M ${x2}, ${y2} l -${s}, ${s} l 0, -${s2} l ${s2}, 0 l 0, ${s2} l -${s2} 0 `;
                case MarkerType.Triangle:
                    return `M ${x1}, ${y1} l -${s}, ${s} l ${s}, -${s2} l ${s}, ${s2} l -${s2}, 0 M ${x2}, ${y2} l -${s}, ${s} l ${s}, -${s2} l ${s}, ${s2} l -${s2}, 0`;
                case MarkerType.Diamond:
                    return `M ${x1}, ${y1} l 0, ${s} l -${s}, -${s} l ${s}, -${s} l ${s}, ${s} l -${s}, ${s} M ${x2}, ${y2} l 0, ${s} l -${s}, -${s} l ${s}, -${s} l ${s}, ${s} l -${s}, ${s}`;
                case MarkerType.Circle:
                default:
                    return `M ${x1}, ${y1} m -${s}, 0 a ${s}, ${s} 0 1, 1 ${s2}, 0 a ${s}, ${s} 0 1, 1 -${s2}, 0 M ${x2}, ${y2} m -${s}, 0 a ${s}, ${s} 0 1, 1 ${s2}, 0 a ${s}, ${s} 0 1, 1 -${s2}, 0`;
            }
        };

        let labelTransformY1 = (dataPoint) => {
            const shift = axisSettings.CategoryAxis.DrawScale.rangeBand() / 2;
            const value1 = <number>dataPoint.value1.valueOf();
            const x = axisSettings.CategoryAxis.DrawScale(dataPoint.valueLabels[0]) + shift;
            const y = axisSettings.Value1Axis.DrawScale(value1);
            return `translate(${x}, ${y})`;
        };

        let labelTransformY2 = (dataPoint) => {
            const shift = axisSettings.CategoryAxis.DrawScale.rangeBand() / 2;
            const value2 = <number>dataPoint.value2.valueOf();
            const x = axisSettings.CategoryAxis.DrawScale(dataPoint.valueLabels[1]) + shift;
            const y = settings.chart.secondaryAxis ? axisSettings.Value2Axis.DrawScale(value2) : axisSettings.Value1Axis.DrawScale(value2);
            return `translate(${x}, ${y})`;
        };

        let labelX1 = (dataPoint) => {
            let x = settings.shapes.strokeWidth;
            x = settings.shapes.lineCap === CapStyle.Flat ? x / 2 : x;
            x = settings.markers.show ? x += dataPoint.markerSize : 4;
            return -x;
        };

        let labelX2 = (dataPoint) => {
            let x = settings.shapes.strokeWidth;
            x = settings.shapes.lineCap === CapStyle.Flat ? x / 2 : x;
            x = settings.markers.show ? x += dataPoint.markerSize : 4;
            return x;
        };

        let lineCap = (dataPoint) => {
            if (dataPoint.lineStyle !== LineStyle.Solid) {
                return null;
            }
            switch (dataPoint.lineStyle) {
                case CapStyle.Square:
                    return "square";
                case CapStyle.Flat:
                    return "butt";
                case CapStyle.Round:
                default:
                    return "round";
            }
        };

        let lineStyle = (dataPoint) => {
            switch (dataPoint.lineStyle) {
                case LineStyle.Dashed:
                    return "5, 5";
                case LineStyle.Dotted:
                    return "1, 5";
                case LineStyle.Solid:
                default:
                    return null;
            }
        };

        let arrangeLegendLabels = (selector: string) => {
            let move = 1;
            while (move > 0) {
                move = 0;
                chartSelection.selectAll(selector)
                    .each(function() {
                        let box1 = this.getBoundingClientRect();
                        const availableWidth = settings.general.viewport.width - box1.left - settings.general.margin.right;
                        if (box1.width > availableWidth) {
                            d3.select(this).text("");
                            box1 = this.getBoundingClientRect();
                        }
                        let that = this;
                        chartSelection.selectAll(selector)
                            .each(function() {
                                if (this !== that) {
                                    const box2 = this.getBoundingClientRect();
                                    if (Math.abs(box1.top - box2.top) * 2 < (box1.height + box2.height)) {
                                        const dy = (Math.max(0, box1.bottom - box2.top) + Math.min(0, box1.top - box2.bottom)) * 0.02,
                                            tt = d3.transform(d3.select(this).attr("transform")),
                                            to = d3.transform(d3.select(that).attr("transform"));
                                        move += Math.abs(dy);

                                        to.translate = [ to.translate[0], to.translate[1] + dy ];
                                        tt.translate = [ tt.translate[0], tt.translate[1] - dy ];
                                        d3.select(this).attr("transform", "translate(" + tt.translate + ")");
                                        d3.select(that).attr("transform", "translate(" + to.translate + ")");
                                        box1 = that.getBoundingClientRect();
                                    }
                                }
                            });
                    });
            }
        };

        const slopes: Update<SlopeChartDataPoint> = <Update<SlopeChartDataPoint>>chartSelection.selectAll(SlopeChart.SlopePath.selectorName).data(d => {
            return [d];
        });
        const slopeMarkers: Update<SlopeChartDataPoint> = <Update<SlopeChartDataPoint>>chartSelection.selectAll(SlopeChart.SlopeMarker.selectorName).data(d => {
            return settings.markers.show ? [d] : [];
        });
        const slopeLabelsV1: Update<SlopeChartDataPoint> = <Update<SlopeChartDataPoint>>chartSelection.selectAll(SlopeChart.SlopeLabelV1.selectorName).data(d => {
            return settings.dataLabels.show && settings.dataLabels.labelType !== LabelType.Name ? [d] : [];
        });
        const slopeLabelsV2: Update<SlopeChartDataPoint> = <Update<SlopeChartDataPoint>>chartSelection.selectAll(SlopeChart.SlopeLabelV2.selectorName).data(d => {
            return settings.dataLabels.show ? [d] : [];
        });

        slopes
            .enter()
            .append("path")
            .classed(SlopeChart.SlopePath.className, true);

        slopes
            .style("stroke", (dataPoint: SlopeChartDataPoint) => { return dataPoint.color; })
            .style("stroke-width", (dataPoint: SlopeChartDataPoint) => { return dataPoint.lineSize; })
            .style("stroke-linecap", lineCap)
            .style("stroke-dasharray", lineStyle)
            .on("click", function (d: SlopeChartDataPoint) {
                if (allowInteractions) {
                    let isCtrlPressed: boolean = (d3.event as MouseEvent).ctrlKey;
                    let dataPoint: SlopeChartDataPoint = d;
                    let currentSelectedIds = selectionManager.getSelectionIds()[0];
                    if ((dataPoint.selectionId !== currentSelectedIds) && !isCtrlPressed) {
                        selectionManager.clear();
                    }
                    selectionManager
                        .select(dataPoint.selectionId, isCtrlPressed)
                        .then((ids: ISelectionId[]) => {
                            syncSelectionState(chartSelection, ids);
                        });
                    (<Event>d3.event).stopPropagation();
                }
            })
            .transition()
            .duration(settings.general.duration)
            .attr("d", slopeData);

        slopes
            .exit()
            .remove();

        slopeMarkers
            .enter()
            .append("path")
            .classed(SlopeChart.SlopeMarker.className, true);

        slopeMarkers
            .style("fill", (dataPoint: SlopeChartDataPoint) => { return dataPoint.color; })
            .style("stroke", (dataPoint: SlopeChartDataPoint) => { return dataPoint.markerType === MarkerType.Cross ? dataPoint.color : null; })
            .style("stroke-width", (dataPoint: SlopeChartDataPoint) => { return dataPoint.markerType === MarkerType.Cross ? dataPoint.markerSize / 2 : null; })
            .transition()
            .duration(settings.general.duration)
            .attr("d", slopeMarker);

        slopeMarkers
            .exit()
            .remove();

        slopeLabelsV1
            .enter()
            .append("text")
            .classed(SlopeChart.SlopeLabelV1.className, true);

        slopeLabelsV1
            .attr("transform", labelTransformY1)
            .attr("x", labelX1)
            .attr("y", `${settings.dataLabels.fontSize / 4}px`)
            .style("fill", settings.dataLabels.fontColor)
            .style("font-family", settings.dataLabels.fontFamily)
            .style("font-size", `${settings.dataLabels.fontSize}pt`)
            .transition()
            .duration(settings.general.duration)
            .text(d => {
                switch (settings.dataLabels.labelType) {
                    case LabelType.Values:
                    case LabelType.NameValues:
                        return settings.formatting.dataLabelFormatter.format(d.value1);
                }
            })
            .each("end", () => arrangeLegendLabels(SlopeChart.SlopeLabelV1.selectorName));

        slopeLabelsV1
            .exit()
            .remove();

        slopeLabelsV2
            .enter()
            .append("text")
            .classed(SlopeChart.SlopeLabelV2.className, true);

        slopeLabelsV2
            .attr("transform", labelTransformY2)
            .attr("x", labelX2)
            .attr("y", `${settings.dataLabels.fontSize / 4}px`)
            .style("fill", settings.dataLabels.fontColor)
            .style("font-family", settings.dataLabels.fontFamily)
            .style("font-size", `${settings.dataLabels.fontSize}pt`)
            .transition()
            .duration(settings.general.duration)
            .text(d => {
                switch (settings.dataLabels.labelType) {
                    case LabelType.Name:
                        return d.label;
                    case LabelType.Values:
                        return settings.formatting.dataLabelFormatter.format(d.value2);
                    case LabelType.NameValues:
                        return `${settings.formatting.dataLabelFormatter.format(d.value2)} ${d.label}`;
                }
            })
            .each("end", () => arrangeLegendLabels(SlopeChart.SlopeLabelV2.selectorName));

        slopeLabelsV2
            .exit()
            .remove();

        tooltipServiceWrapper.addTooltip(chartSelection.selectAll(SlopeChart.SlopePath.selectorName),
            (tooltipEvent: TooltipEventArgs<SlopeChartDataPoint>) => tooltipEvent.data.tooltipInfo,
            (tooltipEvent: TooltipEventArgs<SlopeChartDataPoint>) => tooltipEvent.data.selectionId);

        tooltipServiceWrapper.addTooltip(chartSelection.selectAll(SlopeChart.SlopeMarker.selectorName),
            (tooltipEvent: TooltipEventArgs<SlopeChartDataPoint>) => tooltipEvent.data.tooltipInfo,
            (tooltipEvent: TooltipEventArgs<SlopeChartDataPoint>) => tooltipEvent.data.selectionId);

        tooltipServiceWrapper.addTooltip(chartSelection.selectAll(SlopeChart.SlopeLabelV1.selectorName),
            (tooltipEvent: TooltipEventArgs<SlopeChartDataPoint>) => tooltipEvent.data.tooltipInfo,
            (tooltipEvent: TooltipEventArgs<SlopeChartDataPoint>) => tooltipEvent.data.selectionId);

        tooltipServiceWrapper.addTooltip(chartSelection.selectAll(SlopeChart.SlopeLabelV2.selectorName),
            (tooltipEvent: TooltipEventArgs<SlopeChartDataPoint>) => tooltipEvent.data.tooltipInfo,
            (tooltipEvent: TooltipEventArgs<SlopeChartDataPoint>) => tooltipEvent.data.selectionId);
    }

    export function syncSelectionState(selections: d3.Selection<SlopeChartDataPoint>, selectionIds: ISelectionId[]) {
        let highlightOpacity = 1;
        let backgroundOpacity = 0.1;

        if (!selections || !selectionIds) {
            return;
        }

        if (!selectionIds.length) {
            selections
                .style("opacity", datapoint => {
                    const isHighlight: boolean = datapoint.highlight;
                    return isHighlight === undefined ? null : isHighlight ? highlightOpacity : backgroundOpacity;
                });
            return;
        }

        selections
            .style("opacity", datapoint => {
                const isSelected: boolean = isSelectionIdInArray(selectionIds, datapoint.selectionId);
                return isSelected ? highlightOpacity : backgroundOpacity;
            });
    }

    function isSelectionIdInArray(selectionIds: ISelectionId[], selectionId: ISelectionId): boolean {
        if (!selectionIds || !selectionId) {
            return false;
        }

        return selectionIds.some((currentSelectionId: ISelectionId) => {
            return currentSelectionId.getKey() === selectionId.getKey();
        });
    }
}