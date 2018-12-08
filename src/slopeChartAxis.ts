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
    import textMeasurementService = powerbi.extensibility.utils.formatting.textMeasurementService;
    import IValueFormatter = powerbi.extensibility.utils.formatting.IValueFormatter;
    // d3
    import Selection = d3.Selection;
    // SlopeChartEnums
    import ScaleType = SlopeChartEnums.ScaleType;
    import ScaleOrientation = SlopeChartEnums.ScaleOrientation;

    export function calcAxisSettings(settings: SlopeChartSettings, data: SlopeChartData): SlopeAxisSettings {
        let axisSettings: SlopeAxisSettings = SlopeAxisSettings.getDefault();
        let dataPoints: SlopeChartDataPoint[] = data.dataPoints;

        // Caclulate optimum min/max of value axis
        axisSettings.Value1Axis.Options = getAxisOptions(
            d3.min(
                dataPoints.map((dataPoint: SlopeChartDataPoint) => { return <number>dataPoint.value1; }).concat(
                    dataPoints.map((dataPoint: SlopeChartDataPoint) => { return settings.chart.secondaryAxis ?  <number>dataPoint.value1 : <number>dataPoint.value2; }))
            ),
            d3.max(
                dataPoints.map((dataPoint: SlopeChartDataPoint) => { return <number>dataPoint.value1; }).concat(
                dataPoints.map((dataPoint: SlopeChartDataPoint) => { return settings.chart.secondaryAxis ?  <number>dataPoint.value1 : <number>dataPoint.value2; }))
            ),
            settings.axis1.start,
            settings.axis1.end
        );

        axisSettings.Value2Axis.Options = getAxisOptions(
            d3.min(dataPoints.map((dataPoint: SlopeChartDataPoint) => { return <number>dataPoint.value2; })),
            d3.max(dataPoints.map((dataPoint: SlopeChartDataPoint) => { return <number>dataPoint.value2; })),
            settings.axis2.start,
            settings.axis2.end
        );

        if (dataPoints.length > 0) {
            calculateCategoryAxisSettings(settings.category, axisSettings.CategoryAxis, data.dataPoints[0].valueLabels);
            calculateValueAxisSettings(settings.axis1, axisSettings.Value1Axis, settings.formatting.axis1Formatter);
            calculateValueAxisSettings(settings.axis2, axisSettings.Value2Axis, settings.formatting.axis2Formatter);
        }

        // TODO Refactor
        if ((settings.axis1.start !== undefined) && (settings.axis1.scaleType === ScaleType.Linear)) {
            if (settings.axis1.start !== axisSettings.Value1Axis.Options.min) {
                settings.axis1.start = axisSettings.Value1Axis.Options.min;
            }
        }
        if ((settings.axis2.start !== undefined) && (settings.axis2.scaleType === ScaleType.Linear)) {
            if (settings.axis2.start !== axisSettings.Value2Axis.Options.min) {
                settings.axis2.start = axisSettings.Value2Axis.Options.min;
            }
        }

        if (settings.axis1.scaleType === ScaleType.Log) {
            if (axisSettings.Value1Axis.Options.min <= 0) {
                axisSettings.Value1Axis.Options.min = settings.axis1.start = settings.axis1.start || 1;
            }
        }
        if (settings.axis2.scaleType === ScaleType.Log) {
            if (axisSettings.Value2Axis.Options.min <= 0) {
                axisSettings.Value2Axis.Options.min = settings.axis2.start = settings.axis2.start || 2;
            }
        }

        if (settings.axis1.end !== undefined) {
            if (settings.axis1.end !== axisSettings.Value1Axis.Options.max) {
                settings.axis1.end = axisSettings.Value1Axis.Options.max;
            }
        }
        if (settings.axis2.end !== undefined) {
            if (settings.axis2.end !== axisSettings.Value2Axis.Options.max) {
                settings.axis2.end = axisSettings.Value2Axis.Options.max;
            }
        }

        switch (settings.axis1.scaleType) {
            case ScaleType.Linear:
                axisSettings.Value1Axis.Scale = d3.scale.linear()
                    .domain([axisSettings.Value1Axis.Options.min || 0, axisSettings.Value1Axis.Options.max || 0]);
                break;
            case ScaleType.Log:
                axisSettings.Value1Axis.Scale = d3.scale.log()
                    .domain([axisSettings.Value1Axis.Options.min || 1, axisSettings.Value1Axis.Options.max || 1]);
                break;
            case ScaleType.Exp:
                axisSettings.Value1Axis.Scale = d3.scale.pow().exponent(2)
                    .domain([axisSettings.Value1Axis.Options.min || 1, axisSettings.Value1Axis.Options.max || 1]);
                break;
        }
        switch (settings.axis2.scaleType) {
            case ScaleType.Linear:
                axisSettings.Value2Axis.Scale = d3.scale.linear()
                    .domain([axisSettings.Value2Axis.Options.min || 0, axisSettings.Value2Axis.Options.max || 0]);
                break;
            case ScaleType.Log:
                axisSettings.Value2Axis.Scale = d3.scale.log()
                    .domain([axisSettings.Value2Axis.Options.min || 2, axisSettings.Value2Axis.Options.max || 2]);
                break;
        }

        switch (settings.axis1.orientation) {
            case ScaleOrientation.Ascending:
                axisSettings.Value1Axis.Scale
                    .range([settings.general.margin.bottom, settings.general.viewport.height - settings.general.margin.top - axisSettings.CategoryAxis.Height]);
                break;
            case ScaleOrientation.Descending:
                axisSettings.Value1Axis.Scale
                    .range([settings.general.viewport.height - settings.general.margin.top - axisSettings.CategoryAxis.Height, settings.general.margin.bottom]);
                break;
        }

        switch (settings.axis2.orientation) {
            case ScaleOrientation.Ascending:
                axisSettings.Value2Axis.Scale
                    .range([settings.general.margin.bottom, settings.general.viewport.height - settings.general.margin.top - axisSettings.CategoryAxis.Height]);
                break;
            case ScaleOrientation.Descending:
                axisSettings.Value2Axis.Scale
                    .range([settings.general.viewport.height - settings.general.margin.top - axisSettings.CategoryAxis.Height, settings.general.margin.bottom]);
                break;
        }

        // END refactor

        axisSettings.CategoryAxis.Scale = d3.scale.ordinal()
            .domain(data.dataPoints[0].valueLabels)
            .rangeBands([settings.general.margin.left + axisSettings.Value1Axis.Width, settings.general.viewport.width - (settings.general.margin.right + axisSettings.Value2Axis.Width)], 0);


        axisSettings.Generic.Width = settings.general.viewport.width - settings.general.margin.left - settings.general.margin.right - axisSettings.Value1Axis.Width - axisSettings.Value2Axis.Width;
        axisSettings.Generic.Height = settings.general.viewport.height - settings.general.margin.top - settings.general.margin.bottom - axisSettings.CategoryAxis.Height;

        return axisSettings;

        function calculateValueAxisSettings(axisSettings: AxisSettings, valueAxis: ValueAxis, valueFormatter: IValueFormatter) {
            if (axisSettings.show) { // Show axis
                for (let i = valueAxis.Options.min; i < valueAxis.Options.max; i += valueAxis.Options.tickSize) {
                    let tempSize = textMeasurementService.measureSvgTextWidth(axisSettings.axisTextProperties(), valueFormatter.format(i));
                    valueAxis.Width = tempSize > valueAxis.Width ? tempSize : valueAxis.Width;
                }
                valueAxis.Width += 10; // Axis width itself
                if (axisSettings.showTitle) {
                    valueAxis.LabelSize = textMeasurementService.measureSvgTextHeight(axisSettings.titleTextProperties(),
                        valueFormatter.format(axisSettings.title || axisSettings.defaultTitle));
                    valueAxis.Width += valueAxis.LabelSize;
                }
            }
        }

        function calculateCategoryAxisSettings(axisSettings: CategorySettings, categoryAxis: CategoryAxis, labels: string[]) {
            if (axisSettings.show) { // Show axis
                categoryAxis.Height = d3.max(
                    labels.map((label) => {
                        return textMeasurementService.measureSvgTextHeight(
                                axisSettings.axisTextProperties(),
                                label);
                    })
                );
            }
        }
    }

    export function drawAxis(rootElement: Selection<any>, settings: SlopeChartSettings, data: SlopeChartData, axisSettings: SlopeAxisSettings) {
        const axisCategory: Selection<any> = rootElement.selectAll(SlopeChart.CategoryAxis.selectorName);
        const axisValue1: Selection<any> = rootElement.selectAll(SlopeChart.Value1Axis.selectorName);
        const axisValue2: Selection<any> = rootElement.selectAll(SlopeChart.Value2Axis.selectorName);
        let axisValue1Label: Selection<any> = rootElement.selectAll(SlopeChart.Value1AxisLabel.selectorName);
        let axisValue2Label: Selection<any> = rootElement.selectAll(SlopeChart.Value2AxisLabel.selectorName);
        const axisGrid: Selection<any> = rootElement.select(SlopeChart.AxisGrid.selectorName);

        let arrangeCategoryLabels = () => {
            axisCategory.selectAll("text")
                .each(function() {
                    const availableWidth = axisSettings.CategoryAxis.DrawScale.rangeBand();
                    const box1 = this.getBoundingClientRect();
                    if (box1.width > availableWidth) {
                        d3.select(this).text("");
                    }
                });
        };

        if (settings.category.show) {
            const categoryAxis = d3.svg.axis()
                .scale(axisSettings.CategoryAxis.Scale)
                .orient("bottom")
                .ticks(0);

            axisCategory
                .attr("transform", `translate(0, ${settings.general.viewport.height - settings.general.margin.bottom - axisSettings.CategoryAxis.Height})`)
                .transition()
                .duration(settings.general.duration)
                .style("opacity", 1)
                .call(categoryAxis);

            axisCategory
                .selectAll("text")
                .transition()
                .duration(settings.general.duration)
                .style("fill", settings.category.fontColor)
                .style("font-family", settings.category.fontFamily)
                .style("font-size", `${settings.category.fontSize}pt`)
                .each("end", arrangeCategoryLabels);
        } else {
            axisCategory
                .transition()
                .duration(settings.general.duration)
                .style("opacity", 0);
        }

        if (settings.axis1.show) {
            const value1Axis = d3.svg.axis()
                .scale(axisSettings.Value1Axis.Scale)
                .orient("left")
                .tickFormat(d => settings.formatting.axis1Formatter.format(d))
                .ticks(axisSettings.Value1Axis.Options.ticks);

            axisValue1
                .attr("transform", `translate(${axisSettings.Value1Axis.Width + settings.general.margin.left}, ${settings.general.margin.top - settings.general.margin.bottom})`)
                .transition()
                .duration(settings.general.duration)
                .style("opacity", 1)
                .call(value1Axis);

            axisValue1
                .selectAll("line")
                .style("stroke", settings.axis1.showGrid ? null : settings.axis1.color);

            axisValue1
                .selectAll("text")
                .transition()
                .duration(settings.general.duration)
                .style("fill", settings.axis1.fontColor)
                .style("font-family", settings.axis1.fontFamily)
                .style("font-size", `${settings.axis1.fontSize}pt`);

            if (settings.axis1.showTitle) {
                let xTransform = settings.general.margin.left + (axisSettings.Value1Axis.LabelSize / 2);
                let labelWidth = textMeasurementService.measureSvgTextWidth(
                    settings.axis1.titleTextProperties(),
                    settings.axis1.title || settings.axis1.defaultTitle
                );
                let yTransform;
                switch (settings.axis1.titleAlignment) {
                    case "left":
                        yTransform = settings.general.viewport.height - axisSettings.CategoryAxis.Height - settings.general.margin.bottom;
                        break;
                    case "right":
                        yTransform = labelWidth + settings.general.margin.top;
                        break;
                    case "center":
                    default:
                        yTransform =
                            settings.general.margin.top +
                            ((settings.general.viewport.height - settings.general.margin.bottom - settings.general.margin.top - axisSettings.CategoryAxis.Height) / 2) +
                            (labelWidth / 2);
                        break;
                }
                axisValue1Label
                    .attr("transform", "translate(" + xTransform + ", " + yTransform + ") rotate(-90)")
                    .transition()
                    .duration(settings.general.duration)
                    .style("opacity", 1)
                    .text(settings.axis1.title || settings.axis1.defaultTitle)
                    .style("fill", settings.axis1.titleFontColor)
                    .style("font-family", settings.axis1.titleFontFamily)
                    .style("font-size", `${settings.axis1.titleFontSize}pt`);
            } else {
                axisValue1Label.transition()
                    .duration(settings.general.duration)
                    .style("opacity", 0);
            }
        } else {
            axisValue1
                .transition()
                .duration(settings.general.duration)
                .style("opacity", 0);
            axisValue1Label.transition()
                .duration(settings.general.duration)
                .style("opacity", 0);
        }

        if (settings.chart.secondaryAxis) {
            const value2Axis = d3.svg.axis()
                .scale(axisSettings.Value2Axis.Scale)
                .orient("right")
                .tickFormat(d => settings.formatting.axis2Formatter.format(d))
                .ticks(axisSettings.Value2Axis.Options.ticks);

            axisValue2
                .attr("transform", `translate(${settings.general.viewport.width - (settings.general.margin.right + axisSettings.Value2Axis.Width)}, ${settings.general.margin.top - settings.general.margin.bottom})`)
                .transition()
                .duration(settings.general.duration)
                .style("opacity", 1)
                .call(value2Axis);

            axisValue2
                .selectAll("line")
                .style("stroke", settings.axis2.color);

            axisValue2
                .selectAll("text")
                .transition()
                .duration(settings.general.duration)
                .style("fill", settings.axis2.fontColor)
                .style("font-family", settings.axis2.fontFamily)
                .style("font-size", `${settings.axis2.fontSize}pt`);

            if (settings.axis2.showTitle) {
                let xTransform = settings.general.viewport.width - settings.general.margin.right - (axisSettings.Value2Axis.LabelSize / 2);
                let labelWidth = textMeasurementService.measureSvgTextWidth(
                    settings.axis2.titleTextProperties(),
                    settings.axis2.title || settings.axis2.defaultTitle
                );
                let yTransform;
                switch (settings.axis2.titleAlignment) {
                    case "left":
                        yTransform = settings.general.margin.top;
                        break;
                    case "right":
                        yTransform = settings.general.viewport.height - axisSettings.CategoryAxis.Height - labelWidth - settings.general.margin.bottom;
                        break;
                    case "center":
                    default:
                        yTransform =
                            settings.general.margin.top +
                            ((settings.general.viewport.height - settings.general.margin.bottom - settings.general.margin.top - axisSettings.CategoryAxis.Height) / 2) -
                            (labelWidth / 2);
                        break;
                }
                axisValue2Label
                    .attr("transform", "translate(" + xTransform + ", " + yTransform + ") rotate(90)")
                    .transition()
                    .duration(settings.general.duration)
                    .style("opacity", 1)
                    .text(settings.axis2.title || settings.axis2.defaultTitle)
                    .style("fill", settings.axis2.titleFontColor)
                    .style("font-family", settings.axis2.titleFontFamily)
                    .style("font-size", `${settings.axis2.titleFontSize}pt`);
            } else  {
                axisValue2Label.transition()
                    .duration(settings.general.duration)
                    .style("opacity", 0);
            }
        } else {
            axisValue2
                .transition()
                .duration(settings.general.duration)
                .style("opacity", 0);
            axisValue2Label.transition()
                .duration(settings.general.duration)
                .style("opacity", 0);
        }

        if ((settings.axis1.showGrid) && (settings.axis1.show)) {
            let yMajorGrid = d3.svg.axis()
                .scale(axisSettings.Value1Axis.Scale)
                .orient("left")
                .ticks(axisSettings.Value1Axis.Options.ticks)
                .outerTickSize(0)
                .innerTickSize(0)
                .tickFormat((d) => { return null; });

            axisGrid
                .attr("transform", `translate(${axisSettings.Value1Axis.Width + settings.general.margin.left}, ${settings.general.margin.top - settings.general.margin.bottom})`)
                .transition()
                .duration(settings.general.duration)
                .style("opacity", 1)
                .call(yMajorGrid);

            axisGrid
                .selectAll("line")
                .transition()
                .duration(settings.general.duration)
                .style("stroke", settings.axis1.gridColor)
                .style("stroke-width", settings.axis1.strokeWidth)
                .attr("x2", settings.general.viewport.width - axisSettings.Value1Axis.Width - settings.general.margin.right - settings.general.margin.left);
        } else {
            axisGrid.transition()
                .duration(settings.general.duration)
                .style("opacity", 0);
        }
    }

    export function getAxisOptions(min: number, max: number, fixedMin: number, fixedMax: number): SlopeAxisOptions {
        let isFixedMin = fixedMin !== undefined ;
        let isFixedMax = fixedMax !== undefined;
        let min1 = (min === 0 ? 0 : min > 0 ? (min * .99) - ((max - min) / 100) : (min * 1.01) - ((max - min) / 100));
        let max1 = (max === 0 ? min === 0 ? 1 : 0 : max < 0 ? (max * .99) + ((max - min) / 100) : (max * 1.01) + ((max - min) / 100));

        let p = Math.log(max1 - min1) / Math.log(10);
        let f = Math.pow(10, p - Math.floor(p));

        let scale = 0.2;

        if (f <= 1.2) scale = 0.2;
        else if (f <= 2.5) scale = 0.2;
        else if (f <= 5) scale = 0.5;
        else if (f <= 10) scale = 1;
        else scale = 2;

        let tickSize = scale * Math.pow(10, Math.floor(p));
        let maxValue = tickSize * (Math.floor(max1 / tickSize) + 1);
        let minValue = tickSize * Math.floor(min1 / tickSize);
        let ticks = ((maxValue - minValue) / tickSize) + 1;

        return {
            tickSize: tickSize,
            min: isFixedMin ? fixedMin < max ? fixedMin : minValue : minValue,
            max: isFixedMax ? fixedMax > min ? fixedMax : maxValue : maxValue,
            ticks: ticks,
        };
    }
}