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
    // utils.tooltip
    import ITooltipServiceWrapper = powerbi.extensibility.utils.tooltip.ITooltipServiceWrapper;
    import TooltipEventArgs = powerbi.extensibility.utils.tooltip.TooltipEventArgs;
    // d3
    import Selection = d3.Selection;
    import Update = d3.selection.Update;
    // SlopeChartEnums
    import MarkerType = SlopeChartEnums.MarkerType;

    export function drawLegend(legendNodes: Selection<any>, settings: SlopeChartSettings, tooltipServiceWrapper: ITooltipServiceWrapper) {
        let legendMarker = (dataPoint) => {
            const markerType = settings.legend.useShapeMarker ? dataPoint.markerType : settings.legend.markerType;
            const s = settings.legend.strokeWidth;
            const s2 = s * 2;
            switch (markerType) {
                case MarkerType.None:
                    return `M 0, ${s} l ${s2} 0`;
                case MarkerType.Cross:
                    return `M ${s}, ${s} l -${s}, ${s} l ${s2}, -${s2} l -${s} ${s} l -${s}, -${s} l ${s2} ${s2}`;
                case MarkerType.Square:
                    return `M ${s}, ${s} l -${s}, ${s} l 0, -${s2} l ${s2}, 0 l 0, ${s2} l -${s2} 0`;
                case MarkerType.Triangle:
                    return `M ${s}, ${s} l -${s}, ${s} l ${s}, -${s2} l ${s}, ${s2} l -${s2}, 0`;
                case MarkerType.Diamond:
                    return `M ${s}, ${s} l 0, ${s} l -${s}, -${s} l ${s}, -${s} l ${s}, ${s} l -${s}, ${s}`;
                case MarkerType.Circle:
                default:
                    return `M ${s}, ${s} m -${s}, 0 a ${s}, ${s} 0 1, 1 ${s2}, 0 a ${s}, ${s} 0 1, 1 -${s2}, 0`;
            }
        };

        let arrangeLegendLabels = (dataPoint) => {
            let moveX = settings.general.margin.left;
            legendNodes
                .each(function() {
                    let size = this.getBoundingClientRect();
                    if ((moveX + size.width) > settings.general.viewport.width) {
                        moveX += settings.general.viewport.width;
                    }
                    d3.select(this)
                        .attr("transform", `translate(${moveX} 0)`)
                        .transition()
                        .duration(settings.general.duration)
                        .style("opacity", "1");
                    moveX += size.width + 5;
                });
        };

        const legendMaker: Update<SlopeChartDataLegend> = <Update<SlopeChartDataLegend>>legendNodes.selectAll(SlopeChart.LegendMarker.selectorName).data(dataPoints => {
            return [dataPoints];
        });
        const legendLabel: Update<SlopeChartDataLegend> = <Update<SlopeChartDataLegend>>legendNodes.selectAll(SlopeChart.LegendLabel.selectorName).data(dataPoints => {
            return [dataPoints];
        });

        legendNodes
            .style("opacity", "1e-6");

        legendLabel
            .enter()
            .append("text")
            .classed(SlopeChart.LegendLabel.className, true)
            .classed(SlopeChart.LegendTitle.className, dataPoint => { return dataPoint.isTitle; });

        legendLabel
            .attr("x", dataPoint => { return dataPoint.isTitle ? 0 : (settings.legend.strokeWidth * 2) + 2; })
            .attr("y", settings.legend.legendHeight * .70)
            .style("fill", settings.legend.fontColor)
            .style("font-family", settings.legend.fontFamily)
            .style("font-size", `${settings.legend.fontSize}pt`)
            .transition()
            .duration(settings.general.duration)
            .text(dataPoint => { return dataPoint.label; });

        legendLabel
            .exit()
            .remove();

        legendMaker
            .enter()
            .append("path")
            .classed(SlopeChart.LegendMarker.className, true);

        legendMaker
            .attr("transform", `translate(0 ${(settings.legend.legendHeight * .75) - (settings.legend.strokeWidth * 2)})`)
            .style("fill", dataPoint => {
                return dataPoint.markerType !== MarkerType.None ? dataPoint.color : "None";
            })
            .style("stroke", dataPoint => {
                return dataPoint.markerType === MarkerType.Cross || dataPoint.markerType === MarkerType.None ? dataPoint.color : null;
            })
            .style("stroke-width", dataPoint => {
                return dataPoint.markerType === MarkerType.Cross || dataPoint.markerType === MarkerType.None ? dataPoint.markerSize / 2 : null;
            })
            .transition()
            .duration(settings.general.duration)
            .attr("d", legendMarker)
            .each("end", arrangeLegendLabels);

        legendMaker
            .exit()
            .remove();

        tooltipServiceWrapper.addTooltip(legendNodes.selectAll(SlopeChart.LegendMarker.selectorName),
            (tooltipEvent: TooltipEventArgs<SlopeChartDataPoint>) => tooltipEvent.data.tooltipInfo,
            (tooltipEvent: TooltipEventArgs<SlopeChartDataPoint>) => tooltipEvent.data.selectionId);

        tooltipServiceWrapper.addTooltip(legendNodes.selectAll(SlopeChart.LegendLabel.selectorName),
            (tooltipEvent: TooltipEventArgs<SlopeChartDataPoint>) => tooltipEvent.data.tooltipInfo,
            (tooltipEvent: TooltipEventArgs<SlopeChartDataPoint>) => tooltipEvent.data.selectionId);
    }
}